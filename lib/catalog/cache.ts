// lib/catalog/cache.ts
//
// Supabase Storage-backed PDF cache. Key format:
//   {sector}-{lang}-{dataHash}.pdf
// Bucket: catalog-cache (private — only the service-role client
// reads/writes). Hash rotation implicitly invalidates older artefacts;
// explicit pruning is not implemented in the MVP (Storage lifecycle
// rules can handle it server-side later).

import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export const CATALOG_CACHE_BUCKET = "catalog-cache";

export function cacheKey(sector: string, lang: string, dataHash: string): string {
  return `${sector}-${lang}-${dataHash}.pdf`;
}

/** Returns the cached PDF buffer, or null on cache miss / 404. Any other
 * error is thrown (caller decides whether to fall back to regeneration
 * or surface the failure). */
export async function readCached(key: string): Promise<Buffer | null> {
  const svc = createServiceClient();
  const { data, error } = await svc.storage.from(CATALOG_CACHE_BUCKET).download(key);
  if (error) {
    const status = (error as unknown as { statusCode?: number }).statusCode;
    const message = (error.message ?? "").toLowerCase();
    const notFound =
      status === 404 || message.includes("not found") || message.includes("object not found");
    if (notFound) return null;
    throw new Error(`catalog-cache download failed (${key}): ${error.message}`);
  }
  const arrayBuf = await data.arrayBuffer();
  return Buffer.from(arrayBuf);
}

export async function writeCached(key: string, buffer: Buffer): Promise<void> {
  const svc = createServiceClient();
  const { error } = await svc.storage.from(CATALOG_CACHE_BUCKET).upload(key, buffer, {
    contentType: "application/pdf",
    upsert: true,
    cacheControl: "86400", // 24 h browser/CDN hint; primary invalidation is dataHash rotation
  });
  if (error) throw new Error(`catalog-cache upload failed (${key}): ${error.message}`);
}
