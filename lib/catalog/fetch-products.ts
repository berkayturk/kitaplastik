// lib/catalog/fetch-products.ts
//
// Builds the CatalogData payload the PDF template renders. Given a sector
// slug and locale, returns one SectorGroup per included sector (one for
// single-sector scope, three for "all"), each populated with the
// locale-resolved product rows and a SHA-256 dataHash derived from
// max(updated_at) across the returned products. The hash is the cache
// key's invalidation signal — any update to any included product
// changes it.

import "server-only";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  CatalogData,
  CatalogLocale,
  CatalogProduct,
  CatalogSector,
  SectorGroup,
} from "./types";
import { getCatalogChrome } from "./i18n";
import { computeDataHash } from "./hash";
export { computeDataHash } from "./hash";

const SECTOR_ORDER: Array<"cam-yikama" | "otomotiv" | "tekstil"> = [
  "cam-yikama",
  "otomotiv",
  "tekstil",
];

const PUBLIC_IMAGE_BASE = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images`;

interface ProductRow {
  id: string;
  slug: string;
  code: string | null;
  name: Record<string, string>;
  description: Record<string, string>;
  sector_id: string | null;
  images: Array<{ path: string; order: number; alt_text?: Record<string, string> }> | null;
  specs: Array<{ preset_id: string; value: string }> | null;
  updated_at: string;
}

interface SectorRow {
  id: string;
  slug: string;
  name: Record<string, string>;
}

function localized(jsonb: Record<string, string> | null | undefined, locale: Locale): string {
  if (!jsonb) return "";
  return jsonb[locale] ?? jsonb.tr ?? jsonb.en ?? "";
}

function resolveImageUrl(images: ProductRow["images"]): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const first = sorted[0];
  if (!first?.path) return null;
  return `${PUBLIC_IMAGE_BASE}/${first.path}`;
}

function extractSpec(specs: ProductRow["specs"], presetId: string): string | null {
  if (!specs) return null;
  const hit = specs.find((s) => s.preset_id === presetId);
  return hit?.value && hit.value.length > 0 ? hit.value : null;
}

function toCatalogProduct(
  row: ProductRow,
  sectorSlug: "cam-yikama" | "otomotiv" | "tekstil",
  locale: Locale,
): CatalogProduct {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code && row.code.length > 0 ? row.code : row.slug.toUpperCase(),
    name: localized(row.name, locale),
    sectorSlug,
    imageUrl: resolveImageUrl(row.images),
    material: extractSpec(row.specs, "material"),
    dimension: extractSpec(row.specs, "dimension"),
    weight: extractSpec(row.specs, "weight"),
    usage: ((): string | null => {
      // Fall back to a short description preview when no dedicated usage
      // spec is set. Keeps catalog rows visually even.
      const d = localized(row.description, locale);
      if (d.length === 0) return null;
      const first = d.split(/[.!?]\s+/)[0] ?? "";
      return first.length > 0 ? first : null;
    })(),
  };
}

/** Internal helper: look up sector rows from the DB for the given slugs. */
async function loadSectors(slugs: readonly string[]): Promise<Map<string, SectorRow>> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("sectors")
    .select("id, slug, name")
    .in("slug", slugs as string[])
    .eq("active", true);
  if (error) throw new Error(`sectors query failed: ${error.message}`);
  const map = new Map<string, SectorRow>();
  for (const row of (data ?? []) as SectorRow[]) {
    map.set(row.slug, row);
  }
  return map;
}

/** Internal helper: load active products for a set of sector IDs. */
async function loadProducts(sectorIds: readonly string[]): Promise<ProductRow[]> {
  if (sectorIds.length === 0) return [];
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("products")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("id, slug, code, name, description, sector_id, images, specs, updated_at" as any)
    .in("sector_id", sectorIds as string[])
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error) throw new Error(`products query failed: ${error.message}`);
  return (data ?? []) as unknown as ProductRow[];
}

/** Entry point. Returns a normalized CatalogData for the template to
 * render. Never throws on empty results — returns an empty groups array
 * with dataHash === "" so the caller can either 404 or render a "no
 * products" placeholder page. */
export async function fetchCatalogData(
  sector: CatalogSector,
  locale: CatalogLocale,
): Promise<CatalogData> {
  const chrome = getCatalogChrome(locale);

  const targetSlugs: Array<"cam-yikama" | "otomotiv" | "tekstil"> =
    sector === "all" ? SECTOR_ORDER : [sector];

  const sectorMap = await loadSectors(targetSlugs);
  const orderedSectors = targetSlugs
    .map((slug) => sectorMap.get(slug))
    .filter((s): s is SectorRow => !!s);

  const sectorIds = orderedSectors.map((s) => s.id);
  const products = await loadProducts(sectorIds);

  // Group products by sector_id.
  const bySectorId = new Map<string, ProductRow[]>();
  for (const p of products) {
    if (!p.sector_id) continue;
    const bucket = bySectorId.get(p.sector_id) ?? [];
    bucket.push(p);
    bySectorId.set(p.sector_id, bucket);
  }

  const groups: SectorGroup[] = orderedSectors.map((sectorRow, idx) => {
    const editorial = chrome.sectors[sectorRow.slug as "cam-yikama" | "otomotiv" | "tekstil"];
    const slug = sectorRow.slug as "cam-yikama" | "otomotiv" | "tekstil";
    const prods = (bySectorId.get(sectorRow.id) ?? []).map((p) =>
      toCatalogProduct(p, slug, locale),
    );
    return {
      slug,
      number: idx + 1,
      title: localized(sectorRow.name, locale),
      subtitle: editorial.subtitle,
      overview: editorial.overview,
      stats: editorial.stats,
      products: prods,
    };
  });

  return {
    sector,
    locale,
    dataHash: computeDataHash(products),
    groups,
  };
}
