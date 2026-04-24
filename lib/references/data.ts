// lib/references/data.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Reference, SectorKey } from "./types";

interface Row {
  id: string;
  key: string;
  logo_path: string;
  sector_key: string;
  display_name: Record<string, string> | null;
}

function toPublicUrl(logoPath: string, supabaseUrl: string): string {
  if (logoPath.startsWith("/")) return logoPath; // legacy /references/*.svg
  if (logoPath.startsWith("http")) return logoPath; // absolute
  // storage path like "client-logos/<uuid>.svg"
  return `${supabaseUrl}/storage/v1/object/public/${logoPath}`;
}

function mapRow(r: Row, supabaseUrl: string): Reference {
  return {
    id: r.id,
    key: r.key,
    logoPath: toPublicUrl(r.logo_path, supabaseUrl),
    sectorKey: r.sector_key as SectorKey,
    displayName: (r.display_name ?? null) as Reference["displayName"],
  };
}

export async function getReferences(): Promise<ReadonlyArray<Reference>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, key, logo_path, sector_key, display_name")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true }); // M1 stable tie-breaker
  if (error || !data) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage(`[references] fetch failed: ${error?.message ?? "unknown"}`, "warning");
    return [];
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (data as Row[]).map((r) => mapRow(r, supabaseUrl));
}

export async function getReferencesBySector(sector: SectorKey): Promise<ReadonlyArray<Reference>> {
  const all = await getReferences();
  return all.filter((r) => r.sectorKey === sector);
}
