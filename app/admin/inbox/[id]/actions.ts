// app/admin/inbox/[id]/actions.ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { assertUuid } from "@/lib/utils/assert";

const STATUSES = ["new", "reviewing", "quoted", "won", "lost", "archived"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}

export async function updateStatus(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  assertUuid(id);
  const statusRaw = String(formData.get("status") ?? "new");
  if (!isStatus(statusRaw)) throw new Error("invalid_status");
  const status = statusRaw;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const svc = createServiceClient();
  const { data: before } = await svc.from("rfqs").select("status").eq("id", id).single();
  const { error } = await svc.from("rfqs").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "rfq_status_changed",
    entity_type: "rfq",
    entity_id: id,
    user_id: user.id,
    ip,
    diff: { from: before?.status ?? null, to: status },
  });
  revalidatePath(`/admin/inbox/${id}`);
  revalidatePath("/admin/inbox");
}

export async function saveNotes(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  assertUuid(id);
  const notes = String(formData.get("notes") ?? "");
  const svc = createServiceClient();
  const { error } = await svc.from("rfqs").update({ internal_notes: notes }).eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "rfq_notes_updated",
    entity_type: "rfq",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { length: notes.length },
  });
  revalidatePath(`/admin/inbox/${id}`);
}
