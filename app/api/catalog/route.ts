// app/api/catalog/route.ts
//
// Catalog download request endpoint. Validates email + locale + Turnstile,
// rate-limits per IP, logs the request in catalog_requests, and sends the
// locale-appropriate PDF link by email.

import { NextResponse, type NextRequest } from "next/server";
import { catalogRequestSchema } from "@/lib/validation/catalog";
import { verifyTurnstile } from "@/lib/turnstile";
import { catalogLimiter, ipFromHeaders } from "@/lib/rate-limit";
import { getResend } from "@/lib/email/client";
import { serverEnv, env } from "@/lib/env";
import { renderCatalogDeliveryEmail } from "@/lib/email/templates/catalog-delivery";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

function catalogPdfUrl(sector: string, locale: "tr" | "en" | "ru" | "ar"): string {
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  // Dynamic endpoint; generates + caches the PDF on first hit per dataHash.
  return `${origin}/api/catalog/${sector}/${locale}`;
}

export async function POST(request: NextRequest) {
  // IP is used in-memory for rate-limit + Turnstile only; never persisted
  // (Plan 5b data minimization — no consent banner, no DB IP/UA storage).
  const ip = ipFromHeaders(request.headers);

  // 1) Rate limit
  const rl = catalogLimiter.check(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  // 2) Parse + validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const parsed = catalogRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_input",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // 3) Turnstile
  const turnstileOk = await verifyTurnstile(input.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ ok: false, error: "turnstile_failed" }, { status: 403 });
  }

  // 4) Record request (best-effort — do not block email on DB failure).
  // Plan 5b: only email + locale persisted; pg_cron auto-deletes after 30 d.
  const svc = createServiceClient();
  try {
    await svc.from("catalog_requests").insert({
      email: input.email,
      locale: input.locale,
      // sector is part of the request payload but not a column on
      // catalog_requests — logged into the audit_log row instead so no
      // schema change is required for the sector selector rollout.
    });
  } catch (e) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(e, { tags: { route: "api/catalog", phase: "record_request" } });
    // Continue — delivering the catalog is more important than the log.
  }

  // 5) Send email
  const pdfUrl = catalogPdfUrl(input.sector, input.locale);
  const mail = renderCatalogDeliveryEmail({
    email: input.email,
    locale: input.locale,
    pdfUrl,
  });
  const resend = getResend();
  try {
    await resend.emails.send({
      from: serverEnv.RESEND_FROM_EMAIL,
      to: input.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (e) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(e, { tags: { route: "api/catalog", phase: "resend" } });
    return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
  }

  // 6) Audit log — IP is intentionally null for end-user catalog requests
  // (Plan 5b data minimization). Admin actions still log IP for forensics.
  await recordAudit({
    action: "catalog_requested",
    entity_type: "catalog_request",
    entity_id: null,
    user_id: null,
    ip: null,
    diff: { locale: input.locale, sector: input.sector },
  });

  return NextResponse.json({ ok: true });
}
