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

// Mirrors the settings_company seed in the 20260424170000 migration.
// Used only when NEXT_PUBLIC_SUPABASE_URL points at the placeholder host
// (Playwright webServer + CI), where no Supabase instance is reachable
// and every getCompany() call would otherwise throw and break page render.
// Production uses the real URL and always reads from DB.
const TEST_FALLBACK_COMPANY: Company = {
  legalName: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
  brandName: "Kıta Plastik",
  shortName: "KITA",
  founded: 1989,
  address: {
    street: "Eski Gemlik Yolu Kadem Sk. No: 37-40",
    district: "Osmangazi",
    city: "Bursa",
    countryCode: "TR",
    maps: "https://www.google.com/maps/search/?api=1&query=K%C4%B1ta+Plastik%2C+Eski+Gemlik+Yolu+Kadem+Sk.+No%3A+37-40%2C+Osmangazi%2C+Bursa",
  },
  phone: { display: "+90 224 216 16 94", tel: "+902242161694" },
  cellPhone: { display: "+90 532 237 13 24", tel: "+905322371324" },
  fax: { display: "+90 224 215 05 25" },
  email: { primary: "info@kitaplastik.com", secondary: "kitaplastik@hotmail.com" },
  whatsapp: { display: "+90 224 216 16 94", wa: "905322371324" },
  telegram: { handle: "kitaplastik", display: "@kitaplastik" },
  web: {
    primary: "https://www.kitaplastik.com",
    alt: "https://www.kitaplastik.com.tr",
  },
};

function isPlaceholderSupabaseEnv(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co";
}

export const getCompany = cache(async (): Promise<Company> => {
  if (isPlaceholderSupabaseEnv()) return TEST_FALLBACK_COMPANY;

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
