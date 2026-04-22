import { describe, it, expect } from "vitest";
import { slugify, slugifyDraft } from "@/lib/utils/slugify";

describe("slugify — TR regression", () => {
  it("handles Turkish characters", () => {
    expect(slugify("Ürünler")).toBe("urunler");
    expect(slugify("Cam Yıkama")).toBe("cam-yikama");
    expect(slugify("Şişe Kapakları")).toBe("sise-kapaklari");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("  test  ")).toBe("test");
    expect(slugify("---abc---")).toBe("abc");
  });

  it("returns empty for empty input", () => {
    expect(slugify("")).toBe("");
  });
});

describe("slugify — RU Cyrillic (BGN/PCGN)", () => {
  it("transliterates single words", () => {
    expect(slugify("Продукция")).toBe("produktsiya");
    expect(slugify("Контакты")).toBe("kontakty");
    expect(slugify("Отрасли")).toBe("otrasli");
  });

  it("transliterates multi-word phrases", () => {
    expect(slugify("Мойка бутылок")).toBe("moyka-butylok");
    expect(slugify("О нас")).toBe("o-nas");
  });

  it("handles digraphs (ch, sh, zh, ya, yu, yo)", () => {
    expect(slugify("Щётка")).toBe("shchyotka");
    expect(slugify("Жюри")).toBe("zhyuri");
  });
});

describe("slugify — AR script (consonant-only)", () => {
  it("transliterates common nouns", () => {
    expect(slugify("المنتجات")).toBe("almntjat");
    expect(slugify("القطاعات")).toBe("alqtaat");
  });

  it("skips ayn and hamza", () => {
    expect(slugify("العربية")).toBe("alrbyh");
  });
});

describe("slugify — locale option", () => {
  it("uses TR map when locale=tr", () => {
    expect(slugify("Ürünler", { locale: "tr" })).toBe("urunler");
  });

  it("uses RU map when locale=ru", () => {
    expect(slugify("Продукция", { locale: "ru" })).toBe("produktsiya");
  });

  it("uses AR map when locale=ar", () => {
    expect(slugify("المنتجات", { locale: "ar" })).toBe("almntjat");
  });

  it("uses combined map by default (mixed scripts)", () => {
    expect(slugify("Продукция 2024")).toBe("produktsiya-2024");
    expect(slugify("Ürünler & المنتجات")).toBe("urunler-almntjat");
  });
});

describe("slugifyDraft — preserves trailing dashes", () => {
  it("keeps typing-in-progress dashes", () => {
    expect(slugifyDraft("pet-")).toBe("pet-");
    expect(slugifyDraft("pet-bottle-")).toBe("pet-bottle-");
  });

  it("transliterates RU in draft too", () => {
    expect(slugifyDraft("Продукция-")).toBe("produktsiya-");
  });
});
