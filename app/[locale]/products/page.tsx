import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.products.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/products", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

const SECTORS = [
  { pathname: "/products/bottle-washing" as const, nsKey: "camYikama" as const },
  { pathname: "/products/automotive" as const, nsKey: "otomotiv" as const },
  { pathname: "/products/textile" as const, nsKey: "tekstil" as const },
];

export default async function ProductsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHero = await getTranslations("pages.products.hero");
  const tSectors = await getTranslations("sectors.hub");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{tHero("eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {tHero("title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{tHero("subtitle")}</p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {SECTORS.map((sector) => (
          <Link
            key={sector.pathname}
            href={sector.pathname}
            className="group flex flex-col gap-3 rounded-lg border border-[var(--color-border-subtle-dark)] p-6 transition hover:border-[var(--color-accent-red)]"
          >
            <h2 className="text-text-primary text-xl font-semibold">
              {tSectors(`${sector.nsKey}.title`)}
            </h2>
            <p className="text-text-secondary">{tSectors(`${sector.nsKey}.description`)}</p>
            <span
              aria-hidden="true"
              className="text-text-secondary group-hover:text-text-primary mt-auto pt-2 text-xs"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
