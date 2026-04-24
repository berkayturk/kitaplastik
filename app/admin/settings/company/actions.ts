// app/admin/settings/company/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import { CompanySchema } from "@/lib/admin/schemas/company";
import { getCompanyForAdmin } from "@/lib/admin/company";

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== "string" || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function diffTopLevelKeys(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changed.push(k);
  }
  return changed;
}

export async function updateCompany(formData: FormData): Promise<void> {
  const user = await requireAdminRole();

  const input = CompanySchema.parse({
    legalName: formData.get("legalName"),
    brandName: formData.get("brandName"),
    shortName: formData.get("shortName"),
    founded: Number(formData.get("founded") ?? 0),
    address: parseJson(formData.get("address"), {}),
    phone: parseJson(formData.get("phone"), {}),
    cellPhone: parseJson(formData.get("cellPhone"), {}),
    fax: parseJson(formData.get("fax"), {}),
    email: parseJson(formData.get("email"), {}),
    whatsapp: parseJson(formData.get("whatsapp"), {}),
    telegram: parseJson(formData.get("telegram"), {}),
    web: parseJson(formData.get("web"), {}),
  });

  const existing = await getCompanyForAdmin();

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_company", { new_data: input });
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "company_updated",
    entity_type: "company_settings",
    entity_id: existing.id,
    user_id: user.id,
    ip: null,
    diff: {
      changed_keys: diffTopLevelKeys(
        existing.data as Record<string, unknown>,
        input as Record<string, unknown>,
      ),
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/company", "page");
  redirect("/admin/settings/company?success=updated");
}
