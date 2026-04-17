import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Hero } from "@/components/home/Hero";
import { ReferencesStrip } from "@/components/home/ReferencesStrip";
import { SectorGrid } from "@/components/home/SectorGrid";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
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
