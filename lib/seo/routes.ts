import { locales, defaultLocale, type Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";

export const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/products/bottle-washing",
  "/products/automotive",
  "/products/textile",
  "/about",
  "/contact",
  "/references",
  "/request-quote",
  "/legal/privacy",
  "/legal/cookies",
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export interface Alternates {
  languages: Record<Locale, string>;
  "x-default": string;
}

function buildLocaleUrl(route: PublicRoute, locale: Locale, origin: string): string {
  // getPathname already includes the locale prefix under localePrefix: "always".
  // Example: getPathname({ href: "/about", locale: "tr" }) -> "/tr/hakkimizda"
  //          getPathname({ href: "/",       locale: "tr" }) -> "/tr"
  const pathname = getPathname({ href: route, locale });
  return `${origin}${pathname}`;
}

export function buildAlternates(route: PublicRoute, origin: string): Alternates {
  const languages = locales.reduce<Record<Locale, string>>(
    (acc, locale) => {
      acc[locale] = buildLocaleUrl(route, locale, origin);
      return acc;
    },
    {} as Record<Locale, string>,
  );
  return {
    languages,
    "x-default": languages[defaultLocale],
  };
}

// Next.js Metadata.alternates.languages accepts an `x-default` key alongside locale codes.
// Helper flattens our Alternates contract to that shape so callers don't repeat the spread.
// Return type is narrowed so consumers get key-name autocomplete and typo protection.
export function languagesWithDefault(alt: Alternates): Record<Locale | "x-default", string> {
  return { ...alt.languages, "x-default": alt["x-default"] };
}

export type ProductSectorRoute = "bottle-washing" | "automotive" | "textile";

export function buildProductAlternates(
  sectorRoute: ProductSectorRoute,
  slug: string,
  origin: string,
): Alternates {
  const languages = locales.reduce<Record<Locale, string>>(
    (acc, locale) => {
      const pathname =
        sectorRoute === "bottle-washing"
          ? getPathname({
              href: { pathname: "/products/bottle-washing/[slug]", params: { slug } },
              locale,
            })
          : sectorRoute === "automotive"
            ? getPathname({
                href: { pathname: "/products/automotive/[slug]", params: { slug } },
                locale,
              })
            : getPathname({
                href: { pathname: "/products/textile/[slug]", params: { slug } },
                locale,
              });
      acc[locale] = `${origin}${pathname}`;
      return acc;
    },
    {} as Record<Locale, string>,
  );
  return {
    languages,
    "x-default": languages[defaultLocale],
  };
}
