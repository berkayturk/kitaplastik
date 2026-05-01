import { describe, it, expect } from "vitest";
import { buildAlternates, PUBLIC_ROUTES } from "@/lib/seo/routes";

const ORIGIN = "https://kitaplastik.com";

describe("buildAlternates — per-locale native URLs", () => {
  it("/products", () => {
    const alt = buildAlternates("/products", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/urunler");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en/products");
    expect(alt.languages.ru).toBe("https://kitaplastik.com/ru/produktsiya");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-muntajat");
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr/urunler");
  });

  it("/about", () => {
    const alt = buildAlternates("/about", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/hakkimizda");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/man-nahnu");
  });

  it("/request-quote with catalog semantics", () => {
    const alt = buildAlternates("/request-quote", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/katalog");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en/catalog");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-katalog");
  });

  it("/ (home)", () => {
    const alt = buildAlternates("/", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en");
    expect(alt.languages.ru).toBe("https://kitaplastik.com/ru");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar");
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr");
  });

  it("/products/bottle-washing nested", () => {
    const alt = buildAlternates("/products/bottle-washing", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/urunler/cam-yikama");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-muntajat/ghasil-zujajat");
  });

  it("PUBLIC_ROUTES contains all 11 canonical keys (sectors taşındı /products altına)", () => {
    expect(PUBLIC_ROUTES).toHaveLength(11);
    expect(PUBLIC_ROUTES).toContain("/");
    expect(PUBLIC_ROUTES).toContain("/request-quote");
    expect(PUBLIC_ROUTES).toContain("/products");
    expect(PUBLIC_ROUTES).toContain("/products/bottle-washing");
    expect(PUBLIC_ROUTES).toContain("/products/automotive");
    expect(PUBLIC_ROUTES).toContain("/products/textile");
    expect(PUBLIC_ROUTES).toContain("/legal/privacy");
    expect(PUBLIC_ROUTES).toContain("/legal/cookies");
  });
});
