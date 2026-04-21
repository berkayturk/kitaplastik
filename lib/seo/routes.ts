import { locales, defaultLocale, type Locale } from "@/i18n/routing";

export const PUBLIC_ROUTES = [
  "/",
  "/sectors",
  "/sectors/bottle-washing",
  "/sectors/caps",
  "/sectors/textile",
  "/products",
  "/about",
  "/contact",
  "/references",
  "/request-quote",
  "/request-quote/custom",
  "/request-quote/standard",
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
