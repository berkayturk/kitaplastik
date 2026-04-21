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
  const t = await getTranslations({ locale, namespace: "pages.products.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/products`,
      languages: buildAlternates("/products", origin).languages,
    },
  };
}

export default async function UrunlerPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.products");
  const tCta = await getTranslations("common.cta");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <aside className="bg-bg-secondary/30 mt-12 rounded-lg border border-[var(--color-border-subtle-dark)] p-6">
        <p className="text-text-secondary">{t("notice")}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/contact"
            className="rounded bg-[var(--color-accent-red)] px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            {tCta("requestQuote")}
          </Link>
          <Link
            href="/sectors"
            className="text-text-primary rounded border border-[var(--color-border-subtle-dark)] px-6 py-3 font-medium transition hover:border-[var(--color-accent-red)]"
          >
            {tCta("exploreSectors")}
          </Link>
        </div>
      </aside>
    </section>
  );
}
