import { describe, it, expect, afterEach, vi } from "vitest";

describe("env schema", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("parses all required public keys on client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubGlobal("window", {});
    const mod = await import("@/lib/env");
    expect(mod.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://x.supabase.co");
  });

  it("throws on server when server-only keys missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    // Force server mode by removing the window global
    vi.stubGlobal("window", undefined);
    await expect(import("@/lib/env")).rejects.toThrow(/env/i);
  });
});
