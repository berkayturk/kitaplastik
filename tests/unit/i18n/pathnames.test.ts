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

  it("/sectors", () => {
    expect(getPathname({ href: "/sectors", locale: "tr" })).toBe("/tr/sektorler");
    expect(getPathname({ href: "/sectors", locale: "en" })).toBe("/en/sectors");
    expect(getPathname({ href: "/sectors", locale: "ru" })).toBe("/ru/otrasli");
    expect(getPathname({ href: "/sectors", locale: "ar" })).toBe("/ar/al-qitaat");
  });

  it("/sectors/bottle-washing", () => {
    expect(getPathname({ href: "/sectors/bottle-washing", locale: "tr" })).toBe(
      "/tr/sektorler/cam-yikama",
    );
    expect(getPathname({ href: "/sectors/bottle-washing", locale: "ru" })).toBe(
      "/ru/otrasli/moyka-butylok",
    );
    expect(getPathname({ href: "/sectors/bottle-washing", locale: "ar" })).toBe(
      "/ar/al-qitaat/ghasil-zujajat",
    );
  });

  it("/sectors/caps", () => {
    expect(getPathname({ href: "/sectors/caps", locale: "tr" })).toBe("/tr/sektorler/kapak");
    expect(getPathname({ href: "/sectors/caps", locale: "ar" })).toBe("/ar/al-qitaat/al-aghtiya");
  });

  it("/sectors/textile", () => {
    expect(getPathname({ href: "/sectors/textile", locale: "tr" })).toBe("/tr/sektorler/tekstil");
    expect(getPathname({ href: "/sectors/textile", locale: "ar" })).toBe(
      "/ar/al-qitaat/al-mansujat",
    );
  });
});
