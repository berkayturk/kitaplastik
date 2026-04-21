import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface ProductImage {
  path: string;
  order: number;
  alt_text: Record<string, string>;
}

export interface ProductSpec {
  preset_id: string;
  value: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  sector_id: string | null;
  name: Record<string, string>;
  description: Record<string, string>;
  images: ProductImage[];
  specs: ProductSpec[];
  active: boolean;
  display_order: number;
  updated_at: string;
}

export async function listProducts(opts: { active: boolean }): Promise<ProductRow[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("products")
    .select(
      "id, slug, sector_id, name, description, images, specs, active, display_order, updated_at",
    )
    .eq("active", opts.active)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProductRow[];
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("products")
    .select(
      "id, slug, sector_id, name, description, images, specs, active, display_order, updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as ProductRow | null) ?? null;
}

export async function slugExists(slug: string, ignoreId?: string): Promise<boolean> {
  const svc = createServiceClient();
  let q = svc.from("products").select("id", { count: "exact", head: true }).eq("slug", slug);
  if (ignoreId) q = q.neq("id", ignoreId);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
