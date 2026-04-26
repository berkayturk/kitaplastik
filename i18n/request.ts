import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const [common, home, nav, sectors, references, pages, catalog, legal] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/home.json`).then((m) => m.default),
    import(`../messages/${locale}/nav.json`).then((m) => m.default),
    import(`../messages/${locale}/sectors.json`).then((m) => m.default),
    import(`../messages/${locale}/references.json`).then((m) => m.default),
    import(`../messages/${locale}/pages.json`).then((m) => m.default),
    import(`../messages/${locale}/catalog.json`).then((m) => m.default),
    import(`../messages/${locale}/legal.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: { common, home, nav, sectors, references, pages, legal, ...catalog },
  };
});
