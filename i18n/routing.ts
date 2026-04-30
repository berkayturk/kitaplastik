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
    "/products/[slug]": {
      tr: "/urunler/[slug]",
      en: "/products/[slug]",
      ru: "/produktsiya/[slug]",
      ar: "/al-muntajat/[slug]",
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
    "/sectors": {
      tr: "/sektorler",
      en: "/sectors",
      ru: "/otrasli",
      ar: "/al-qitaat",
    },
    "/sectors/bottle-washing": {
      tr: "/sektorler/cam-yikama",
      en: "/sectors/bottle-washing",
      ru: "/otrasli/moyka-butylok",
      ar: "/al-qitaat/ghasil-zujajat",
    },
    "/sectors/automotive": {
      tr: "/sektorler/otomotiv",
      en: "/sectors/automotive",
      ru: "/otrasli/avtoprom",
      ar: "/al-qitaat/al-sayyarat",
    },
    "/sectors/textile": {
      tr: "/sektorler/tekstil",
      en: "/sectors/textile",
      ru: "/otrasli/tekstil",
      ar: "/al-qitaat/al-mansujat",
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
