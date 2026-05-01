import { describe, it, expect } from "vitest";
import { getPathname } from "@/i18n/navigation";

describe("next-intl pathnames per-locale mapping", () => {
  it("home /", () => {
    expect(getPathname({ href: "/", locale: "tr" })).toBe("/tr");
    expect(getPathname({ href: "/", locale: "en" })).toBe("/en");
    expect(getPathname({ href: "/", locale: "ru" })).toBe("/ru");
    expect(getPathname({ href: "/", locale: "ar" })).toBe("/ar");
  });

  it("/about", () => {
    expect(getPathname({ href: "/about", locale: "tr" })).toBe("/tr/hakkimizda");
    expect(getPathname({ href: "/about", locale: "en" })).toBe("/en/about");
    expect(getPathname({ href: "/about", locale: "ru" })).toBe("/ru/o-nas");
    expect(getPathname({ href: "/about", locale: "ar" })).toBe("/ar/man-nahnu");
  });

  it("/contact", () => {
    expect(getPathname({ href: "/contact", locale: "tr" })).toBe("/tr/iletisim");
    expect(getPathname({ href: "/contact", locale: "en" })).toBe("/en/contact");
    expect(getPathname({ href: "/contact", locale: "ru" })).toBe("/ru/kontakty");
    expect(getPathname({ href: "/contact", locale: "ar" })).toBe("/ar/ittisal");
  });

  it("/products", () => {
    expect(getPathname({ href: "/products", locale: "tr" })).toBe("/tr/urunler");
    expect(getPathname({ href: "/products", locale: "en" })).toBe("/en/products");
    expect(getPathname({ href: "/products", locale: "ru" })).toBe("/ru/produktsiya");
    expect(getPathname({ href: "/products", locale: "ar" })).toBe("/ar/al-muntajat");
  });

  it("/products/[slug] dynamic", () => {
    expect(
      getPathname({
        href: { pathname: "/products/[slug]", params: { slug: "test-item" } },
        locale: "tr",
      }),
    ).toBe("/tr/urunler/test-item");
    expect(
      getPathname({
        href: { pathname: "/products/[slug]", params: { slug: "test-item" } },
        locale: "ar",
      }),
    ).toBe("/ar/al-muntajat/test-item");
  });

  it("/references", () => {
    expect(getPathname({ href: "/references", locale: "tr" })).toBe("/tr/referanslar");
    expect(getPathname({ href: "/references", locale: "en" })).toBe("/en/references");
    expect(getPathname({ href: "/references", locale: "ru" })).toBe("/ru/otzyvy");
    expect(getPathname({ href: "/references", locale: "ar" })).toBe("/ar/maraji");
  });

  it("/request-quote (catalog semantics)", () => {
    expect(getPathname({ href: "/request-quote", locale: "tr" })).toBe("/tr/katalog");
    expect(getPathname({ href: "/request-quote", locale: "en" })).toBe("/en/catalog");
    expect(getPathname({ href: "/request-quote", locale: "ru" })).toBe("/ru/katalog");
    expect(getPathname({ href: "/request-quote", locale: "ar" })).toBe("/ar/al-katalog");
  });

  it("/products/bottle-washing", () => {
    expect(getPathname({ href: "/products/bottle-washing", locale: "tr" })).toBe(
      "/tr/urunler/cam-yikama",
    );
    expect(getPathname({ href: "/products/bottle-washing", locale: "en" })).toBe(
      "/en/products/bottle-washing",
    );
    expect(getPathname({ href: "/products/bottle-washing", locale: "ru" })).toBe(
      "/ru/produktsiya/moyka-butylok",
    );
    expect(getPathname({ href: "/products/bottle-washing", locale: "ar" })).toBe(
      "/ar/al-muntajat/ghasil-zujajat",
    );
  });

  it("/products/automotive", () => {
    expect(getPathname({ href: "/products/automotive", locale: "tr" })).toBe(
      "/tr/urunler/otomotiv",
    );
    expect(getPathname({ href: "/products/automotive", locale: "ar" })).toBe(
      "/ar/al-muntajat/al-sayyarat",
    );
  });

  it("/products/textile", () => {
    expect(getPathname({ href: "/products/textile", locale: "tr" })).toBe("/tr/urunler/tekstil");
    expect(getPathname({ href: "/products/textile", locale: "ar" })).toBe(
      "/ar/al-muntajat/al-mansujat",
    );
  });

  it("/products/[sector]/[slug] dynamic — bottle-washing", () => {
    expect(
      getPathname({
        href: { pathname: "/products/bottle-washing/[slug]", params: { slug: "pet-shishe" } },
        locale: "tr",
      }),
    ).toBe("/tr/urunler/cam-yikama/pet-shishe");
    expect(
      getPathname({
        href: { pathname: "/products/bottle-washing/[slug]", params: { slug: "pet-shishe" } },
        locale: "ar",
      }),
    ).toBe("/ar/al-muntajat/ghasil-zujajat/pet-shishe");
  });

  it("/legal/privacy", () => {
    expect(getPathname({ href: "/legal/privacy", locale: "tr" })).toBe("/tr/yasal/gizlilik");
    expect(getPathname({ href: "/legal/privacy", locale: "en" })).toBe("/en/legal/privacy");
    expect(getPathname({ href: "/legal/privacy", locale: "ru" })).toBe(
      "/ru/pravovaya/konfidentsialnost",
    );
    expect(getPathname({ href: "/legal/privacy", locale: "ar" })).toBe("/ar/qanuni/khususiyya");
  });

  it("/legal/cookies", () => {
    expect(getPathname({ href: "/legal/cookies", locale: "tr" })).toBe("/tr/yasal/cerezler");
    expect(getPathname({ href: "/legal/cookies", locale: "en" })).toBe("/en/legal/cookies");
    expect(getPathname({ href: "/legal/cookies", locale: "ru" })).toBe("/ru/pravovaya/kuki");
    expect(getPathname({ href: "/legal/cookies", locale: "ar" })).toBe("/ar/qanuni/kuki");
  });
});
