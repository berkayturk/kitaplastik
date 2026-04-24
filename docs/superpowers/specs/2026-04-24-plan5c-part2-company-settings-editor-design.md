# Plan 5c Part 2 — /admin/settings/company DB-backed Editör

**Tarih:** 2026-04-24
**Durum:** Spec (Gate 1 ✅ — Codex bulguları inline fix edildi)
**Scope:** `lib/company.ts` static modülünü DB-backed'e taşı, admin panelinden editable hale getir. Analytics dashboard ayrı phase (Plan 5c Part 3) olarak park edildi.
**Tahmini execute süresi:** ~3 saat, ~15 task
**Ön gereksinim:** Plan 5c Part 1 canlıda (e5030bb), Tier 3 CI paralel canlıda (1f86229)

---

## 1. Özet

Mevcut `lib/company.ts` şirketin tüm iletişim + marka bilgisini barındıran static TypeScript sabiti; 5 public/server dosya import ediyor. Şirket bilgisi değiştiğinde kod değiştirip deploy etmek gerek — **bu phase bunu admin panel üzerinden yönetilebilir hale getirir.**

Yaklaşım: tek satırlı `settings_company` tablosu (JSONB blob + updated_at + updated_by) + zod doğrulama + `public.update_company(data jsonb)` atomic RPC + `unstable_cache(tags=["company"])` + admin form (Plan 5c Part 1 SectorForm `<form action={serverAction}>` pattern + RHF client-side validation). Consumer'lar async fetch'e geçer; 2 client component parent RSC'den prop alır.

**Analytics dashboard** (Plan 5c Part 2 roadmap'teki ikinci yarım) scope'tan çıkarıldı — iki farklı domain, bağımsız test/review (Gate 2 kısalığı), YAGNI (Plausible dashboard şu an yeterli).

---

## 2. Brainstorm karar log (2026-04-24)

| # | Soru | Karar | Neden |
|---|---|---|---|
| 1 | Scope: company editör + analytics mi, ayrı mı? | **D: Ayır** | Domain izolasyonu, Gate 2 kısalığı, analytics belki YAGNI |
| 2 | DB schema: flat columns / JSONB blob / key-value / hybrid? | **B: JSONB blob** | Nested struct esnek, migration-less, Plan 5c Part 1 sektör pattern |
| 3 | i18n: single / adres multi / brandName+adres / full? | **A: Single-locale** | Mevcut site TR tek adres gösteriyor, AR/RU user'lar Maps ile çözüyor, YAGNI |
| 4 | Form UX: tek liste / accordion / tab / section Card? | **D: Section Card** | Plan 4c pattern, mobil dostu, tek form, scroll-natural |
| 5 | Consumer migration: komple async / context / env-regen / fallback-layer? | **A: Async + tag cache** | Plan 5c Part 1 uyumlu, minimum indirection, client prop drill 2 yer |

---

## 3. Mimari

```
[Admin] → /admin/settings/company (RSC)
         → requireAdminRole() (sales/viewer redirect)
         → <CompanyForm defaultValues={await getCompanyForAdmin()}>
         → submit → <form action={updateCompany}> FormData
         → requireAdminRole() → CompanySchema.parse
         → supabase.rpc("update_company", { data })  [atomic, SECURITY DEFINER]
         → recordAudit({action:"company_updated", diff: changedKeys})
         → revalidateTag("company") + revalidatePath("/admin/settings/company")
         → redirect("/admin/settings/company?success=updated")

[Public/RSC/API] → await getCompany()
         → unstable_cache(tags=["company"]) miss → server-client SELECT data FROM settings_company
                                                hit  → cached Company object

[Client — WhatsAppFab in LocaleLayout]     → prop drill from RSC
[Client — WhatsAppButton in contact page]  → prop drill from RSC
```

**Auth boundary:**
- Read: RLS `SELECT TO anon, authenticated USING (true)` — `settings_company` public-facing data (telefon, adres, email zaten Footer'da görünür); service-role gereksiz privilege overkill. `getCompany()` normal server client kullanır.
- Write: RLS `UPDATE/INSERT WITH CHECK (public.is_admin_role())` — yalnızca `role='admin'`, sales/viewer block. Server action `requireAdminRole()` ile de redirect guard.

**Cache:** `unstable_cache` tag `["company"]`, revalidate `Infinity` (yalnızca manuel tag invalidate). Edit frequency düşük — full cache ideal.

**Concurrency model:** **Single-editor workflow** (sistemde tek admin var, prod kullanım senaryosu). İki admin aynı anda edit ederse **son yazan kazanır**; `updated_by` + `updated_at` kim/ne zaman görünür ama optimistic locking YOK. Çoklu admin gerekirse spec'e ETag/version token olarak eklenir — YAGNI şu an.

**Transaction:** Atomic RPC `update_company(data jsonb)` — singleton row id'yi RPC içinden hedefler (external caller id bilmek zorunda değil, invariant enforce).

---

## 4. Data model

### 4.1 DB migration

`supabase/migrations/20260424170000_settings_company.sql`:

```sql
-- Single-row table for company info — source of truth for lib/company.ts replacement.
-- Public read (contact info zaten Footer/Contact'ta render ediliyor).
-- Admin-only write via public.is_admin_role() (Plan 4b pattern).
CREATE TABLE public.settings_company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Singleton invariant: only one row ever.
CREATE UNIQUE INDEX settings_company_singleton
  ON public.settings_company ((true));

ALTER TABLE public.settings_company ENABLE ROW LEVEL SECURITY;

-- Public read — non-sensitive, zaten public-facing
CREATE POLICY settings_company_public_read
  ON public.settings_company FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin-only insert (pattern parity; bootstrap via migration seed below)
CREATE POLICY settings_company_admin_insert
  ON public.settings_company FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());

-- Admin-only update
CREATE POLICY settings_company_admin_update
  ON public.settings_company FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());

-- Atomic update RPC — singleton row id invariant enforced DB-side.
-- SECURITY DEFINER + explicit is_admin_role() check (defense-in-depth
-- with admin_update policy). Returns updated row for caller convenience.
CREATE OR REPLACE FUNCTION public.update_company(new_data jsonb)
RETURNS public.settings_company
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.settings_company;
BEGIN
  IF NOT public.is_admin_role() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.settings_company
    SET data = new_data,
        updated_at = now(),
        updated_by = auth.uid()
    RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'settings_company not seeded';
  END IF;

  RETURN updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_company(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_company(jsonb) TO authenticated;

-- Seed with current lib/company.ts values (transcribed from 2026-04-24 state).
INSERT INTO public.settings_company (data) VALUES ('{
  "legalName": "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
  "brandName": "Kıta Plastik",
  "shortName": "KITA",
  "founded": 1989,
  "address": {
    "street": "Eski Gemlik Yolu Kadem Sk. No: 37-40",
    "district": "Osmangazi",
    "city": "Bursa",
    "countryCode": "TR",
    "maps": "https://www.google.com/maps/search/?api=1&query=K%C4%B1ta+Plastik%2C+Eski+Gemlik+Yolu+Kadem+Sk.+No%3A+37-40%2C+Osmangazi%2C+Bursa"
  },
  "phone": { "display": "+90 224 216 16 94", "tel": "+902242161694" },
  "cellPhone": { "display": "+90 532 237 13 24", "tel": "+905322371324" },
  "fax": { "display": "+90 224 215 05 25" },
  "email": { "primary": "info@kitaplastik.com", "secondary": "kitaplastik@hotmail.com" },
  "whatsapp": { "display": "+90 224 216 16 94", "wa": "905322371324" },
  "telegram": { "handle": "kitaplastik", "display": "@kitaplastik" },
  "web": { "primary": "https://www.kitaplastik.com", "alt": "https://www.kitaplastik.com.tr" }
}'::jsonb);
```

**Not:** `updated_by` seed'de NULL (migration user'ı auth.users'ta yok); ilk admin edit'ten sonra dolacak.

### 4.2 Zod schema

`lib/admin/schemas/company.ts`:

```typescript
import { z } from "zod";

const TEL_E164 = /^\+[0-9]{10,15}$/;
const WA_RE    = /^[0-9]{10,15}$/;        // wa.me format: no plus
const ISO2_RE  = /^[A-Z]{2}$/;
const HANDLE_RE = /^[a-zA-Z0-9_]+$/;

// https-only URL (no javascript:, data:, etc. link-injection)
const httpsUrl = z
  .string()
  .url()
  .max(500)
  .refine((u) => new URL(u).protocol === "https:", { message: "https required" });

// Additional host allowlist for address.maps (Google Maps only)
const mapsUrl = httpsUrl.refine(
  (u) => {
    const host = new URL(u).hostname;
    return host === "www.google.com" || host === "maps.google.com" || host === "goo.gl";
  },
  { message: "must be a Google Maps URL" }
);

const addressSchema = z.object({
  street: z.string().min(2).max(200),
  district: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  countryCode: z.string().regex(ISO2_RE),
  maps: mapsUrl,
});

const phoneSchema = z.object({
  display: z.string().min(10).max(30),
  tel: z.string().regex(TEL_E164),
});

const faxSchema = z.object({
  display: z.string().min(10).max(30),
});

const emailSchema = z.object({
  primary: z.string().email(),
  secondary: z.string().email(),
});

const whatsappSchema = z.object({
  display: z.string().min(10).max(30),
  wa: z.string().regex(WA_RE),
});

const telegramSchema = z.object({
  handle: z.string().min(2).max(50).regex(HANDLE_RE),
  display: z.string().min(2).max(50),
});

const webSchema = z.object({
  primary: httpsUrl,
  alt: httpsUrl,
});

export const CompanySchema = z.object({
  legalName: z.string().min(2).max(200),
  brandName: z.string().min(2).max(100),
  shortName: z.string().min(2).max(20),
  founded: z.number().int().min(1900).max(new Date().getFullYear()),
  address: addressSchema,
  phone: phoneSchema,
  cellPhone: phoneSchema,
  fax: faxSchema,
  email: emailSchema,
  whatsapp: whatsappSchema,
  telegram: telegramSchema,
  web: webSchema,
});

export type Company = z.infer<typeof CompanySchema>;
```

**Field requiredness:** Tümü required. Mevcut `lib/company.ts` hepsini dolduruyor. İleride retire/nullable gerekirse `.nullable()` + migration data update.

---

## 5. Dosya inventory

### Yeni dosyalar

```
supabase/migrations/20260424170000_settings_company.sql   # §4.1
lib/admin/schemas/company.ts                              # §4.2
lib/admin/company.ts                                      # getCompanyForAdmin() — server-client + zod parse
app/admin/settings/company/page.tsx                       # RSC — requireAdminRole + <CompanyForm>
app/admin/settings/company/actions.ts                     # updateCompany server action (FormData)
components/admin/settings/company/CompanyForm.tsx         # "use client" RHF + zod + <form action={serverAction}>
components/admin/settings/company/CompanySection.tsx      # Pure Card wrapper (index + title + children)
tests/unit/lib/admin/schemas/company.test.ts              # CompanySchema 6 tests (+1 maps host)
tests/unit/components/admin/settings/company/CompanyForm.test.tsx  # 2 tests (default + dirty)
tests/e2e/admin-company-settings.spec.ts                  # Render + edit + persist + public reflect
```

### Modifiye

```
lib/company.ts                                # static COMPANY → async getCompany() (unstable_cache, server client, server-only)
lib/supabase/types.ts                         # regen (settings_company row + update_company RPC fn)
components/admin/Shell.tsx                    # active union += "company"; NavLink "Şirket"
app/[locale]/layout.tsx                       # await getCompany() + prop pass Footer/WhatsAppFab
app/[locale]/contact/page.tsx                 # await getCompany() + prop pass WhatsAppButton
app/api/contact/route.ts                      # await getCompany()
components/layout/Footer.tsx                  # interface FooterProps { company: Company }
components/contact/WhatsAppButton.tsx         # interface Props { wa, display, ... }
components/contact/WhatsAppFab.tsx            # interface Props { wa, display, ... }
```

### lib/company.ts yeni hali

```typescript
import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/admin/schemas/company";

export const COMPANY_CACHE_TAG = "company";

export const getCompany = unstable_cache(
  async (): Promise<Company> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings_company")
      .select("data")
      .single();
    if (error || !data?.data) {
      throw new Error(
        `Company settings missing — migration seed required. (${error?.message ?? "no row"})`
      );
    }
    return data.data as Company;
  },
  ["company"],
  { tags: [COMPANY_CACHE_TAG] }
);

export type { Company } from "@/lib/admin/schemas/company";
```

**Notlar:**
- `server-only` import: client bundle'a leak önler.
- `createClient()` (server client) — public SELECT policy sayesinde anon/authenticated okuma geçerli; service-role overkill değil.
- Cache `unstable_cache` tag-based; admin write → `revalidateTag("company")` invalidate.

### lib/admin/company.ts

```typescript
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
  // Zod parse: defense-in-depth — DB JSONB untrusted at runtime boundary
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
```

---

## 6. Admin UX

### 6.1 Route — page.tsx

```tsx
import { requireAdminRole } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { getCompanyForAdmin } from "@/lib/admin/company";
import { CompanyForm } from "@/components/admin/settings/company/CompanyForm";
import { updateCompany } from "./actions";

interface PageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const user = await requireAdminRole();
  const company = await getCompanyForAdmin();
  const { success } = await searchParams;
  return (
    <Shell user={user} active="company">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-medium tracking-tight">
          Şirket Bilgileri
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Public site'ta gösterilen iletişim ve marka bilgileri.
        </p>
      </header>
      {success && (
        <p role="status" className="mb-4 ...success banner...">
          Kaydedildi.
        </p>
      )}
      <CompanyForm defaultValues={company.data} action={updateCompany} />
    </Shell>
  );
}
```

### 6.2 Form layout — 4 Card section

```
┌─ Bölüm 01 · Marka & Kimlik ──────────────────────┐
│ brandName        legalName                       │
│ shortName        founded                         │
└──────────────────────────────────────────────────┘

┌─ Bölüm 02 · İletişim ────────────────────────────┐
│ Adres                                            │
│   street                                         │
│   district        city          countryCode (2)  │
│   maps (URL — Google Maps)                       │
│ Telefonlar                                       │
│   phone.display      phone.tel                   │
│   cellPhone.display  cellPhone.tel               │
│   fax.display                                    │
│ E-posta                                          │
│   email.primary      email.secondary             │
└──────────────────────────────────────────────────┘

┌─ Bölüm 03 · Mesajlaşma ──────────────────────────┐
│ whatsapp.display     whatsapp.wa                 │
│ telegram.handle      telegram.display            │
└──────────────────────────────────────────────────┘

┌─ Bölüm 04 · Web ─────────────────────────────────┐
│ web.primary          web.alt                     │
└──────────────────────────────────────────────────┘

              [İptal]   [Kaydet]  ← disabled until isDirty && isValid
```

**Form mekaniği (mevcut SectorForm pattern):**
- `<form action={serverAction}>` — Next Server Actions native
- RHF `useForm({ resolver: zodResolver(CompanySchema), defaultValues })` — client-side instant feedback
- Nested alanlar RHF `register("address.street")` → submit öncesi RHF `handleSubmit` validate; invalid ise client-side abort, geçerli ise formData serialize edip server action'a git
- Server action yine `CompanySchema.parse(parsedFormData)` — defense-in-depth, client bypass'a karşı
- Success: `redirect("/admin/settings/company?success=updated")` — full page reload, fresh data
- Error: server action throw → Next error boundary veya searchParam `?error=...`

**CompanySection component** (pure presentational):

```tsx
interface CompanySectionProps {
  index: number;  // 01-04
  title: string;
  children: ReactNode;
}
```

Cobalt section header (Plan 4c "01/02/03 section headers + cobalt accents" pattern): `font-mono` small "01" + title + hairline separator.

### 6.3 Server action — updateCompany

`app/admin/settings/company/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
import { CompanySchema } from "@/lib/admin/schemas/company";
import { COMPANY_CACHE_TAG } from "@/lib/company";
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
  after: Record<string, unknown>
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
        input as Record<string, unknown>
      ),
    },
  });

  revalidateTag(COMPANY_CACHE_TAG);
  revalidatePath("/admin/settings/company", "page");
  redirect("/admin/settings/company?success=updated");
}
```

**Notlar:**
- `requireAdminRole()` — sales/viewer role'ler redirect edilir
- RPC atomic UPDATE; singleton row id eksternalde saklanmıyor, RPC içinde hedefleniyor
- `recordAudit` diff = changed top-level keys (ör. `["phone", "email"]`) — gizlilik için değer içerik loglamıyor
- `revalidateTag("company")` → tüm `getCompany()` caller cache invalidate
- `revalidatePath("/admin/settings/company", "page")` → admin success banner fresh

### 6.4 Shell nav

```tsx
// components/admin/Shell.tsx
active: "catalog" | "products" | "sectors" | "references" | "bildirimler" | "company"

<NavLink href="/admin/settings/company" active={active === "company"}>
  Şirket
</NavLink>
```

"Şirket" label kısa — 6 nav link `flex gap-6 max-w-6xl` altında taşmadan sığar.

---

## 7. Error handling

| Senaryo | Davranış |
|---|---|
| DB row yok (emergency) | `getCompany()` throw → Sentry error → 500 page. Migration seed zaten garanti. |
| Admin `getCompanyForAdmin()` miss | Admin page error boundary. Manuel seed UI YOK (YAGNI — migration bootstrap'lar). |
| RPC `update_company` `unauthorized` (sales/viewer) | Server action throw → Next error boundary. `requireAdminRole()` zaten redirect'le keser; RPC belt-and-suspenders. |
| Admin submit zod fail (server-side) | `CompanySchema.parse` throw → Next error boundary. Client-side RHF önceden yakalar — server yalnızca bypass'a karşı. |
| İki admin concurrent edit | **Single-editor workflow kabul.** Son yazan kazanır, audit log `updated_by`/`updated_at` log'da görünür. Optimistic locking YAGNI — ihtiyaç olursa ETag header + zod `version: z.number()` field. |
| Public read — cache hit, seed sonra değişti | `revalidateTag("company")` bir sonraki request'te fresh. |
| Invalid URL scheme (javascript:, data:) | Zod `httpsUrl` refine reject — form submit öncesi; server tarafı defense-in-depth. |
| Unexpected `address.maps` host | Zod `mapsUrl` refine reject (Google Maps allowlist). |

---

## 8. Testing strategy

### 8.1 Unit tests

**`tests/unit/lib/admin/schemas/company.test.ts`** — 6 test:
1. Happy path — mevcut seed değerleri parse olur
2. Invalid `phone.tel` (eksik +) — reject
3. Invalid `email.primary` — reject
4. Invalid `web.primary` — `http://` reject (https-only)
5. Invalid `address.maps` — non-Google host reject
6. Missing required `legalName` — reject

**`tests/unit/components/admin/settings/company/CompanyForm.test.tsx`** — 2 test:
1. Renders with `defaultValues` — `<input name="brandName" value="Kıta Plastik">`
2. Submit button disabled initially; edit field → `isDirty && isValid` → enabled

### 8.2 E2E test

**`tests/e2e/admin-company-settings.spec.ts`** — 1 smoke (hasAdminCreds guard):
```
- loginAsAdmin → /admin/settings/company
- Form visible, "Kıta Plastik" brandName input rendered
- Edit phone.display "+90 224 216 16 94" → "+90 224 111 11 11"
- Submit → reload → value persisted
- Visit /tr/iletisim (public) → new phone in contact info
- Revert phone → original (clean state)
```

### 8.3 Verify hedefi

- Unit: 236 + 8 = **244 test** (6 schema + 2 form)
- E2E: 88 + 1 = **89 test**
- Typecheck + lint + format + audit + build + E2E hepsi yeşil
- CI wall time Tier 3 sonrası ~3-4 dk

---

## 9. Migration order (wave-based)

### Wave 1 — Data layer (4 task, ~35 dk)
- T1: DB migration `20260424170000_settings_company.sql` (tablo + RLS + RPC + seed)
  - Migration smoke: `supabase db reset && SELECT data FROM settings_company` roundtrip
- T2: Zod schema `lib/admin/schemas/company.ts` + 6 unit test
- T3: `lib/company.ts` rewrite (`getCompany()` async, server client, server-only)
- T4: `lib/admin/company.ts` — `getCompanyForAdmin()` + types regen

Commit point: canlıda site HÂLÂ static COMPANY kullanıyor — sıfır regresyon riski.

### Wave 2 — Consumer migration (3 task, ~45 dk)
- T5: `app/[locale]/layout.tsx` — await getCompany() + Footer/WhatsAppFab prop pass
- T6: `app/[locale]/contact/page.tsx` + `app/api/contact/route.ts` — await
- T7: Footer/WhatsAppButton/WhatsAppFab — interface + prop refactor

Commit point: Consumer'lar DB'den okuyor; seed aynı değerler, public görünüm değişmez.

### Wave 3 — Admin UI (5 task, ~60 dk)
- T8: Shell.tsx nav + active union genişlet
- T9: `CompanySection` pure component
- T10: `CompanyForm` RHF + zod + 4 Card + 2 unit test
- T11: `app/admin/settings/company/page.tsx` + `actions.ts` (+ `recordAudit`)
- T12: `admin-company-settings.spec.ts` E2E smoke

### Wave 4 — Deploy (3 task, ~30-45 dk)
- T13: PR açma + CI bekle + Gate 2 Codex review
- T14: Critical/high fix (varsa) + re-CI
- T15: Squash merge + Coolify deploy + canlı smoke + RESUME.md update

### Rollback plan

**Pre-rollback data export (MANDATORY first admin edit sonrası):**
```sql
-- 1. Canlı DB'den mevcut data çek (service-role, Supabase Dashboard SQL Editor)
SELECT data FROM public.settings_company \gset
-- 2. Çıktıyı gist'e veya /tmp/settings_company_backup_YYYYMMDD.json'a kaydet
-- 3. Commit history'ye ekle veya secret paste buffer'ına al
```

**Rollback stratejisi:**
- **Wave 1-2 sonrası rollback (henüz admin edit yok):** `DROP TABLE settings_company CASCADE` + Wave 1-2 commits revert → `lib/company.ts` static'e dön. Data loss YOK (seed = git'teki değerler).
- **Wave 3-4 sonrası rollback (admin edit olmuş):**
  1. Önce backup JSON'ı export et (yukarıdaki adım)
  2. `lib/company.ts` static COMPANY değerlerini backup JSON ile güncelle
  3. Migration + Wave 2-4 commits revert
  4. Deploy
- **Admin edit'siz acil revert:** direkt Wave 1-4 commits revert, DB table kalır ama consumer yok (unused table). Sonraki migration'da drop.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| `unstable_cache` Next 15 API evolution | Plan 5c Part 1'de kullanıldı, stable ✓ |
| Client component prop drill 2 yer | Minimal, pattern temiz; refactor ihtiyacı düşük |
| Admin tel format serbest (display vs tel) | Zod `TEL_E164` regex + placeholder hint |
| Seed JSON syntax error | Migration test (INSERT + SELECT roundtrip) Wave 1'de |
| DB tek satır invariant | UNIQUE INDEX `((true))` singleton enforce |
| Cache key conflict | tag `"company"` unique |
| Stored link-injection (URL scheme) | https-only + maps host allowlist (§4.2) |
| Role bypass (sales yazabilir) | `requireAdminRole()` + RLS `public.is_admin_role()` + RPC guard (triple-layer) |
| Concurrent admin overwrites | Single-editor workflow kabul (§7 belgeli) — YAGNI optimistic lock |
| Rollback admin edit sonrası data loss | Export-then-drop runbook (§9 Rollback) |
| Audit log privacy (PII değerleri) | `diff = changed_keys` only — değer içerikleri audit'e gitmiyor |

---

## 11. Scope DIŞI

- **Catalog analytics dashboard** — Plan 5c Part 3'e park edildi (ayrı brainstorm + spec + plan)
- **Versiyon geçmişi** — `settings_company_history` audit table YAGNI (tek admin); temel audit log yeterli
- **Multi-lang address** — i18n kararı A (single-locale); JSONB olduğu için ileride migration-less
- **"Ayarlar" dropdown submenu Shell refactor** — horizontal 6 link yeter; submenu refactor Plan 5c Part 4 olabilir
- **Autosave** — explicit "Kaydet" düğmesi; autosave UX karmaşası gereksiz
- **"Seed et" admin butonu** — YAGNI; migration zaten seed'liyor
- **Optimistic concurrency (ETag / version token)** — single-editor workflow, YAGNI
- **Public company info REST API** — RSC direct read yeterli
- **address.maps auto-generate** — admin manuel yapıştırır (1 kez set edilip unutuluyor)

---

## 12. Review Log — 2026-04-24 (Codex)

**Spec hash:** `sha256:c6be22a0fdb70d80bc9be9e7bca2a69dc0334f5eab0a9b92cdbb407300cf6f2d` (pre-fix)
**Review round:** 1
**Status:** completed

### Özet
En kritik bulgu: write path `requireAdmin()` + `is_admin()` kullanıyordu, oysa proje pattern'ı `requireAdminRole()` + `public.is_admin_role()` (sales/viewer guard). Bunun yanı sıra singleton row update hedefi belirsizdi, success flow mimari vs. action arasında çelişiyordu, rollback ilk edit sonrası veri kaybına açıktı. **Merge recommendation: block** (pre-fix).

### Bulgular ve çözümler

| Severity | Section | Bulgu | Çözüm | Durum |
|----------|---------|-------|-------|-------|
| critical | §3, §4.1, §6.3 | `requireAdmin()`/`is_admin()` kullanıyordu; sales/viewer role'leri yazabilirdi | `requireAdminRole()` + `public.is_admin_role()` + RPC `unauthorized` guard; triple-layer | ✅ INLINE FIX |
| high | §4.2, §5, §6.1-6.3 | Singleton row update hedefi belirsiz (`.eq("id", ...)` placeholder, DTO'da id yok) | Atomic RPC `public.update_company(data jsonb)` — row id RPC içinde hedeflenir, external caller id bilmek zorunda değil | ✅ INLINE FIX |
| high | §3, §6.2-6.3 | Success flow çelişkili: "redirect + toast" vs `{ ok, error }` | Mevcut SectorForm pattern'ına dön: `<form action={serverAction}>` + `redirect("/admin/settings/company?success=updated")` + FormData; RHF client-side validation layer | ✅ INLINE FIX |
| high | §9 Rollback | İlk admin edit sonrası drop = data loss | "Pre-rollback export" runbook + Wave 1-2 vs Wave 3-4 rollback stratejisi ayrımı | ✅ INLINE FIX |
| medium | §4.2 | `z.string().url()` scheme'den agnostik (javascript:, data: leak yüzeyi) | `httpsUrl` refine + `mapsUrl` Google host allowlist | ✅ INLINE FIX |
| medium | §6.3, §7 | "Son yazan kazanır" bilinçli ama optimistic guard yok | Explicit "single-editor workflow kabul" note §7, YAGNI gerekçe | ✅ INLINE FIX (acknowledge) |
| medium | §3, §5 | Public read `createServiceClient()` overkill privilege | Public SELECT policy `TO anon, authenticated USING (true)` + normal server client; data zaten public-facing | ✅ INLINE FIX |
| medium | §6.3, §11 | `recordAudit` eksik (proje pattern ihlali) | `recordAudit({action:"company_updated", entity_type:"company_settings", diff:{changed_keys}})` entegre; PII değerleri log'a girmiyor (sadece key listesi) | ✅ INLINE FIX |
| low | §4.1, §5, §9, §12 | Migration adı `XXXXXX` placeholder | `20260424170000_settings_company.sql` — sabit | ✅ INLINE FIX |
| low | §2, §11 | Scope creep gözlemi: yok ✓ | — | Kayıt düşüldü |

**Post-fix durum:** Tüm critical/high Codex bulguları spec'e inline entegre edildi. Medium'lar güvenlik/gözlemlenebilirlik best-practice olarak kabul edildi ve açıklandı. Single-editor workflow kararı user tarafından Plan 5c Part 2 kapsamında kabul edilmiş durumda (tek admin reality).

---

## 13. Onay / sonraki adım

1. **User review gate** — bu spec'i gözden geçir, medium/low kararlarına (özellikle "single-editor workflow kabul" ve "public SELECT policy") itiraz varsa revize ederim
2. Onay sonrası `superpowers:writing-plans` — task-level plan
3. Subagent-driven execute + Gate 2 PR review + Coolify deploy

**🔍 Reviewed by:** Claude + Codex (GPT-5.4) (Gate 1 complete)
