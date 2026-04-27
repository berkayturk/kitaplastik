import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { Hero } from "@/components/home/Hero";
import { ReferencesStrip } from "@/components/home/ReferencesStrip";
import { SectorGrid } from "@/components/home/SectorGrid";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const tBrand = await getTranslations({ locale, namespace: "common.brand" });
  const tHero = await getTranslations({ locale, namespace: "home.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/", origin);
  return {
    title: `${tBrand("name")} · ${tBrand("tagline")}`,
    description: tHero("subtitle"),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ReferencesStrip />
      <SectorGrid />
    </>
  );
}
