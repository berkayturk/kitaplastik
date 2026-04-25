import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
const fromSpy = vi.fn(() => ({ insert: insertSpy }));
const sendSpy = vi.fn().mockResolvedValue({ id: "test-msg" });

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
  return {
    ...actual,
    catalogLimiter: { check: vi.fn(() => ({ allowed: true, retryAfter: 0 })) },
  };
});

vi.mock("@/lib/email/client", () => ({
  getResend: () => ({ emails: { send: sendSpy } }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: fromSpy }),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SITE_URL: "https://test.kitaplastik.com" },
  serverEnv: { RESEND_FROM_EMAIL: "noreply@test.kitaplastik.com" },
}));

import { POST } from "@/app/api/catalog/route";
import { recordAudit } from "@/lib/audit";

function buildRequest(headers: Record<string, string> = {}): NextRequest {
  const req = new Request("http://test.local/api/catalog", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.42",
      "user-agent": "Mozilla/5.0 test-agent",
      ...headers,
    },
    body: JSON.stringify({
      email: "user@example.com",
      locale: "tr",
      sector: "all",
      turnstileToken: "ok-token",
      honeypot: "",
    }),
  });
  return req as unknown as NextRequest;
}

describe("POST /api/catalog — data minimization (Plan 5b PR A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertSpy.mockResolvedValue({ data: null, error: null });
    fromSpy.mockReturnValue({ insert: insertSpy });
    sendSpy.mockResolvedValue({ id: "test-msg" });
  });

  it("does NOT persist ip_address or user_agent in catalog_requests", async () => {
    const res = await POST(buildRequest());
    expect(res.status).toBe(200);

    expect(fromSpy).toHaveBeenCalledWith("catalog_requests");
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toBeDefined();
    expect(payload).not.toHaveProperty("ip_address");
    expect(payload).not.toHaveProperty("user_agent");
    expect(payload).toMatchObject({ email: "user@example.com", locale: "tr" });
  });

  it("does NOT pass IP to audit_log for catalog_requested events", async () => {
    const res = await POST(buildRequest());
    expect(res.status).toBe(200);

    expect(recordAudit).toHaveBeenCalledTimes(1);
    const auditEntry = vi.mocked(recordAudit).mock.calls[0]?.[0];
    expect(auditEntry).toBeDefined();
    expect(auditEntry).toMatchObject({
      action: "catalog_requested",
      ip: null,
    });
  });
});
