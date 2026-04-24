// lib/company.ts
//
// Source of truth for Kıta Plastik's company-wide contact information.
// Data lives in public.settings_company (single-row JSONB). Admin editor:
// /admin/settings/company. React.cache dedupes within a single request
// (Footer + WhatsAppFab in the same layout → 1 DB hit). Cross-request
// cache via Next.js page generation; admin updates revalidatePath("/", "layout").
//
// server-only prevents accidental import from a client component.

import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/admin/schemas/company";

export const getCompany = cache(async (): Promise<Company> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings_company").select("data").single();
  if (error || !data?.data) {
    throw new Error(
      `Company settings missing — migration seed required. (${error?.message ?? "no row"})`,
    );
  }
  return data.data as Company;
});

export type { Company } from "@/lib/admin/schemas/company";
