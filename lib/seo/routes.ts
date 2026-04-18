import { locales, defaultLocale, type Locale } from "@/i18n/routing";

export const PUBLIC_ROUTES = [
  "/",
  "/sektorler",
  "/sektorler/cam-yikama",
  "/sektorler/kapak",
  "/sektorler/tekstil",
  "/urunler",
  "/hakkimizda",
  "/iletisim",
  "/referanslar",
  "/teklif-iste",
  "/teklif-iste/ozel-uretim",
  "/teklif-iste/standart",
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export interface Alternates {
  languages: Record<Locale, string>;
  "x-default": string;
}

function joinPath(path: string): string {
  return path === "/" ? "" : path;
}

export function buildAlternates(route: string, origin: string): Alternates {
  const languages = locales.reduce<Record<Locale, string>>(
    (acc, locale) => {
      acc[locale] = `${origin}/${locale}${joinPath(route)}`;
      return acc;
    },
    {} as Record<Locale, string>,
  );
  return {
    languages,
    "x-default": `${origin}/${defaultLocale}${joinPath(route)}`,
  };
}
