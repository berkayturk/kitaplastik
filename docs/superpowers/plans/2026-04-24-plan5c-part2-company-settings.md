# Plan 5c Part 2 — /admin/settings/company DB-backed Editör — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `lib/company.ts` static modülünü DB-backed `settings_company` tablosuna taşı, `/admin/settings/company` edit sayfası kur, 5 consumer'ı async'e migrate et.

**Architecture:** Tek satır JSONB blob + atomic `update_company` RPC + public SELECT policy + admin-only UPDATE via `public.is_admin_role()`. Consumer'lar `React.cache` ile request-deduped async fetch; 2 client component parent RSC'den prop. Admin form: `<form action={serverAction}>` + RHF+zod client-side validate + `recordAudit` + `revalidatePath("/", "layout")`.

**Tech Stack:** Next.js 15 App Router · TypeScript strict · Supabase Postgres + RLS + plpgsql RPC · zod v4 · React Hook Form + `@hookform/resolvers/zod` · Playwright · Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-04-24-plan5c-part2-company-settings-editor-design.md`

---

## File Structure

### Create

| Path | Responsibility |
|---|---|
| `supabase/migrations/20260424170000_settings_company.sql` | Table + singleton index + RLS (public SELECT + admin INSERT/UPDATE) + RPC `update_company(jsonb)` + seed |
| `lib/admin/schemas/company.ts` | `CompanySchema` zod (nested, https-only URLs, Google Maps host allowlist) + `Company` type |
| `lib/admin/company.ts` | `getCompanyForAdmin()` — service/server client read + zod parse + row metadata (id, updated_at, updated_by) |
| `app/admin/settings/company/page.tsx` | RSC: `requireAdminRole()` + `getCompanyForAdmin()` + `<CompanyForm>` + `?success` banner |
| `app/admin/settings/company/actions.ts` | `updateCompany(FormData)` server action — zod parse, RPC call, audit, revalidatePath, redirect |
| `components/admin/settings/company/CompanySection.tsx` | Pure Card wrapper (`index` + `title` + `children`) with cobalt section header |
| `components/admin/settings/company/CompanyForm.tsx` | `"use client"` RHF + zod resolver + 4 Card sections + hidden JSON inputs for nested submit |
| `tests/unit/lib/admin/schemas/company.test.ts` | CompanySchema unit tests (6 tests: happy + invalid tel/email/https/maps host + missing required) |
| `tests/unit/components/admin/settings/company/CompanyForm.test.tsx` | CompanyForm RTL tests (2: renders defaults, submit enables on dirty+valid) |
| `tests/e2e/admin-company-settings.spec.ts` | Playwright smoke (hasAdminCreds guard; edit phone → persist → public reflect → revert) |

### Modify

| Path | Change |
|---|---|
| `lib/company.ts` | Static `COMPANY` const kaldırılır → `getCompany()` async (`React.cache` + server client + server-only) |
| `lib/supabase/types.ts` | Regenerate (adds `settings_company` row + `update_company` RPC fn) |
| `components/admin/Shell.tsx` | `active` union'a `"company"` ekle + NavLink "Şirket" |
| `app/[locale]/layout.tsx` | `await getCompany()` + prop pass `<Footer company={...}>` + `<WhatsAppFab ...>` |
| `app/[locale]/contact/page.tsx` | `await getCompany()` + prop pass `<WhatsAppButton ...>` |
| `app/api/contact/route.ts` | `await getCompany()` yerine static import |
| `components/layout/Footer.tsx` | Props: `{ company: Company }`; import kaldır |
| `components/contact/WhatsAppButton.tsx` | Props: `{ wa, display, ... }`; import kaldır |
| `components/contact/WhatsAppFab.tsx` | Props: `{ wa, display, ... }`; import kaldır |

---

## Wave 1 — Data Layer (T1-T4)

### Task 1: DB migration + seed + RPC

**Files:**
- Create: `supabase/migrations/20260424170000_settings_company.sql`

- [ ] **Step 1.1: Write migration file**

```sql
-- supabase/migrations/20260424170000_settings_company.sql
-- Plan 5c Part 2: DB-backed company settings (replaces lib/company.ts static).
-- Single-row table; public read (contact info already public-facing);
-- admin-only write via public.is_admin_role() (Plan 4b pattern).

CREATE TABLE public.settings_company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX settings_company_singleton
  ON public.settings_company ((true));

ALTER TABLE public.settings_company ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_company_public_read
  ON public.settings_company FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY settings_company_admin_insert
  ON public.settings_company FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());

CREATE POLICY settings_company_admin_update
  ON public.settings_company FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());

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

-- Seed with current lib/company.ts values (2026-04-24 state).
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

- [ ] **Step 1.2: Apply to linked Supabase project + roundtrip smoke**

Run (Bash):
```bash
supabase db push --linked
# Expected: "Finished" + migration listed as applied

# Verify seed:
supabase db query --linked "SELECT data->>'brandName' AS brand FROM public.settings_company" 2>/dev/null
# Expected: "Kıta Plastik"

# Verify singleton:
supabase db query --linked "INSERT INTO public.settings_company (data) VALUES ('{}'::jsonb)" 2>&1 | grep -i "duplicate\|singleton"
# Expected: ERROR duplicate key value violates unique constraint "settings_company_singleton"
```

- [ ] **Step 1.3: Regenerate TypeScript types**

Run:
```bash
supabase gen types --linked > lib/supabase/types.ts
# Expected: types.ts updated with settings_company row + update_company RPC fn
```

- [ ] **Step 1.4: Typecheck (non-breaking — type not consumed yet)**

Run: `pnpm typecheck`
Expected: clean (new types unused at this point)

- [ ] **Step 1.5: Commit**

```bash
git add supabase/migrations/20260424170000_settings_company.sql lib/supabase/types.ts
git commit -m "feat(db): settings_company table + update_company RPC (Plan 5c.2 T1)"
```

---

### Task 2: Zod schema + 6 unit tests

**Files:**
- Create: `lib/admin/schemas/company.ts`
- Create: `tests/unit/lib/admin/schemas/company.test.ts`

- [ ] **Step 2.1: Write failing tests first**

```typescript
// tests/unit/lib/admin/schemas/company.test.ts
import { describe, it, expect } from "vitest";
import { CompanySchema } from "@/lib/admin/schemas/company";

const VALID = {
  legalName: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
  brandName: "Kıta Plastik",
  shortName: "KITA",
  founded: 1989,
  address: {
    street: "Eski Gemlik Yolu Kadem Sk. No: 37-40",
    district: "Osmangazi",
    city: "Bursa",
    countryCode: "TR",
    maps: "https://www.google.com/maps/search/?api=1&query=test",
  },
  phone: { display: "+90 224 216 16 94", tel: "+902242161694" },
  cellPhone: { display: "+90 532 237 13 24", tel: "+905322371324" },
  fax: { display: "+90 224 215 05 25" },
  email: { primary: "info@kitaplastik.com", secondary: "hotmail@kitaplastik.com" },
  whatsapp: { display: "+90 224 216 16 94", wa: "905322371324" },
  telegram: { handle: "kitaplastik", display: "@kitaplastik" },
  web: { primary: "https://www.kitaplastik.com", alt: "https://www.kitaplastik.com.tr" },
};

describe("CompanySchema", () => {
  it("parses current lib/company.ts seed shape", () => {
    const r = CompanySchema.safeParse(VALID);
    expect(r.success).toBe(true);
  });

  it("rejects phone.tel without leading +", () => {
    const bad = { ...VALID, phone: { ...VALID.phone, tel: "902242161694" } };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects invalid email.primary", () => {
    const bad = { ...VALID, email: { ...VALID.email, primary: "not-an-email" } };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects http:// for web.primary (https-only)", () => {
    const bad = { ...VALID, web: { ...VALID.web, primary: "http://www.kitaplastik.com" } };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects non-Google host for address.maps", () => {
    const bad = {
      ...VALID,
      address: { ...VALID.address, maps: "https://evil.example.com/maps" },
    };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects missing legalName", () => {
    const { legalName: _drop, ...bad } = VALID;
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2.2: Run test — expected fail (schema not defined)**

Run: `pnpm test -- company.test`
Expected: FAIL with "Cannot find module '@/lib/admin/schemas/company'"

- [ ] **Step 2.3: Implement schema**

```typescript
// lib/admin/schemas/company.ts
import { z } from "zod";

const TEL_E164 = /^\+[0-9]{10,15}$/;
const WA_RE = /^[0-9]{10,15}$/;
const ISO2_RE = /^[A-Z]{2}$/;
const HANDLE_RE = /^[a-zA-Z0-9_]+$/;

const httpsUrl = z
  .string()
  .url()
  .max(500)
  .refine((u) => {
    try {
      return new URL(u).protocol === "https:";
    } catch {
      return false;
    }
  }, { message: "https required" });

const mapsUrl = httpsUrl.refine(
  (u) => {
    try {
      const host = new URL(u).hostname;
      return host === "www.google.com" || host === "maps.google.com" || host === "goo.gl";
    } catch {
      return false;
    }
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

- [ ] **Step 2.4: Run test — expected 6/6 pass**

Run: `pnpm test -- company.test`
Expected: PASS (6 tests)

- [ ] **Step 2.5: Commit**

```bash
git add lib/admin/schemas/company.ts tests/unit/lib/admin/schemas/company.test.ts
git commit -m "feat(schema): CompanySchema + 6 zod unit tests (Plan 5c.2 T2)"
```

---

### Task 3: lib/company.ts rewrite — getCompany() async

**Files:**
- Modify: `lib/company.ts` (full rewrite)

**Prereq:** T1 applied (settings_company row exists in prod) + T2 committed (CompanySchema type available).

- [ ] **Step 3.1: Rewrite `lib/company.ts`**

Replace entire file contents with:

```typescript
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
});

export type { Company } from "@/lib/admin/schemas/company";
```

- [ ] **Step 3.2: Verify no lint regression on file alone**

Run: `pnpm exec eslint lib/company.ts`
Expected: no warnings (pre-existing `<img>` warning untouched elsewhere)

- [ ] **Step 3.3: Typecheck expected to FAIL — consumers still use static COMPANY**

Run: `pnpm typecheck`
Expected: errors in 5 consumers (`'COMPANY' is not exported`). This is intentional — Wave 2 fixes them.

- [ ] **Step 3.4: Do NOT commit yet — commit with Wave 2 batch**

Wave 2 migrates consumers; committing T3 alone would leave main broken.

---

### Task 4: lib/admin/company.ts — getCompanyForAdmin()

**Files:**
- Create: `lib/admin/company.ts`

- [ ] **Step 4.1: Write getCompanyForAdmin()**

```typescript
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
```

- [ ] **Step 4.2: Typecheck**

Run: `pnpm typecheck`
Expected: still the same 5 pre-existing errors from T3 (consumers). T4 file clean.

- [ ] **Step 4.3: Do NOT commit yet — bundled with Wave 2**

---

## Wave 2 — Consumer Migration (T5-T7)

### Task 5: Root layout — getCompany() + Footer/WhatsAppFab props

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Modify: `components/layout/Footer.tsx`
- Modify: `components/contact/WhatsAppFab.tsx`

- [ ] **Step 5.1: Read current Footer.tsx to capture used fields**

Run: `grep -n "COMPANY\." components/layout/Footer.tsx`

Note which `COMPANY.*` fields the Footer actually reads — those become the prop shape.

- [ ] **Step 5.2: Update Footer.tsx — accept `company` prop**

Replace `import { COMPANY } from "@/lib/company"` with:
```typescript
import type { Company } from "@/lib/company";

interface FooterProps {
  company: Company;
}

export function Footer({ company }: FooterProps) {
  // Replace every `COMPANY.` reference in JSX with `company.`
  // (e.g. COMPANY.address.street → company.address.street)
  ...
}
```

Use find-and-replace inside the JSX body: `COMPANY.` → `company.`. Leave everything else intact.

- [ ] **Step 5.3: Update WhatsAppFab.tsx — accept scalar props (client component)**

Replace `import { COMPANY }` with explicit props:
```typescript
interface WhatsAppFabProps {
  wa: string;
  display: string;
}

export function WhatsAppFab({ wa, display }: WhatsAppFabProps) {
  // Replace COMPANY.whatsapp.wa → wa, COMPANY.whatsapp.display → display
  ...
}
```

- [ ] **Step 5.4: Update app/[locale]/layout.tsx**

Add imports + prop pass:
```typescript
import { getCompany } from "@/lib/company";
// ...existing imports

export default async function LocaleLayout({ params, children }) {
  const { locale } = await params;
  const company = await getCompany();
  // ...existing locale/messages setup
  return (
    // ...providers
    <Footer company={company} />
    <WhatsAppFab wa={company.whatsapp.wa} display={company.whatsapp.display} />
    // ...
  );
}
```

- [ ] **Step 5.5: Typecheck**

Run: `pnpm typecheck`
Expected: Footer/WhatsAppFab errors resolved; `app/[locale]/contact/page.tsx` + `app/api/contact/route.ts` + `components/contact/WhatsAppButton.tsx` still error (Task 6+7).

- [ ] **Step 5.6: Do NOT commit — Wave 2 atomic**

---

### Task 6: Contact page + API route — async migration

**Files:**
- Modify: `app/[locale]/contact/page.tsx`
- Modify: `app/api/contact/route.ts`

- [ ] **Step 6.1: Update contact page**

At top of the page component (already async RSC), replace static `COMPANY` reads:
```typescript
import { getCompany } from "@/lib/company";
// ...

export default async function ContactPage({ params }) {
  const { locale } = await params;
  const company = await getCompany();
  // replace every `COMPANY.` → `company.`
  // When passing to <WhatsAppButton>, use explicit scalar props
  // (wa, display, etc.) as defined in Task 7.
  ...
}
```

- [ ] **Step 6.2: Update contact API route**

```typescript
// app/api/contact/route.ts
import { getCompany } from "@/lib/company";
// ...

export async function POST(req: Request) {
  const company = await getCompany();
  // replace every `COMPANY.` → `company.` (likely COMPANY.email.primary → company.email.primary)
  ...
}
```

- [ ] **Step 6.3: Typecheck**

Run: `pnpm typecheck`
Expected: `components/contact/WhatsAppButton.tsx` still errors (Task 7 fixes).

- [ ] **Step 6.4: Do NOT commit — Wave 2 atomic**

---

### Task 7: WhatsAppButton — scalar props

**Files:**
- Modify: `components/contact/WhatsAppButton.tsx`

- [ ] **Step 7.1: Accept scalar props**

Replace `import { COMPANY }` with explicit props:
```typescript
interface WhatsAppButtonProps {
  wa: string;
  display: string;
  // add any additional scalar COMPANY fields the button actually uses
}

export function WhatsAppButton({ wa, display }: WhatsAppButtonProps) {
  // COMPANY.whatsapp.wa → wa
  ...
}
```

- [ ] **Step 7.2: Update contact page to pass these props**

Inside `app/[locale]/contact/page.tsx`:
```tsx
<WhatsAppButton
  wa={company.whatsapp.wa}
  display={company.whatsapp.display}
/>
```

- [ ] **Step 7.3: Typecheck — should be clean now**

Run: `pnpm typecheck`
Expected: PASS (0 errors)

- [ ] **Step 7.4: Unit tests — should still pass**

Run: `pnpm test`
Expected: 242 passing (236 baseline + 6 CompanySchema)

- [ ] **Step 7.5: Full pre-commit verify (subset)**

Run: `pnpm lint && pnpm format:check`
Expected: clean

- [ ] **Step 7.6: Commit Wave 1 T3-T4 + Wave 2 T5-T7 (atomic)**

```bash
git add lib/company.ts lib/admin/company.ts \
        app/[locale]/layout.tsx app/[locale]/contact/page.tsx \
        app/api/contact/route.ts \
        components/layout/Footer.tsx \
        components/contact/WhatsAppButton.tsx \
        components/contact/WhatsAppFab.tsx
git commit -m "feat: migrate lib/company.ts to DB-backed getCompany() (Plan 5c.2 T3-T7)"
```

---

## Wave 3 — Admin UI (T8-T12)

### Task 8: Shell nav extension

**Files:**
- Modify: `components/admin/Shell.tsx`

- [ ] **Step 8.1: Extend `active` union + add NavLink**

In the `Props` interface:
```typescript
active: "catalog" | "products" | "sectors" | "references" | "bildirimler" | "company";
```

In the nav JSX, append after the references NavLink:
```tsx
<NavLink href="/admin/settings/company" active={active === "company"}>
  Şirket
</NavLink>
```

- [ ] **Step 8.2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 8.3: Commit**

```bash
git add components/admin/Shell.tsx
git commit -m "feat(admin): add Şirket nav link (Plan 5c.2 T8)"
```

---

### Task 9: CompanySection pure component

**Files:**
- Create: `components/admin/settings/company/CompanySection.tsx`

- [ ] **Step 9.1: Implement pure Card wrapper**

```tsx
// components/admin/settings/company/CompanySection.tsx
import type { ReactNode } from "react";

interface CompanySectionProps {
  index: number;   // 1-4
  title: string;
  children: ReactNode;
}

export function CompanySection({ index, title, children }: CompanySectionProps) {
  const label = index.toString().padStart(2, "0");
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border-hairline)] bg-[var(--color-bg-elevated)] p-6">
      <header className="mb-6 flex items-baseline gap-3 border-b border-[var(--color-border-hairline)] pb-3">
        <span className="font-mono text-[11px] tracking-[0.08em] text-[var(--color-accent-cobalt)]">
          BÖLÜM {label}
        </span>
        <h2 className="font-display text-[18px] font-medium tracking-tight">{title}</h2>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
```

- [ ] **Step 9.2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 9.3: Commit (folded with T10 for atomic form ship)**

Hold until T10.

---

### Task 10: CompanyForm + 2 unit tests (RHF + zod)

**Files:**
- Create: `components/admin/settings/company/CompanyForm.tsx`
- Create: `tests/unit/components/admin/settings/company/CompanyForm.test.tsx`

- [ ] **Step 10.1: Write failing tests first**

```tsx
// tests/unit/components/admin/settings/company/CompanyForm.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CompanyForm } from "@/components/admin/settings/company/CompanyForm";
import type { Company } from "@/lib/admin/schemas/company";

const DEFAULTS: Company = {
  legalName: "Test Ltd.",
  brandName: "TestBrand",
  shortName: "TEST",
  founded: 2000,
  address: {
    street: "Some street 1",
    district: "Somewhere",
    city: "Istanbul",
    countryCode: "TR",
    maps: "https://www.google.com/maps/search/?api=1&query=test",
  },
  phone: { display: "+90 224 000 00 00", tel: "+902240000000" },
  cellPhone: { display: "+90 532 000 00 00", tel: "+905320000000" },
  fax: { display: "+90 224 000 00 00" },
  email: { primary: "a@test.com", secondary: "b@test.com" },
  whatsapp: { display: "+90 224 000 00 00", wa: "902240000000" },
  telegram: { handle: "handle", display: "@handle" },
  web: { primary: "https://a.test", alt: "https://b.test" },
};

describe("CompanyForm", () => {
  it("renders all sections with defaultValues", () => {
    const noop = vi.fn();
    render(<CompanyForm defaultValues={DEFAULTS} action={noop} />);
    expect(screen.getByLabelText(/marka adı/i)).toHaveValue("TestBrand");
    expect(screen.getByLabelText(/tam.ünvan|legal/i)).toHaveValue("Test Ltd.");
    expect(screen.getAllByText(/BÖLÜM/).length).toBe(4);
  });

  it("enables submit only after a valid change", async () => {
    const user = userEvent.setup();
    const noop = vi.fn();
    render(<CompanyForm defaultValues={DEFAULTS} action={noop} />);
    const submit = screen.getByRole("button", { name: /kaydet/i });
    expect(submit).toBeDisabled();

    const brandInput = screen.getByLabelText(/marka adı/i);
    await user.clear(brandInput);
    await user.type(brandInput, "Yeni Marka");

    expect(submit).toBeEnabled();
  });
});
```

- [ ] **Step 10.2: Run — expected fail**

Run: `pnpm test -- CompanyForm`
Expected: FAIL with module not found

- [ ] **Step 10.3: Implement CompanyForm**

```tsx
// components/admin/settings/company/CompanyForm.tsx
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CompanySchema, type Company } from "@/lib/admin/schemas/company";
import { CompanySection } from "./CompanySection";

interface CompanyFormProps {
  defaultValues: Company;
  action: (formData: FormData) => void | Promise<void>;
}

export function CompanyForm({ defaultValues, action }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, isValid, isSubmitting, errors },
  } = useForm<Company>({
    resolver: zodResolver(CompanySchema),
    defaultValues,
    mode: "onChange",
  });

  // Submit path: RHF validates client-side. On valid, we manually build a
  // FormData that mirrors the server action contract (nested objects serialised
  // as JSON strings under their group name — same pattern SectorForm uses).
  const onSubmit: SubmitHandler<Company> = async () => {
    const v = getValues();
    const fd = new FormData();
    fd.set("legalName", v.legalName);
    fd.set("brandName", v.brandName);
    fd.set("shortName", v.shortName);
    fd.set("founded", String(v.founded));
    fd.set("address", JSON.stringify(v.address));
    fd.set("phone", JSON.stringify(v.phone));
    fd.set("cellPhone", JSON.stringify(v.cellPhone));
    fd.set("fax", JSON.stringify(v.fax));
    fd.set("email", JSON.stringify(v.email));
    fd.set("whatsapp", JSON.stringify(v.whatsapp));
    fd.set("telegram", JSON.stringify(v.telegram));
    fd.set("web", JSON.stringify(v.web));
    await action(fd);
  };

  const err = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-[var(--color-alert-red)]">{msg}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <CompanySection index={1} title="Marka & Kimlik">
        <LabeledInput label="Marka adı" {...register("brandName")} />
        {err(errors.brandName?.message)}
        <LabeledInput label="Tam ünvan (legal)" {...register("legalName")} />
        {err(errors.legalName?.message)}
        <LabeledInput label="Kısa ad" {...register("shortName")} />
        {err(errors.shortName?.message)}
        <LabeledInput
          label="Kuruluş yılı"
          type="number"
          {...register("founded", { valueAsNumber: true })}
        />
        {err(errors.founded?.message)}
      </CompanySection>

      <CompanySection index={2} title="İletişim">
        <h3 className="font-display text-[14px] font-medium text-[var(--color-text-secondary)]">
          Adres
        </h3>
        <LabeledInput label="Sokak / No" {...register("address.street")} />
        <div className="grid grid-cols-3 gap-3">
          <LabeledInput label="İlçe" {...register("address.district")} />
          <LabeledInput label="Şehir" {...register("address.city")} />
          <LabeledInput label="Ülke kodu (2 harf)" {...register("address.countryCode")} />
        </div>
        <LabeledInput label="Google Maps URL" {...register("address.maps")} />
        {err(errors.address?.maps?.message)}

        <h3 className="mt-4 font-display text-[14px] font-medium text-[var(--color-text-secondary)]">
          Telefonlar
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Sabit hat (görünen)" {...register("phone.display")} />
          <LabeledInput label="Sabit hat (E.164)" {...register("phone.tel")} />
        </div>
        {err(errors.phone?.tel?.message)}
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Cep (görünen)" {...register("cellPhone.display")} />
          <LabeledInput label="Cep (E.164)" {...register("cellPhone.tel")} />
        </div>
        {err(errors.cellPhone?.tel?.message)}
        <LabeledInput label="Faks (görünen)" {...register("fax.display")} />

        <h3 className="mt-4 font-display text-[14px] font-medium text-[var(--color-text-secondary)]">
          E-posta
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Birincil" type="email" {...register("email.primary")} />
          <LabeledInput label="İkincil" type="email" {...register("email.secondary")} />
        </div>
        {err(errors.email?.primary?.message)}
      </CompanySection>

      <CompanySection index={3} title="Mesajlaşma">
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="WhatsApp (görünen)" {...register("whatsapp.display")} />
          <LabeledInput label="WhatsApp (wa.me)" {...register("whatsapp.wa")} />
        </div>
        {err(errors.whatsapp?.wa?.message)}
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Telegram handle" {...register("telegram.handle")} />
          <LabeledInput label="Telegram görünen" {...register("telegram.display")} />
        </div>
      </CompanySection>

      <CompanySection index={4} title="Web">
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput label="Birincil URL" type="url" {...register("web.primary")} />
          <LabeledInput label="Alternatif URL" type="url" {...register("web.alt")} />
        </div>
        {err(errors.web?.primary?.message)}
      </CompanySection>

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/settings/company"
          className="rounded-[var(--radius-sm)] border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          İptal
        </Link>
        <button
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
          className="rounded-[var(--radius-sm)] bg-[var(--color-accent-cobalt)] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

// Small labeled input helper — local to keep the form file self-contained.
type LabeledInputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };
const LabeledInput = (() => {
  const Component = ({ label, ...rest }: LabeledInputProps, ref: React.Ref<HTMLInputElement>) => (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium tracking-wide text-[var(--color-text-secondary)] uppercase">
        {label}
      </span>
      <input
        ref={ref}
        {...rest}
        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent-cobalt)] focus:outline-none"
      />
    </label>
  );
  return Object.assign(
    (require("react") as typeof import("react")).forwardRef<HTMLInputElement, LabeledInputProps>(
      Component
    ),
    { displayName: "LabeledInput" }
  );
})();
```

- [ ] **Step 10.4: Run tests — expected 2/2 pass**

Run: `pnpm test -- CompanyForm`
Expected: PASS (2 tests)

- [ ] **Step 10.5: Commit T9 + T10 together**

```bash
git add components/admin/settings/company/ \
        tests/unit/components/admin/settings/company/
git commit -m "feat(admin): CompanyForm + CompanySection + 2 RTL tests (Plan 5c.2 T9+T10)"
```

---

### Task 11: admin page + server action + audit

**Files:**
- Create: `app/admin/settings/company/page.tsx`
- Create: `app/admin/settings/company/actions.ts`

- [ ] **Step 11.1: Write server action**

```typescript
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

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/company", "page");
  redirect("/admin/settings/company?success=updated");
}
```

- [ ] **Step 11.2: Write admin page**

```tsx
// app/admin/settings/company/page.tsx
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
        <h1 className="font-display text-[28px] font-medium tracking-tight text-[var(--color-text-primary)]">
          Şirket Bilgileri
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Public site'ta gösterilen iletişim ve marka bilgileri. Değişiklikler anında yayına alınır.
        </p>
      </header>
      {success === "updated" && (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-sm)] border border-[var(--color-accent-jade)]/40 bg-[var(--color-accent-jade)]/10 px-4 py-3 text-sm text-[var(--color-accent-jade)]"
        >
          Kaydedildi.
        </p>
      )}
      <CompanyForm defaultValues={company.data} action={updateCompany} />
    </Shell>
  );
}
```

- [ ] **Step 11.3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

- [ ] **Step 11.4: Build smoke (server action + page both compile)**

Run: `pnpm build 2>&1 | tail -30`
Expected: Successful; `/admin/settings/company` listed in route output

- [ ] **Step 11.5: Commit**

```bash
git add app/admin/settings/company/
git commit -m "feat(admin): /admin/settings/company editor (RPC + audit) (Plan 5c.2 T11)"
```

---

### Task 12: Playwright E2E smoke

**Files:**
- Create: `tests/e2e/admin-company-settings.spec.ts`

- [ ] **Step 12.1: Write the E2E spec**

```typescript
// tests/e2e/admin-company-settings.spec.ts
import { test, expect } from "@playwright/test";
import { hasAdminCreds, loginAsAdmin } from "./_helpers/admin-auth";

test.describe("Admin company settings", () => {
  test.skip(!hasAdminCreds(), "admin creds not set — skipping in CI");

  test("renders form + edits phone + public reflects", async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/settings/company");

    await expect(page.getByRole("heading", { name: /şirket bilgileri/i })).toBeVisible();

    // Snapshot original so we can revert at the end
    const phoneDisplayInput = page.getByLabel(/sabit hat \(görünen\)/i);
    const original = await phoneDisplayInput.inputValue();
    const testValue = "+90 224 111 11 11";

    await phoneDisplayInput.fill(testValue);
    await page.getByRole("button", { name: /kaydet/i }).click();

    await page.waitForURL(/\/admin\/settings\/company\?success=updated/);
    await expect(phoneDisplayInput).toHaveValue(testValue);

    // Public reflect — revalidatePath propagation
    await page.goto("/tr/iletisim");
    await expect(page.getByText(testValue)).toBeVisible({ timeout: 10_000 });

    // Revert to keep prod clean
    await page.goto("/admin/settings/company");
    await phoneDisplayInput.fill(original);
    await page.getByRole("button", { name: /kaydet/i }).click();
    await page.waitForURL(/success=updated/);
  });
});
```

- [ ] **Step 12.2: Lokal typecheck + list shard verification**

Run:
```bash
pnpm typecheck
pnpm exec playwright test --shard=1/3 --list | grep admin-company
pnpm exec playwright test --shard=2/3 --list | grep admin-company
pnpm exec playwright test --shard=3/3 --list | grep admin-company
```
Expected: test appears in exactly one shard.

- [ ] **Step 12.3: E2E execution deferred — CI skipped without creds; post-merge user smoke**

Document in PR body: "E2E spec written; guarded by hasAdminCreds; CI skips; manual run post-merge (prod Supabase state mutates; revert step built in)."

- [ ] **Step 12.4: Commit**

```bash
git add tests/e2e/admin-company-settings.spec.ts
git commit -m "test(e2e): admin-company-settings smoke spec (Plan 5c.2 T12)"
```

---

## Wave 4 — Deploy (T13-T15)

### Task 13: Open PR + wait CI

**Files:** (none — branch ops)

- [ ] **Step 13.1: Push feature branch**

```bash
# From feature branch (should have been created before T1 — see "Execution handoff" below)
git push -u origin feat/plan-5c-part2
```

- [ ] **Step 13.2: Open PR**

```bash
gh pr create --title "feat: Plan 5c Part 2 — DB-backed /admin/settings/company editor" \
             --body "$(cat <<'PRBODY'
## Summary
- Migrate lib/company.ts static const → settings_company table (JSONB, singleton, RLS public-read + admin-write)
- Atomic update_company(jsonb) RPC with is_admin_role() guard
- /admin/settings/company editor: RHF + zod + 4 Card sections + recordAudit + revalidatePath
- 5 consumers (layout, contact page/API, Footer, WhatsAppButton, WhatsAppFab) migrated to async getCompany() + prop drill for client components

## Scope
Analytics dashboard deferred to Plan 5c Part 3 (separate domain).

## Test plan
- [x] 6 zod schema unit tests (https-only URL, Google Maps host allowlist, E.164, missing-required)
- [x] 2 CompanyForm RTL tests (default values render, submit disabled until dirty+valid)
- [ ] E2E guarded by hasAdminCreds — post-merge manual smoke
- [x] pnpm verify — local green
- [ ] CI wall time ≤ 4m (Tier 3 parallel baseline)

## Security notes
- requireAdminRole() + public.is_admin_role() RLS + RPC unauthorized guard (triple-layer)
- httpsUrl + Google Maps host allowlist on all URL fields (link-injection defense)
- recordAudit diff = changed top-level keys only (no PII values in audit log)
- RPC SECURITY DEFINER + search_path locked

Spec: \`docs/superpowers/specs/2026-04-24-plan5c-part2-company-settings-editor-design.md\`
Plan: \`docs/superpowers/plans/2026-04-24-plan5c-part2-company-settings.md\`

🔍 Reviewed by: Claude + Codex (GPT-5.4)
PRBODY
)"
```

- [ ] **Step 13.3: Wait CI green**

Run: `gh pr checks --watch`
Expected: all ~10 jobs success (Tier 3 parallel — ~3-4m)

- [ ] **Step 13.4: Commit check — working tree clean**

Run: `git status`
Expected: nothing to commit

---

### Task 14: Gate 2 Codex PR review + potential fixes

**Files:** (varies based on findings)

- [ ] **Step 14.1: Run Codex Gate 2 PR review**

```
/codex-review-pr <PR-number>
```

- [ ] **Step 14.2: Apply critical/high fixes inline**

For each critical/high finding:
- Make the change in affected file(s)
- Run `pnpm typecheck && pnpm lint` to verify
- Commit with message `fix: codex gate 2 — <summary> (Plan 5c.2 T14)`

- [ ] **Step 14.3: Document medium/low in PR "Known differences"**

Append to PR body via `gh pr edit --body-file <updated>`.

- [ ] **Step 14.4: Wait re-CI green**

Run: `gh pr checks --watch`

---

### Task 15: Merge + Coolify deploy + canlı smoke

**Files:** (none — ops)

- [ ] **Step 15.1: Squash merge**

```bash
gh pr merge <PR-number> --squash --auto --delete-branch
```

- [ ] **Step 15.2: Switch local main + pull**

```bash
git checkout main
git pull --ff-only origin main
```

- [ ] **Step 15.3: Wait CI green on main + Deploy workflow_run**

Run: `gh run list --branch main --limit 5 --json databaseId,status,conclusion,workflowName`
Expected: CI success → Deploy success (Coolify webhook)

- [ ] **Step 15.4: Canlı smoke**

```bash
# Public — homepage footer should still show +90 224 216 16 94
curl -s https://kitaplastik.com/tr | grep -o "+90 224 216 16 94" | head -1
# Expected: +90 224 216 16 94

# Admin route — 307 to /admin/login (auth guard)
curl -s -o /dev/null -w "%{http_code}\n" https://kitaplastik.com/admin/settings/company
# Expected: 307

# Migration applied
supabase db query --linked "SELECT COUNT(*) FROM public.settings_company" 2>/dev/null
# Expected: 1

# RPC granted
supabase db query --linked "SELECT pg_get_functiondef(to_regprocedure('public.update_company(jsonb)'))" 2>/dev/null | grep -i "security definer"
# Expected: match
```

- [ ] **Step 15.5: User manual admin smoke**

Ask user to:
1. Login to `/admin/login` → navigate to `/admin/settings/company`
2. Verify all 4 sections render with current values
3. Edit one field (e.g. `fax.display` → add a trailing space) → Kaydet
4. Reload → verify persisted
5. Visit `/tr/iletisim` → verify public page reflects change
6. Revert the edit

- [ ] **Step 15.6: Update RESUME.md + memory**

```bash
# RESUME.md: append "Plan 5c Part 2 ✅ canlıda (<squash-sha>)" to NEXT SESSION KICKOFF
# memory/project_kitaplastik.md: update description + add Plan 5c Part 2 section
```

- [ ] **Step 15.7: Commit docs**

```bash
git add docs/superpowers/RESUME.md ~/.claude/projects/-Users-bt-claude-kitaplastik/memory/project_kitaplastik.md
git commit -m "docs(resume): Plan 5c Part 2 ✅ canlıda"
git push origin main
```

---

## Self-Review checklist

- **Spec coverage:**
  - §3 Mimari (auth, cache, RPC) → T1, T3, T5-T7, T11
  - §4.1 Migration + RPC + seed + RLS → T1
  - §4.2 Zod schema (https + maps host) → T2
  - §5 lib/company.ts rewrite → T3
  - §5 lib/admin/company.ts → T4
  - §6.1 Admin page → T11
  - §6.2 Form Card layout → T9 + T10
  - §6.3 Server action (RPC + audit + redirect) → T11
  - §6.4 Shell nav → T8
  - §7 Error handling — covered by page boundary + zod parse + RPC throw → T10+T11 impl
  - §8 Testing (6 schema + 2 form + 1 E2E) → T2, T10, T12
  - §9 Wave order matches (Wave 1-4 → T1-T15)
  - §9 Rollback runbook (pre-drop export) → deferred to operational runbook, not a task; **noted in PR body + RESUME.md**

  ✓ No gaps.

- **Placeholder scan:** No TBD/TODO/"implement later" in steps. Every code block is complete.

- **Type consistency:**
  - `Company` type defined T2, imported T3/T4/T10/T11 ✓
  - `CompanyRow` interface defined T4, imported T11 ✓
  - `CompanyForm` props: `defaultValues: Company; action: (fd: FormData) => void | Promise<void>` — T10 def matches T11 usage ✓
  - `updateCompany(formData: FormData): Promise<void>` — T11 def matches T10 action type ✓
  - `CompanySection` props: `index: number; title: string; children: ReactNode` — T9 def matches T10 usage ✓

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-24-plan5c-part2-company-settings.md`.**

Branch prep (pre-Wave 1):
```bash
git checkout -b feat/plan-5c-part2
```

**Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks, fast iteration.

**2. Inline Execution** — execute in this session with checkpoints every wave.

**Which approach?**
