import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sectors.hub.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/sectors`,
      languages: buildAlternates("/sectors", origin).languages,
    },
  };
}

const SECTORS = [
  { slug: "cam-yikama", nsKey: "camYikama" },
  { slug: "kapak", nsKey: "kapak" },
  { slug: "tekstil", nsKey: "tekstil" },
] as const;

export default async function SectorsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sectors.hub");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {SECTORS.map((sector) => (
          <Link
            key={sector.slug}
            href={`/sectors/${sector.slug}`}
            className="group flex flex-col gap-3 rounded-lg border border-[var(--color-border-subtle-dark)] p-6 transition hover:border-[var(--color-accent-red)]"
          >
            <h2 className="text-text-primary text-xl font-semibold">
              {t(`${sector.nsKey}.title`)}
            </h2>
            <p className="text-text-secondary">{t(`${sector.nsKey}.description`)}</p>
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
