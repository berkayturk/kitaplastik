// app/admin/sectors/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { UpdateSectorSchema } from "@/lib/admin/schemas/sector";
import { dbSlugToRouteSlug } from "@/lib/admin/sector-route-mapping";
import { assertUuid } from "@/lib/utils/assert";
import { getSectorById } from "@/lib/admin/sectors";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== "string" || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function revalidatePublicSectors(dbSlug: string): void {
  // Sektör yönetimi public tarafta /products kategori URL'lerine map ediliyor.
  const routeSlug = dbSlugToRouteSlug(dbSlug);
  for (const loc of LOCALES) {
    revalidatePath(`/${loc}/products`, "layout");
    revalidatePath(`/${loc}/products/${routeSlug}`, "page");
  }
}

export async function updateSector(id: string, formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  assertUuid(id);

  const existing = await getSectorById(id);
  if (!existing) throw new Error("Sektör bulunamadı");

  const input = UpdateSectorSchema.parse({
    name: parseJson(formData.get("name"), { tr: "", en: "", ru: "", ar: "" }),
    description: parseJson(formData.get("description"), null),
    long_description: parseJson(formData.get("long_description"), null),
    meta_title: parseJson(formData.get("meta_title"), null),
    meta_description: parseJson(formData.get("meta_description"), null),
    hero_image: parseJson(formData.get("hero_image"), null),
    display_order: Number(formData.get("display_order") ?? 0),
    active: formData.get("active") === "on",
  });

  const svc = createServiceClient();
  const { error } = await svc
    .from("sectors")
    .update({
      name: input.name,
      description: input.description,
      long_description: input.long_description,
      meta_title: input.meta_title,
      meta_description: input.meta_description,
      hero_image: input.hero_image,
      display_order: input.display_order,
      active: input.active,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "sector_updated",
    entity_type: "sector",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { name: input.name, active: input.active, display_order: input.display_order },
  });

  revalidatePublicSectors(existing.slug);
  redirect("/admin/sectors?success=updated");
}
