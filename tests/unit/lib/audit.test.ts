import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

describe("recordAudit", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "sec");
    vi.stubEnv("RESEND_API_KEY", "re");
  });
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("calls supabase service client insert with correct row", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => ({ from }),
    }));
    const { recordAudit } = await import("@/lib/audit");
    await recordAudit({
      action: "rfq_created",
      entity_type: "rfq",
      entity_id: "11111111-1111-1111-1111-111111111111",
      ip: "1.2.3.4",
      user_id: null,
      diff: { status: "new" },
    });
    expect(from).toHaveBeenCalledWith("audit_log");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "rfq_created",
        entity_type: "rfq",
        ip_address: "1.2.3.4",
        diff: { status: "new" },
      }),
    );
  });

  it("swallows errors so caller flow continues", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "oops" } });
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => ({ from: () => ({ insert }) }),
    }));
    const { recordAudit } = await import("@/lib/audit");
    await expect(
      recordAudit({
        action: "x",
        entity_type: "y",
        entity_id: null,
        ip: null,
        user_id: null,
        diff: null,
      }),
    ).resolves.toBeUndefined();
  });
});
