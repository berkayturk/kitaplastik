// lib/admin/company.ts
//
// Admin-scoped read of settings_company: returns the full row (id + metadata)
// so the edit form can target the singleton via RPC and display updated_at /
// updated_by. Defense-in-depth: zod-parses the JSON blob at the boundary.

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CompanySchema, type Company } from "@/lib/admin/schemas/company";

export interface CompanyRow {
  id: string;
  data: Company;
  updated_at: string;
  updated_by: string | null;
}

export async function getCompanyForAdmin(): Promise<CompanyRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings_company")
    .select("id, data, updated_at, updated_by")
    .single();
  if (error || !data) {
    throw new Error(`getCompanyForAdmin failed: ${error?.message ?? "no row"}`);
  }
  const parsed = CompanySchema.safeParse(data.data);
  if (!parsed.success) {
    throw new Error(`Company JSON schema mismatch: ${parsed.error.message}`);
  }
  return {
    id: data.id,
    data: parsed.data,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
  };
}
