import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

describe("verifyTurnstile", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    vi.stubEnv("RESEND_API_KEY", "re_test");
  });

  it("returns true when Cloudflare siteverify succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile("tok", "1.2.3.4")).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns false on siteverify failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, "error-codes": ["invalid-input"] }),
    } as Response);
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile("bad", null)).resolves.toBe(false);
  });

  it("returns false on network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("net"));
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile("tok", null)).resolves.toBe(false);
  });

  it("returns false on empty token without calling fetch", async () => {
    global.fetch = vi.fn();
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile("", null)).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
