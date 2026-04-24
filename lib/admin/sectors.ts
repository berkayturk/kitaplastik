import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

export async function listSectors(): Promise<Sector[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("sectors")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`listSectors: ${error.message}`);
  return data ?? [];
}

export async function getSectorById(id: string): Promise<Sector | null> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("sectors").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`getSectorById: ${error.message}`);
  }
  return data;
}
