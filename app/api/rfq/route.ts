// app/api/rfq/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { customRfqSchema, standartRfqSchema } from "@/lib/validation/rfq";
import { verifyTurnstile } from "@/lib/turnstile";
import { rfqLimiter, ipFromHeaders } from "@/lib/rate-limit";
import { getResend } from "@/lib/email/client";
import { env, serverEnv } from "@/lib/env";
import { renderRfqTeamEmail } from "@/lib/email/templates/rfq-team";
import { renderRfqCustomerEmail } from "@/lib/email/templates/rfq-customer";
import { recordAudit } from "@/lib/audit";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = ipFromHeaders(request.headers);
  const ua = request.headers.get("user-agent") ?? null;

  // 1) Rate limit
  const rl = rfqLimiter.check(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  // 2) Parse JSON + discriminate
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const kind = (raw as { kind?: string } | null)?.kind;
  if (kind !== "custom" && kind !== "standart") {
    return NextResponse.json({ ok: false, error: "bad_kind" }, { status: 400 });
  }

  // 3) Validate
  const schema = kind === "custom" ? customRfqSchema : standartRfqSchema;
  const parsed = schema.safeParse(raw);
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

  // 4) Turnstile
  const turnstileOk = await verifyTurnstile(input.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json({ ok: false, error: "turnstile_failed" }, { status: 403 });
  }

  // 5) Persist to Supabase
  const supabase = createServiceClient();
  const contact = input.contact;
  const attachments =
    "attachments" in input && Array.isArray(input.attachments) ? input.attachments : [];
  const payloadJson = stripForStorage(input as Record<string, unknown>);

  const { data: row, error: insertError } = await supabase
    .from("rfqs")
    .insert({
      type: kind,
      status: "new",
      locale: input.locale,
      contact: contact as never,
      payload: payloadJson as never,
      attachments: attachments as never,
      ip_address: ip === "unknown" ? null : ip,
      user_agent: ua,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    console.error("[rfq] insert failed", insertError?.message);
    return NextResponse.json({ ok: false, error: "db_failed" }, { status: 500 });
  }

  const rfqId = row.id;
  const origin = env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  // 6) Emails (best-effort; don't fail response if email fails — RFQ is persisted)
  const team = renderRfqTeamEmail({
    id: rfqId,
    type: kind,
    locale: input.locale,
    contact: {
      name: contact.name,
      email: contact.email,
      company: contact.company,
      phone: contact.phone,
      country: contact.country,
    },
    payload: payloadJson,
    attachmentCount: attachments.length,
    ip,
    adminUrl: `${origin}/admin/inbox/${rfqId}`,
  });
  const customer = renderRfqCustomerEmail({
    name: contact.name,
    rfqId,
    type: kind,
    locale: input.locale,
  });

  try {
    const resend = getResend();
    await Promise.all([
      resend.emails.send({
        from: serverEnv.RESEND_FROM_EMAIL,
        to: serverEnv.RESEND_TEAM_EMAIL,
        replyTo: contact.email,
        subject: team.subject,
        html: team.html,
        text: team.text,
      }),
      resend.emails.send({
        from: serverEnv.RESEND_FROM_EMAIL,
        to: contact.email,
        subject: customer.subject,
        html: customer.html,
        text: customer.text,
      }),
    ]);
  } catch (e) {
    console.error("[rfq] email failed (rfq already persisted)", e);
    // Do NOT fail the request
  }

  await recordAudit({
    action: "rfq_submitted",
    entity_type: "rfq",
    entity_id: rfqId,
    user_id: null,
    ip,
    diff: { type: kind, locale: input.locale, attachmentCount: attachments.length },
  });

  return NextResponse.json({ ok: true, id: rfqId });
}

function stripForStorage(input: Record<string, unknown>): Record<string, unknown> {
  // turnstileToken, honeypot, and contact are stored separately or are runtime-only.
  const {
    turnstileToken: _t,
    honeypot: _h,
    contact: _c,
    ...rest
  } = input as {
    turnstileToken: string;
    honeypot: string;
    contact: unknown;
    [k: string]: unknown;
  };
  void _t;
  void _h;
  void _c;
  return rest;
}
