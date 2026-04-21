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
    const mod = await import("@/lib/env.client");
    expect(mod.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://x.supabase.co");
  });

  it("throws on client when required public keys missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    await expect(import("@/lib/env.client")).rejects.toThrow(/env/i);
  });
});
