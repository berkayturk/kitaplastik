// lib/catalog/types.ts
//
// Shared types for the dynamic catalog PDF pipeline. These DTOs are
// produced by lib/catalog/fetch-products.ts and consumed by both the
// server components under components/catalog/* and the PDF route.

import type { Locale } from "@/i18n/routing";

export const CATALOG_LOCALES = ["tr", "en", "ru", "ar"] as const;
export type CatalogLocale = (typeof CATALOG_LOCALES)[number];

export const CATALOG_SECTORS = ["cam-yikama", "otomotiv", "tekstil", "all"] as const;
export type CatalogSector = (typeof CATALOG_SECTORS)[number];

export function isCatalogSector(value: string): value is CatalogSector {
  return (CATALOG_SECTORS as readonly string[]).includes(value);
}

export function isCatalogLocale(value: string): value is CatalogLocale {
  return (CATALOG_LOCALES as readonly string[]).includes(value);
}

/** Locale-resolved product with PDF-ready fields already flattened out of
 * the JSONB blob. `imageUrl` is an absolute Supabase Storage URL so
 * Puppeteer can fetch it. Fields marked as nullable are rendered as an
 * em-dash (—) in the template when missing.
 */
export interface CatalogProduct {
  id: string;
  slug: string;
  code: string; // falls back to slug.toUpperCase() when products.code is null
  name: string;
  sectorSlug: "cam-yikama" | "otomotiv" | "tekstil";
  imageUrl: string | null;
  material: string | null;
  dimension: string | null;
  weight: string | null;
  usage: string | null;
}

export interface SectorGroup {
  slug: "cam-yikama" | "otomotiv" | "tekstil";
  /** Sector number (01/02/03) for the opener page header. */
  number: number;
  /** Sector title in the requested locale (from sectors.name JSONB). */
  title: string;
  /** Editorial subtitle from catalog i18n dictionary (not DB). */
  subtitle: string;
  overview: string[];
  stats: Array<{ label: string; value: string }>;
  products: CatalogProduct[];
}

export interface CatalogData {
  sector: CatalogSector;
  locale: Locale;
  /** SHA-256 of the max(updated_at) across returned sectors' products.
   * Empty string when no products (first-run / empty DB). */
  dataHash: string;
  groups: SectorGroup[];
}
