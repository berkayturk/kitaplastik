import { describe, it, expect, vi, beforeAll } from "vitest";

// sitemap.ts imports @/lib/env which has `import "server-only"`.
// Mock that module so vitest doesn't throw the server-only error.
vi.mock("server-only", () => ({}));

describe("sitemap.ts — native URL generation", () => {
  let entries: Awaited<ReturnType<typeof import("@/app/sitemap").default>>;
  let urls: string[];

  beforeAll(async () => {
    // Stub required env vars before the module is loaded.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kitaplastik.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubEnv("RESEND_API_KEY", "re_test");

    // Dynamic import ensures the module picks up the stubbed env.
    const { default: sitemap } = await import("@/app/sitemap");
    entries = sitemap();
    urls = entries.map((e) => e.url);
  });

  it("generates 48 URLs (12 routes × 4 locales)", () => {
    expect(entries).toHaveLength(48);
  });

  it("includes TR native slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/tr/urunler");
    expect(urls).toContain("https://kitaplastik.com/tr/hakkimizda");
    expect(urls).toContain("https://kitaplastik.com/tr/iletisim");
    expect(urls).toContain("https://kitaplastik.com/tr/katalog");
    expect(urls).toContain("https://kitaplastik.com/tr/sektorler/cam-yikama");
  });

  it("includes RU native slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/ru/produktsiya");
    expect(urls).toContain("https://kitaplastik.com/ru/kontakty");
    expect(urls).toContain("https://kitaplastik.com/ru/o-nas");
    expect(urls).toContain("https://kitaplastik.com/ru/katalog");
    expect(urls).toContain("https://kitaplastik.com/ru/otrasli/moyka-butylok");
  });

  it("includes AR native slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/ar/al-muntajat");
    expect(urls).toContain("https://kitaplastik.com/ar/man-nahnu");
    expect(urls).toContain("https://kitaplastik.com/ar/ittisal");
    expect(urls).toContain("https://kitaplastik.com/ar/al-katalog");
    expect(urls).toContain("https://kitaplastik.com/ar/al-qitaat/ghasil-zujajat");
  });

  it("keeps EN canonical slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/en/products");
    expect(urls).toContain("https://kitaplastik.com/en/about");
    expect(urls).toContain("https://kitaplastik.com/en/catalog");
    expect(urls).toContain("https://kitaplastik.com/en/sectors/bottle-washing");
  });

  it("root URLs have no trailing slash", () => {
    expect(urls).toContain("https://kitaplastik.com/tr");
    expect(urls).toContain("https://kitaplastik.com/en");
    expect(urls).toContain("https://kitaplastik.com/ru");
    expect(urls).toContain("https://kitaplastik.com/ar");
  });

  it("each entry has alternates.languages with 4 locales", () => {
    for (const entry of entries) {
      expect(entry.alternates?.languages).toBeDefined();
      const langs = entry.alternates?.languages as Record<string, string>;
      expect(Object.keys(langs)).toHaveLength(4);
    }
  });
});
