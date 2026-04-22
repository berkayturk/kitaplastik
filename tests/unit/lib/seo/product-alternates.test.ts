import { describe, it, expect } from "vitest";
import { buildProductAlternates } from "@/lib/seo/routes";

const ORIGIN = "https://kitaplastik.com";

describe("buildProductAlternates — per-locale native product URLs", () => {
  it("generates native slug per locale for a given product slug", () => {
    const alt = buildProductAlternates("my-bottle", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/urunler/my-bottle");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en/products/my-bottle");
    expect(alt.languages.ru).toBe("https://kitaplastik.com/ru/produktsiya/my-bottle");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-muntajat/my-bottle");
  });

  it("sets x-default to the TR (default) native URL", () => {
    const alt = buildProductAlternates("pet-shishe", ORIGIN);
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr/urunler/pet-shishe");
  });

  it("handles slugs with dashes and digits", () => {
    const alt = buildProductAlternates("vial-80ml-clear", ORIGIN);
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-muntajat/vial-80ml-clear");
  });
});
