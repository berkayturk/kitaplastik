// app/admin/references/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { CreateReferenceSchema, UpdateReferenceSchema } from "@/lib/admin/schemas/reference";
import { dbSlugToSectorKey } from "@/lib/admin/sector-key-mapping";
import { assertUuid } from "@/lib/utils/assert";
import { getReferenceById, keyExists } from "@/lib/admin/references";
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

function revalidatePublicReferences(): void {
  for (const loc of LOCALES) {
    revalidatePath(`/${loc}`, "layout"); // anasayfa ReferencesStrip
    revalidatePath(`/${loc}/references`, "page");
  }
}

async function resolveSectorKeyFromId(sector_id: string): Promise<string> {
  const sector = await getSectorById(sector_id);
  if (!sector) throw new Error("Sector not found");
  return dbSlugToSectorKey(sector.slug);
}

export async function createReference(formData: FormData): Promise<void> {
  const user = await requireAdminRole();

  const input = CreateReferenceSchema.parse({
    key: String(formData.get("key") ?? "").trim(),
    display_name: parseJson(formData.get("display_name"), null),
    logo_path: String(formData.get("logo_path") ?? ""),
    sector_id: String(formData.get("sector_id") ?? ""),
    display_order: Number(formData.get("display_order") ?? 0),
    active: formData.get("active") !== "off",
  });

  if (await keyExists(input.key)) throw new Error(`"${input.key}" anahtarı başka referansta`);

  const sectorKey = await resolveSectorKeyFromId(input.sector_id);

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("clients")
    .insert({
      key: input.key,
      display_name: input.display_name,
      logo_path: input.logo_path,
      sector_id: input.sector_id,
      sector_key: sectorKey,
      display_order: input.display_order,
      active: input.active,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "reference_created",
    entity_type: "client",
    entity_id: data.id,
    user_id: user.id,
    ip: null,
    diff: { key: input.key, sector_id: input.sector_id, logo_path: input.logo_path },
  });

  revalidatePublicReferences();
  redirect("/admin/references?success=created");
}

export async function updateReference(id: string, formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  assertUuid(id);

  const existing = await getReferenceById(id);
  if (!existing) throw new Error("Referans bulunamadı");

  const input = UpdateReferenceSchema.parse({
    display_name: parseJson(formData.get("display_name"), null),
    logo_path: String(formData.get("logo_path") ?? existing.logo_path),
    sector_id: String(formData.get("sector_id") ?? existing.sector_id ?? ""),
    display_order: Number(formData.get("display_order") ?? existing.display_order),
    active: formData.get("active") !== "off",
  });

  const sectorKey = await resolveSectorKeyFromId(input.sector_id);
  const logoChanged = input.logo_path !== existing.logo_path;

  const svc = createServiceClient();
  const { error } = await svc
    .from("clients")
    .update({
      display_name: input.display_name,
      logo_path: input.logo_path,
      sector_id: input.sector_id,
      sector_key: sectorKey,
      display_order: input.display_order,
      active: input.active,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Eski logoyu sil (storage orphan önleme, non-fatal)
  if (logoChanged && existing.logo_path.startsWith("client-logos/")) {
    const oldKey = existing.logo_path.substring("client-logos/".length);
    try {
      const { error: removeErr } = await svc.storage.from("client-logos").remove([oldKey]);
      if (removeErr) {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureMessage(`[admin_references] old logo remove failed: ${removeErr.message}`, {
          level: "warning",
          tags: { module: "admin_references", phase: "update_old_logo" },
          extra: { oldKey },
        });
      }
    } catch (err) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(err, {
        tags: { module: "admin_references", phase: "update_old_logo" },
        extra: { oldKey },
      });
    }
  }

  await recordAudit({
    action: "reference_updated",
    entity_type: "client",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: {
      display_name: input.display_name,
      logo_path: logoChanged ? { from: existing.logo_path, to: input.logo_path } : undefined,
      sector_id:
        input.sector_id !== existing.sector_id
          ? { from: existing.sector_id, to: input.sector_id }
          : undefined,
    },
  });

  revalidatePublicReferences();
  redirect("/admin/references?success=updated");
}

export async function softDeleteReference(id: string): Promise<void> {
  const user = await requireAdminRole();
  assertUuid(id);
  const svc = createServiceClient();
  const { error } = await svc.from("clients").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "reference_soft_deleted",
    entity_type: "client",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { active: false },
  });
  revalidatePublicReferences();
  revalidatePath("/admin/references");
}

export async function hardDeleteReference(id: string, confirmToken: string): Promise<void> {
  const user = await requireAdminRole();
  assertUuid(id);
  const existing = await getReferenceById(id);
  if (!existing) throw new Error("Referans bulunamadı");
  if (existing.active) {
    throw new Error(
      "Önce referansı pasifleştirin (soft delete) — kalıcı silme yalnızca silinmiş referanslar için kullanılabilir.",
    );
  }
  // Defense-in-depth: server validates the confirmation token (key typed
  // into the modal) against the actual DB value, so a direct call without
  // going through the dialog is rejected even if the caller is admin.
  if (confirmToken !== existing.key) {
    throw new Error("Onay kelimesi eşleşmiyor — kalıcı silme iptal edildi.");
  }

  const svc = createServiceClient();

  const snapshot = {
    key: existing.key,
    sector_id: existing.sector_id,
    logo_path: existing.logo_path,
  };

  // Atomic DB delete first — guard `active=false` in the DELETE itself so a
  // concurrent restore between the read above and this write cannot result in
  // an active row being permanently deleted (TOCTOU). `count: "exact"` lets
  // us detect the race when zero rows match.
  const { error, count } = await svc
    .from("clients")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("active", false);
  if (error) throw new Error(error.message);
  if (count === 0) {
    throw new Error("Referans silinemedi: kayıt bulunamadı veya bu sırada tekrar aktifleştirildi.");
  }

  await recordAudit({
    action: "reference_hard_deleted",
    entity_type: "client",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { snapshot, irreversible: true },
  });

  // Storage cleanup AFTER DB delete — best-effort, non-fatal. Doing this only
  // post-DB ensures we never orphan storage objects when the DB delete fails.
  if (existing.logo_path?.startsWith("client-logos/")) {
    const oldKey = existing.logo_path.substring("client-logos/".length);
    const { error: removeErr } = await svc.storage.from("client-logos").remove([oldKey]);
    if (removeErr) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureMessage(
        `[admin_references] hard-delete storage cleanup failed: ${removeErr.message}`,
        {
          level: "warning",
          tags: { module: "admin_references", phase: "hard_delete_storage" },
          extra: { reference_id: id, oldKey },
        },
      );
    }
  }

  revalidatePublicReferences();
  revalidatePath("/admin/references");
}

export async function restoreReference(id: string): Promise<void> {
  const user = await requireAdminRole();
  assertUuid(id);
  const svc = createServiceClient();
  const { error } = await svc.from("clients").update({ active: true }).eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "reference_restored",
    entity_type: "client",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { active: true },
  });
  revalidatePublicReferences();
  revalidatePath("/admin/references");
}

async function swapDisplayOrder(id: string, direction: "up" | "down"): Promise<void> {
  const user = await requireAdminRole();
  assertUuid(id);
  const current = await getReferenceById(id);
  if (!current) throw new Error("Referans bulunamadı");

  const svc = createServiceClient();

  // Find neighbor with (display_order, id) compound key.
  // Step 1: strict neighbor by display_order.
  const strictOp = direction === "up" ? "lt" : "gt";
  const asc = direction === "down";
  const { data: strictNeighbors, error: strictErr } = await svc
    .from("clients")
    .select("id, display_order")
    .eq("active", current.active)
    [strictOp]("display_order", current.display_order)
    .order("display_order", { ascending: asc })
    .order("id", { ascending: asc })
    .limit(1);
  if (strictErr) throw new Error(strictErr.message);

  let neighbor = strictNeighbors?.[0] ?? null;

  // Step 2: if no strict neighbor, fall back to same display_order with id tiebreak.
  if (!neighbor) {
    const idOp = direction === "up" ? "lt" : "gt";
    const { data: tiedNeighbors, error: tiedErr } = await svc
      .from("clients")
      .select("id, display_order")
      .eq("active", current.active)
      .eq("display_order", current.display_order)
      [idOp]("id", current.id)
      .order("id", { ascending: asc })
      .limit(1);
    if (tiedErr) throw new Error(tiedErr.message);
    neighbor = tiedNeighbors?.[0] ?? null;
  }

  if (!neighbor) return; // no-op (top or bottom)

  // Atomic swap via Postgres RPC (replaces prior 2-UPDATE pattern — Gate 2 fix).
  const { error: rpcErr } = await svc.rpc("swap_client_display_order", {
    a_id: current.id,
    b_id: neighbor.id,
  });
  if (rpcErr) throw new Error(rpcErr.message);

  await recordAudit({
    action: "reference_reordered",
    entity_type: "client",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: {
      direction,
      from: current.display_order,
      to: neighbor.display_order,
      swapped_with: neighbor.id,
    },
  });
  revalidatePublicReferences();
  revalidatePath("/admin/references");
}

export async function moveReferenceUp(id: string): Promise<void> {
  await swapDisplayOrder(id, "up");
}

export async function moveReferenceDown(id: string): Promise<void> {
  await swapDisplayOrder(id, "down");
}
