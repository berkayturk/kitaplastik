// app/api/contact/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { contactSchema } from "@/lib/validation/contact";
import { verifyTurnstile } from "@/lib/turnstile";
import { contactLimiter, ipFromHeaders } from "@/lib/rate-limit";
import { getResend } from "@/lib/email/client";
import { serverEnv } from "@/lib/env";
import { renderContactTeamEmail } from "@/lib/email/templates/contact-team";
import { renderContactCustomerEmail } from "@/lib/email/templates/contact-customer";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = ipFromHeaders(request.headers);

  // 1) Rate limit
  const rl = contactLimiter.check(ip);
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
  const parsed = contactSchema.safeParse(body);
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

  // 4) Send emails (team + customer)
  const resend = getResend();
  const teamMail = renderContactTeamEmail({
    name: input.name,
    email: input.email,
    company: input.company || undefined,
    phone: input.phone || undefined,
    subject: input.subject,
    message: input.message,
    locale: input.locale,
    ip,
  });
  const customerMail = renderContactCustomerEmail({ name: input.name, locale: input.locale });

  try {
    await Promise.all([
      resend.emails.send({
        from: serverEnv.RESEND_FROM_EMAIL,
        to: serverEnv.RESEND_TEAM_EMAIL,
        replyTo: input.email,
        subject: teamMail.subject,
        html: teamMail.html,
        text: teamMail.text,
      }),
      resend.emails.send({
        from: serverEnv.RESEND_FROM_EMAIL,
        to: input.email,
        subject: customerMail.subject,
        html: customerMail.html,
        text: customerMail.text,
      }),
    ]);
  } catch (e) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(e, { tags: { route: "api/contact", phase: "resend" } });
    return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
  }

  // 5) Audit log
  await recordAudit({
    action: "contact_submitted",
    entity_type: "contact",
    entity_id: null,
    user_id: null,
    ip,
    diff: { subject: input.subject, locale: input.locale, company: input.company || null },
  });

  return NextResponse.json({ ok: true, recipient: serverEnv.RESEND_TEAM_EMAIL });
}
