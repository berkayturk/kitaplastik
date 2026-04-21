import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { ProductGrid } from "@/components/public/products/ProductGrid";
import type { PublicProduct } from "@/components/public/products/ProductCard";
import { createClient } from "@/lib/supabase/server";

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

async function loadLocalizedProducts(locale: Locale): Promise<PublicProduct[]> {
  const svc = await createClient();
  const nameKey = `name->>${locale}`;
  const { data, error } = await svc
    .from("products")
    .select("slug, sector_id, name, images, display_order")
    .eq("active", true)
    .not(nameKey, "is", null)
    .neq(nameKey, "")
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);

  const sectorIds = Array.from(
    new Set((data ?? []).map((p) => p.sector_id).filter(Boolean)),
  ) as string[];
  const sectorMap: Record<string, string> = {};
  if (sectorIds.length > 0) {
    const { data: sd } = await svc.from("sectors").select("id, name").in("id", sectorIds);
    for (const s of sd ?? []) {
      sectorMap[s.id] =
        (s.name as Record<string, string>)?.[locale] ??
        (s.name as Record<string, string>)?.tr ??
        s.id;
    }
  }

  return (data ?? []).map((p) => ({
    slug: p.slug,
    sector_label: p.sector_id ? (sectorMap[p.sector_id] ?? null) : null,
    name: p.name as Record<Locale, string>,
    images: (p.images as PublicProduct["images"]) ?? [],
  }));
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tHero, tCommon, products] = await Promise.all([
    getTranslations({ locale, namespace: "pages.products.hero" }),
    getTranslations({ locale, namespace: "common" }),
    loadLocalizedProducts(locale),
  ]);
  const imageLabel = tCommon("productImageLabel");

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
        <ProductGrid products={products} locale={locale} imageLabel={imageLabel} />
      </div>
    </section>
  );
}
