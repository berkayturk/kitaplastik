import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { sendSpy, renderTeamSpy } = vi.hoisted(() => ({
  sendSpy: vi.fn().mockResolvedValue({ id: "test-msg" }),
  renderTeamSpy: vi.fn(),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
  return {
    ...actual,
    contactLimiter: { check: vi.fn(() => ({ allowed: true, retryAfter: 0 })) },
  };
});

vi.mock("@/lib/email/client", () => ({
  getResend: () => ({ emails: { send: sendSpy } }),
}));

vi.mock("@/lib/email/templates/contact-team", async () => {
  const actual = await vi.importActual<typeof import("@/lib/email/templates/contact-team")>(
    "@/lib/email/templates/contact-team",
  );
  renderTeamSpy.mockImplementation(actual.renderContactTeamEmail);
  return { renderContactTeamEmail: renderTeamSpy };
});

vi.mock("@/lib/email/templates/contact-customer", () => ({
  renderContactCustomerEmail: () => ({ subject: "ack", html: "<p>ack</p>", text: "ack" }),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SITE_URL: "https://test.kitaplastik.com" },
  serverEnv: {
    RESEND_FROM_EMAIL: "noreply@test.kitaplastik.com",
    RESEND_TEAM_EMAIL: "team@test.kitaplastik.com",
  },
}));

import { POST } from "@/app/api/contact/route";
import { recordAudit } from "@/lib/audit";

function buildRequest(): NextRequest {
  const req = new Request("http://test.local/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.42",
      "user-agent": "Mozilla/5.0 test-agent",
    },
    body: JSON.stringify({
      name: "Ali Veli",
      email: "user@example.com",
      company: "Acme",
      phone: "",
      subject: "quote",
      message: "Merhaba, teklif istiyorum.",
      locale: "tr",
      turnstileToken: "ok-token",
      honeypot: "",
    }),
  });
  return req as unknown as NextRequest;
}

describe("POST /api/contact — IP minimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendSpy.mockResolvedValue({ id: "test-msg" });
  });

  it("does NOT pass IP to the team email template", async () => {
    const res = await POST(buildRequest());
    expect(res.status).toBe(200);

    expect(renderTeamSpy).toHaveBeenCalledTimes(1);
    const arg = renderTeamSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(arg).toBeDefined();
    expect(arg).not.toHaveProperty("ip");
  });

  it("does NOT include the requester IP in the rendered team email", async () => {
    const res = await POST(buildRequest());
    expect(res.status).toBe(200);

    const sendCalls = sendSpy.mock.calls.map((c) => c[0] as { html: string; text: string });
    const teamCall = sendCalls.find((c) => c.html.includes("iletişim formu mesajı"));
    expect(teamCall).toBeDefined();
    expect(teamCall!.html).not.toContain("203.0.113.42");
    expect(teamCall!.text).not.toContain("203.0.113.42");
    expect(teamCall!.html).not.toMatch(/<b>IP<\/b>/i);
    expect(teamCall!.text).not.toMatch(/^IP:\s/m);
  });

  it("does NOT pass IP to audit_log for contact_submitted events", async () => {
    const res = await POST(buildRequest());
    expect(res.status).toBe(200);

    expect(recordAudit).toHaveBeenCalledTimes(1);
    const auditEntry = vi.mocked(recordAudit).mock.calls[0]?.[0];
    expect(auditEntry).toBeDefined();
    expect(auditEntry).toMatchObject({
      action: "contact_submitted",
      ip: null,
    });
  });
});
