import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export async function listReferences(opts: { active: boolean }): Promise<Client[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("clients")
    .select("*")
    .eq("active", opts.active)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true }); // M1 stable tie-breaker
  if (error) throw new Error(`listReferences: ${error.message}`);
  return data ?? [];
}

export async function getReferenceById(id: string): Promise<Client | null> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("clients").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getReferenceById: ${error.message}`);
  }
  return data;
}

export async function keyExists(key: string, exceptId?: string): Promise<boolean> {
  const svc = createServiceClient();
  let query = svc.from("clients").select("id").eq("key", key);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query.maybeSingle();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return Boolean(data);
}

export async function maxDisplayOrder(active: boolean): Promise<number> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("clients")
    .select("display_order")
    .eq("active", active)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data?.display_order ?? 0;
}
