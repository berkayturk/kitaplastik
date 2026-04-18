import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("geçerli env değişkenleriyle parse eder", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-xyz";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-key";
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    process.env.RESEND_API_KEY = "re_test";
    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key-xyz");
  });

  it("eksik zorunlu değişken için anlamlı hata fırlatır", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-xyz";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-key";
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    process.env.RESEND_API_KEY = "re_test";
    await expect(import("@/lib/env")).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("geçersiz URL formatı için hata fırlatır", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-xyz";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc-key";
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    process.env.RESEND_API_KEY = "re_test";
    await expect(import("@/lib/env")).rejects.toThrow(/url/i);
  });
});
