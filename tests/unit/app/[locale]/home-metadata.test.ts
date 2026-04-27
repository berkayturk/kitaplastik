// @vitest-environment node
//
// next-intl v4's `react-server` export condition isn't honored by Vitest's
// resolver, so a real `getTranslations` import resolves to the client stub
// that throws "not supported in Client Components". Mock it here — this
// test only verifies metadata wiring (canonical, hreflang, x-default), not
// translated content.
import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) => {
    const translate = (key: string) => `${namespace}.${key}`;
    return Object.assign(translate, {
      raw: (key: string) => `${namespace}.${key}`,
    });
  }),
}));

describe("app/[locale]/page.tsx — generateMetadata canonical + hreflang wiring", () => {
  let generateMetadata: typeof import("@/app/[locale]/page").generateMetadata;

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kitaplastik.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("RESEND_API_KEY", "re_test");

    const mod = await import("@/app/[locale]/page");
    generateMetadata = mod.generateMetadata;
  });

  it("emits self-canonical for /tr", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "tr" }) });
    expect(meta.alternates?.canonical).toBe("https://kitaplastik.com/tr");
  });

  it("emits self-canonical for /en", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(meta.alternates?.canonical).toBe("https://kitaplastik.com/en");
  });

  it("emits 4 locale alternates + x-default", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "tr" }) });
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(Object.keys(langs)).toHaveLength(5);
    expect(langs.tr).toBe("https://kitaplastik.com/tr");
    expect(langs.en).toBe("https://kitaplastik.com/en");
    expect(langs.ru).toBe("https://kitaplastik.com/ru");
    expect(langs.ar).toBe("https://kitaplastik.com/ar");
    expect(langs["x-default"]).toBe("https://kitaplastik.com/tr");
  });

  it("title and description are populated from i18n messages", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "tr" }) });
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
    expect(typeof meta.title).toBe("string");
    expect((meta.title as string).length).toBeGreaterThan(0);
  });
});
