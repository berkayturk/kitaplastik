import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildProductAlternates, languagesWithDefault } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import {
  SectorProductPage,
  loadProductForSector,
} from "@/components/public/products/SectorProductPage";

const ROUTE_SLUG = "bottle-washing" as const;

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await loadProductForSector(locale, ROUTE_SLUG, slug);
  if (!product) return { title: "Ürün bulunamadı" };
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const name = (product.name as Record<string, string>)[locale];
  const description = (product.description as Record<string, string> | null)?.[locale];
  const alternates = buildProductAlternates(ROUTE_SLUG, slug, origin);
  return {
    title: `${name} | Kıta Plastik`,
    description: description?.slice(0, 160),
    alternates: {
      canonical: alternates.languages[locale],
      languages: languagesWithDefault(alternates),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <SectorProductPage locale={locale} routeSlug={ROUTE_SLUG} slug={slug} />;
}
