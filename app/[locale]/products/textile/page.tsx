import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { SectorDetail } from "@/components/public/sectors/SectorDetail";

const ROUTE = "/products/textile";
const NS = "sectors.tekstil";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${NS}.hero` });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates(ROUTE, origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

export default async function TextilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SectorDetail locale={locale} routeSlug="textile" />;
}
