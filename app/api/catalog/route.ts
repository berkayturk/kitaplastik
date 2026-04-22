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

function catalogPdfUrl(locale: "tr" | "en" | "ru" | "ar"): string {
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return `${origin}/catalogs/kitaplastik-${locale}.pdf`;
}

export async function POST(request: NextRequest) {
  const ip = ipFromHeaders(request.headers);
  const userAgent = request.headers.get("user-agent") ?? null;

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

  // 4) Record request (best-effort — do not block email on DB failure)
  const svc = createServiceClient();
  try {
    // Cast: catalog_requests isn't in the generated Database type yet;
    // regenerate via `supabase gen types typescript --linked` after deploy.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any).from("catalog_requests").insert({
      email: input.email,
      locale: input.locale,
      ip_address: ip === "unknown" ? null : ip,
      user_agent: userAgent,
    });
  } catch (e) {
    console.error("[catalog] failed to record request", e);
    // Continue — delivering the catalog is more important than the log.
  }

  // 5) Send email
  const pdfUrl = catalogPdfUrl(input.locale);
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
    console.error("[catalog] resend failed", e);
    return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
  }

  // 6) Audit log
  await recordAudit({
    action: "catalog_requested",
    entity_type: "catalog_request",
    entity_id: null,
    user_id: null,
    ip,
    diff: { locale: input.locale },
  });

  return NextResponse.json({ ok: true });
}
