// Legacy: eski flat /products/[slug] URL'leri yeni sector-aware route'a 301 redirect
// eder. Yeni canonical: /products/[sector]/[slug]. DB'den ürünün sector_id'sini
// bulup slug'ını çözer; sektör eşleşmezse 404'e düşer.

import { permanentRedirect, notFound } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { SECTOR_ROUTE_TO_DB, type SectorRouteSlug } from "@/components/public/sectors/SectorDetail";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const DB_TO_ROUTE: Record<string, SectorRouteSlug> = Object.fromEntries(
  (Object.entries(SECTOR_ROUTE_TO_DB) as Array<[SectorRouteSlug, string]>).map(([k, v]) => [v, k]),
);

export default async function LegacyProductRedirect({ params }: PageProps) {
  const { locale, slug } = await params;
  const svc = await createClient();

  const { data: product } = await svc
    .from("products")
    .select("slug, sector_id, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!product?.sector_id) notFound();

  const { data: sector } = await svc
    .from("sectors")
    .select("slug")
    .eq("id", product.sector_id)
    .eq("active", true)
    .maybeSingle();
  if (!sector) notFound();

  const routeSlug = DB_TO_ROUTE[sector.slug];
  if (!routeSlug) notFound();

  const pathname =
    routeSlug === "bottle-washing"
      ? getPathname({
          href: { pathname: "/products/bottle-washing/[slug]", params: { slug } },
          locale,
        })
      : routeSlug === "automotive"
        ? getPathname({
            href: { pathname: "/products/automotive/[slug]", params: { slug } },
            locale,
          })
        : getPathname({
            href: { pathname: "/products/textile/[slug]", params: { slug } },
            locale,
          });

  permanentRedirect(pathname);
}
