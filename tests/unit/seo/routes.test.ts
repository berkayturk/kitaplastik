import { describe, it, expect } from "vitest";
import { PUBLIC_ROUTES, buildAlternates } from "@/lib/seo/routes";

describe("seo routes", () => {
  it("lists all public routes", () => {
    expect(PUBLIC_ROUTES).toContain("/");
    expect(PUBLIC_ROUTES).toContain("/sektorler");
    expect(PUBLIC_ROUTES).toContain("/sektorler/cam-yikama");
    expect(PUBLIC_ROUTES).toContain("/sektorler/kapak");
    expect(PUBLIC_ROUTES).toContain("/sektorler/tekstil");
    expect(PUBLIC_ROUTES).toContain("/urunler");
    expect(PUBLIC_ROUTES).toContain("/muhendislik");
    expect(PUBLIC_ROUTES).toContain("/atolye");
    expect(PUBLIC_ROUTES).toContain("/kalite");
    expect(PUBLIC_ROUTES).toContain("/hakkimizda");
    expect(PUBLIC_ROUTES).toContain("/iletisim");
    expect(PUBLIC_ROUTES).toContain("/referanslar");
    expect(PUBLIC_ROUTES).toHaveLength(12);
  });

  it("buildAlternates produces hreflang map with x-default", () => {
    const alt = buildAlternates("/hakkimizda", "https://kitaplastik.com");
    expect(alt.languages).toEqual({
      tr: "https://kitaplastik.com/tr/hakkimizda",
      en: "https://kitaplastik.com/en/hakkimizda",
      ru: "https://kitaplastik.com/ru/hakkimizda",
      ar: "https://kitaplastik.com/ar/hakkimizda",
    });
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr/hakkimizda");
  });
});
