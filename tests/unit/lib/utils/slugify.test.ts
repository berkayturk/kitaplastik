import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("Türkçe karakterleri ASCII'ye çevirir", () => {
    expect(slugify("PET Preform Kapak 28 mm")).toBe("pet-preform-kapak-28-mm");
    expect(slugify("Şişe Yıkama Kapağı")).toBe("sise-yikama-kapagi");
    expect(slugify("İstanbul Özel Ürün")).toBe("istanbul-ozel-urun");
  });

  it("fazla boşluk ve noktalama'yı temizler", () => {
    expect(slugify("  Çift  Boşluk!!! ")).toBe("cift-bosluk");
    expect(slugify("Ürün (v2) — 2025")).toBe("urun-v2-2025");
  });

  it("alfasayısal olmayan karakterleri silip tire ile birleştirir", () => {
    expect(slugify("% / ? @ ş")).toBe("s");
  });

  it("boş string boş slug döner", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
