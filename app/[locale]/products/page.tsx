import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { SectorPreviewGrid } from "@/components/public/sectors/SectorPreviewGrid";

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

export default async function ProductsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tHero = await getTranslations("pages.products.hero");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{tHero("eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {tHero("title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{tHero("subtitle")}</p>
      </header>

      <div className="mt-12">
        <SectorPreviewGrid namespace="sectors.hub" />
      </div>
    </section>
  );
}
