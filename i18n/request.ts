import { getRequestConfig } from "next-intl/server";
import { routing, type Locale } from "./routing";

// Replaces v4-only `hasLocale(routing.locales, value)`. When upgrading to next-intl v4,
// swap this inline guard back to the library-provided helper.
function isValidLocale(value: string | undefined): value is Locale {
  return typeof value === "string" && (routing.locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isValidLocale(requested) ? requested : routing.defaultLocale;

  const [common, home, nav, sectors, references, pages, catalog] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/home.json`).then((m) => m.default),
    import(`../messages/${locale}/nav.json`).then((m) => m.default),
    import(`../messages/${locale}/sectors.json`).then((m) => m.default),
    import(`../messages/${locale}/references.json`).then((m) => m.default),
    import(`../messages/${locale}/pages.json`).then((m) => m.default),
    import(`../messages/${locale}/catalog.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: { common, home, nav, sectors, references, pages, ...catalog },
  };
});
