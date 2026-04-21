import { describe, it, expect } from "vitest";
import { PUBLIC_ROUTES, buildAlternates } from "@/lib/seo/routes";

describe("seo routes", () => {
  it("lists all public routes", () => {
    expect(PUBLIC_ROUTES).toContain("/");
    expect(PUBLIC_ROUTES).toContain("/sectors");
    expect(PUBLIC_ROUTES).toContain("/sectors/bottle-washing");
    expect(PUBLIC_ROUTES).toContain("/sectors/caps");
    expect(PUBLIC_ROUTES).toContain("/sectors/textile");
    expect(PUBLIC_ROUTES).toContain("/products");
    expect(PUBLIC_ROUTES).toContain("/about");
    expect(PUBLIC_ROUTES).toContain("/contact");
    expect(PUBLIC_ROUTES).toContain("/references");
    expect(PUBLIC_ROUTES).toContain("/request-quote");
    expect(PUBLIC_ROUTES).toContain("/request-quote/custom");
    expect(PUBLIC_ROUTES).toContain("/request-quote/standard");
    expect(PUBLIC_ROUTES).toHaveLength(12);
  });

  it("buildAlternates produces hreflang map with x-default", () => {
    const alt = buildAlternates("/about", "https://kitaplastik.com");
    expect(alt.languages).toEqual({
      tr: "https://kitaplastik.com/tr/about",
      en: "https://kitaplastik.com/en/about",
      ru: "https://kitaplastik.com/ru/about",
      ar: "https://kitaplastik.com/ar/about",
    });
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr/about");
  });
});
