import { defineRouting } from "next-intl/routing";

export const locales = ["tr", "en", "ru", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "tr";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/about": {
      tr: "/hakkimizda",
      en: "/about",
      ru: "/o-nas",
      ar: "/man-nahnu",
    },
    "/contact": {
      tr: "/iletisim",
      en: "/contact",
      ru: "/kontakty",
      ar: "/ittisal",
    },
    "/products": {
      tr: "/urunler",
      en: "/products",
      ru: "/produktsiya",
      ar: "/al-muntajat",
    },
    // Eski (legacy) flat ürün URL'leri — DB lookup ile sector-aware route'a 301 redirect.
    // Yeni canonical: /products/[sector]/[slug]
    "/products/[slug]": {
      tr: "/urunler/[slug]",
      en: "/products/[slug]",
      ru: "/produktsiya/[slug]",
      ar: "/al-muntajat/[slug]",
    },
    "/products/bottle-washing": {
      tr: "/urunler/cam-yikama",
      en: "/products/bottle-washing",
      ru: "/produktsiya/moyka-butylok",
      ar: "/al-muntajat/ghasil-zujajat",
    },
    "/products/bottle-washing/[slug]": {
      tr: "/urunler/cam-yikama/[slug]",
      en: "/products/bottle-washing/[slug]",
      ru: "/produktsiya/moyka-butylok/[slug]",
      ar: "/al-muntajat/ghasil-zujajat/[slug]",
    },
    "/products/automotive": {
      tr: "/urunler/otomotiv",
      en: "/products/automotive",
      ru: "/produktsiya/avtoprom",
      ar: "/al-muntajat/al-sayyarat",
    },
    "/products/automotive/[slug]": {
      tr: "/urunler/otomotiv/[slug]",
      en: "/products/automotive/[slug]",
      ru: "/produktsiya/avtoprom/[slug]",
      ar: "/al-muntajat/al-sayyarat/[slug]",
    },
    "/products/textile": {
      tr: "/urunler/tekstil",
      en: "/products/textile",
      ru: "/produktsiya/tekstil",
      ar: "/al-muntajat/al-mansujat",
    },
    "/products/textile/[slug]": {
      tr: "/urunler/tekstil/[slug]",
      en: "/products/textile/[slug]",
      ru: "/produktsiya/tekstil/[slug]",
      ar: "/al-muntajat/al-mansujat/[slug]",
    },
    "/references": {
      tr: "/referanslar",
      en: "/references",
      ru: "/otzyvy",
      ar: "/maraji",
    },
    "/request-quote": {
      tr: "/katalog",
      en: "/catalog",
      ru: "/katalog",
      ar: "/al-katalog",
    },
    "/legal/privacy": {
      tr: "/yasal/gizlilik",
      en: "/legal/privacy",
      ru: "/pravovaya/konfidentsialnost",
      ar: "/qanuni/khususiyya",
    },
    "/legal/cookies": {
      tr: "/yasal/cerezler",
      en: "/legal/cookies",
      ru: "/pravovaya/kuki",
      ar: "/qanuni/kuki",
    },
  },
});
