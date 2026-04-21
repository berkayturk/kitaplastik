"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/admin/schemas/product";
import { slugify } from "@/lib/utils/slugify";
import { uniqueSlug } from "@/lib/utils/unique-slug";
import { slugExists, getProductById } from "@/lib/admin/products";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

function revalidatePublicProducts(): void {
  for (const loc of LOCALES) revalidatePath(`/${loc}/products`, "layout");
}

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== "string" || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function createProduct(formData: FormData): Promise<void> {
  const user = await requireAdminRole();

  const input = CreateProductSchema.parse({
    sector_id: String(formData.get("sector_id") ?? ""),
    name: parseJson(formData.get("name"), { tr: "", en: "", ru: "", ar: "" }),
    description: parseJson(formData.get("description"), { tr: "", en: "", ru: "", ar: "" }),
    specs: parseJson(formData.get("specs"), []),
    images: parseJson(formData.get("images"), []),
  });

  const baseSlug = slugify(input.name.tr);
  if (!baseSlug) throw new Error("TR adından geçerli slug üretilemedi");
  const slug = await uniqueSlug(baseSlug, (s) => slugExists(s));

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("products")
    .insert({
      slug,
      sector_id: input.sector_id,
      name: input.name,
      description: input.description,
      specs: input.specs,
      images: input.images,
      active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_created",
    entity_type: "product",
    entity_id: data.id,
    user_id: user.id,
    ip: null,
    diff: { slug, sector_id: input.sector_id },
  });

  revalidatePublicProducts();
  redirect("/admin/products?success=created");
}

export async function updateProduct(id: string, formData: FormData): Promise<void> {
  const user = await requireAdminRole();

  const slugOverride = String(formData.get("slug_override") ?? "").trim() || undefined;

  const input = UpdateProductSchema.parse({
    sector_id: String(formData.get("sector_id") ?? ""),
    name: parseJson(formData.get("name"), { tr: "", en: "", ru: "", ar: "" }),
    description: parseJson(formData.get("description"), { tr: "", en: "", ru: "", ar: "" }),
    specs: parseJson(formData.get("specs"), []),
    images: parseJson(formData.get("images"), []),
    ...(slugOverride ? { slug_override: slugOverride } : {}),
  });

  const existing = await getProductById(id);
  if (!existing) throw new Error("Ürün bulunamadı");

  let nextSlug = existing.slug;
  if (input.slug_override && input.slug_override !== existing.slug) {
    if (await slugExists(input.slug_override, id)) {
      throw new Error(`"${input.slug_override}" slug başka ürün tarafından kullanılıyor`);
    }
    nextSlug = input.slug_override;
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("products")
    .update({
      slug: nextSlug,
      sector_id: input.sector_id,
      name: input.name,
      description: input.description,
      specs: input.specs,
      images: input.images,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_updated",
    entity_type: "product",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: {
      slug: nextSlug !== existing.slug ? { from: existing.slug, to: nextSlug } : undefined,
      name: input.name,
    },
  });

  revalidatePublicProducts();
  revalidatePath(`/admin/products/${id}/edit`);
  redirect("/admin/products?success=updated");
}
