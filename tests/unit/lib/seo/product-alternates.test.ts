import { describe, it, expect } from "vitest";
import { buildProductAlternates } from "@/lib/seo/routes";

const ORIGIN = "https://kitaplastik.com";

describe("buildProductAlternates — sector-aware per-locale native product URLs", () => {
  it("generates native slug per locale for a bottle-washing product", () => {
    const alt = buildProductAlternates("bottle-washing", "my-bottle", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/urunler/cam-yikama/my-bottle");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en/products/bottle-washing/my-bottle");
    expect(alt.languages.ru).toBe("https://kitaplastik.com/ru/produktsiya/moyka-butylok/my-bottle");
    expect(alt.languages.ar).toBe(
      "https://kitaplastik.com/ar/al-muntajat/ghasil-zujajat/my-bottle",
    );
  });

  it("generates native slug per locale for an automotive product", () => {
    const alt = buildProductAlternates("automotive", "ev-kemer-kesici", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/urunler/otomotiv/ev-kemer-kesici");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en/products/automotive/ev-kemer-kesici");
    expect(alt.languages.ru).toBe(
      "https://kitaplastik.com/ru/produktsiya/avtoprom/ev-kemer-kesici",
    );
    expect(alt.languages.ar).toBe(
      "https://kitaplastik.com/ar/al-muntajat/al-sayyarat/ev-kemer-kesici",
    );
  });

  it("generates native slug per locale for a textile product", () => {
    const alt = buildProductAlternates("textile", "masura", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/urunler/tekstil/masura");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-muntajat/al-mansujat/masura");
  });

  it("sets x-default to the TR (default) native URL", () => {
    const alt = buildProductAlternates("bottle-washing", "pet-shishe", ORIGIN);
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr/urunler/cam-yikama/pet-shishe");
  });
});
