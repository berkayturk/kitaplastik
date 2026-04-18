// lib/references/data.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Reference, SectorKey } from "./types";

interface Row {
  id: string;
  key: string;
  logo_path: string;
  sector_key: string;
}

function mapRow(r: Row): Reference {
  return {
    id: r.id,
    key: r.key,
    logoPath: r.logo_path,
    sectorKey: r.sector_key as SectorKey,
  };
}

export async function getReferences(): Promise<ReadonlyArray<Reference>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, key, logo_path, sector_key")
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error || !data) {
    console.warn("[references] fetch failed", error?.message);
    return [];
  }
  return (data as Row[]).map(mapRow);
}

export async function getReferencesBySector(sector: SectorKey): Promise<ReadonlyArray<Reference>> {
  const all = await getReferences();
  return all.filter((r) => r.sectorKey === sector);
}
