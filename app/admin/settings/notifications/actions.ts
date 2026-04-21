// app/admin/settings/notifications/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { assertUuid } from "@/lib/utils/assert";

export async function addRecipient(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const typesRaw = formData.getAll("types").map(String);
  const types = typesRaw.filter(
    (t): t is "custom" | "standart" => t === "custom" || t === "standart",
  );
  const emailCheck = z.string().email().safeParse(email);
  if (!emailCheck.success || types.length === 0) return;

  const svc = createServiceClient();
  const { error } = await svc
    .from("notification_recipients")
    .insert({ email, rfq_types: types, active: true });
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "recipient_added",
    entity_type: "notification_recipient",
    entity_id: null,
    user_id: user.id,
    ip: null,
    diff: { email, types },
  });
  revalidatePath("/admin/settings/notifications");
}

export async function toggleRecipient(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const id = String(formData.get("id") ?? "");
  assertUuid(id);
  const active = String(formData.get("active") ?? "false") === "true";
  const svc = createServiceClient();
  const { error } = await svc
    .from("notification_recipients")
    .update({ active: !active })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "recipient_toggled",
    entity_type: "notification_recipient",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { active: !active },
  });
  revalidatePath("/admin/settings/notifications");
}

export async function removeRecipient(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const id = String(formData.get("id") ?? "");
  assertUuid(id);
  const svc = createServiceClient();
  const { error } = await svc.from("notification_recipients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "recipient_removed",
    entity_type: "notification_recipient",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: null,
  });
  revalidatePath("/admin/settings/notifications");
}
