import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ProductDetail } from "@/components/public/products/ProductDetail";
import { createClient } from "@/lib/supabase/server";
import {
  SECTOR_ROUTE_TO_DB,
  type SectorRouteSlug,
} from "@/components/public/sectors/SectorDetail";

interface Props {
  locale: Locale;
  routeSlug: SectorRouteSlug;
  slug: string;
}

export async function loadProductForSector(
  locale: Locale,
  routeSlug: SectorRouteSlug,
  slug: string,
) {
  const dbSlug = SECTOR_ROUTE_TO_DB[routeSlug];
  const svc = await createClient();

  const { data: sector } = await svc
    .from("sectors")
    .select("id")
    .eq("slug", dbSlug)
    .eq("active", true)
    .maybeSingle();
  if (!sector) return null;

  const nameKey = `name->>${locale}`;
  const { data, error } = await svc
    .from("products")
    .select("slug, name, description, images, specs, active, sector_id")
    .eq("slug", slug)
    .eq("sector_id", sector.id)
    .eq("active", true)
    .not(nameKey, "is", null)
    .neq(nameKey, "")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function SectorProductPage({ locale, routeSlug, slug }: Props) {
  const product = await loadProductForSector(locale, routeSlug, slug);
  if (!product) notFound();

  const [tCta, tCommon, tDetail] = await Promise.all([
    getTranslations({ locale, namespace: "common.cta" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "pages.products.detail" }),
  ]);

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <ProductDetail
        product={{
          slug: product.slug,
          name: product.name as Record<Locale, string>,
          description: (product.description as Record<Locale, string> | null) ?? {
            tr: "",
            en: "",
            ru: "",
            ar: "",
          },
          images:
            (product.images as Array<{
              path: string;
              order: number;
              alt_text: Record<Locale, string>;
            }> | null) ?? [],
          specs: (product.specs as Array<{ preset_id: string; value: string }> | null) ?? [],
        }}
        locale={locale}
        ctaLabel={tCta("requestQuote")}
        imageLabel={tCommon("productImageLabel")}
        specsLabel={tDetail("specsLabel")}
        sectorRoute={routeSlug}
      />
    </section>
  );
}
