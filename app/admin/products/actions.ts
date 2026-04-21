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

export async function softDeleteProduct(id: string): Promise<void> {
  const user = await requireAdminRole();
  const svc = createServiceClient();
  const { error } = await svc.from("products").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_soft_deleted",
    entity_type: "product",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { active: false },
  });

  revalidatePublicProducts();
  revalidatePath("/admin/products");
}

export async function restoreProduct(id: string): Promise<void> {
  const user = await requireAdminRole();
  const svc = createServiceClient();
  const { error } = await svc.from("products").update({ active: true }).eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_restored",
    entity_type: "product",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { active: true },
  });

  revalidatePublicProducts();
  revalidatePath("/admin/products");
}

export async function cloneProduct(sourceId: string): Promise<void> {
  const user = await requireAdminRole();
  const svc = createServiceClient();

  const source = await getProductById(sourceId);
  if (!source) throw new Error("Kaynak ürün bulunamadı");

  const newSlug = await uniqueSlug(`${source.slug}-kopya`, (s) => slugExists(s));

  type ClonedImage = { path: string; order: number; alt_text: Record<string, string> };
  const cloned: ClonedImage[] = [];
  let insertedId!: string;

  try {
    for (const img of source.images ?? []) {
      const newUuid = crypto.randomUUID();
      const ext = img.path.split(".").pop() || "jpg";
      const newPath = `${newSlug}/${newUuid}.${ext}`;
      const { error } = await svc.storage.from("product-images").copy(img.path, newPath);
      if (error) throw new Error(`storage.copy ${img.path} → ${newPath}: ${error.message}`);
      cloned.push({
        path: newPath,
        order: img.order,
        alt_text: img.alt_text ?? { tr: "", en: "", ru: "", ar: "" },
      });
    }

    const { data, error } = await svc
      .from("products")
      .insert({
        slug: newSlug,
        sector_id: source.sector_id,
        name: source.name,
        description: source.description,
        specs: source.specs.map((s) => ({ preset_id: s.preset_id, value: s.value })),
        images: cloned,
        active: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    insertedId = data.id;

    await recordAudit({
      action: "product_cloned",
      entity_type: "product",
      entity_id: data.id,
      user_id: user.id,
      ip: null,
      diff: { source_id: sourceId, new_slug: newSlug, image_count: cloned.length },
    });

    revalidatePublicProducts();
  } catch (err) {
    if (cloned.length > 0) {
      await svc.storage
        .from("product-images")
        .remove(cloned.map((c) => c.path))
        .catch(() => {});
    }
    throw err;
  }

  redirect(`/admin/products/${insertedId}/edit?cloned=1`);
}
