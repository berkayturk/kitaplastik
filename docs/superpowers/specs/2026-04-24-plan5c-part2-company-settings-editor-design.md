# Plan 5c Part 2 — /admin/settings/company DB-backed Editör

**Tarih:** 2026-04-24
**Durum:** Spec (Gate 1 review bekliyor)
**Scope:** `lib/company.ts` static modülünü DB-backed'e taşı, admin panelinden editable hale getir. Analytics dashboard ayrı phase (Plan 5c Part 3) olarak park edildi.
**Tahmini execute süresi:** ~3 saat, ~12-15 task
**Ön gereksinim:** Plan 5c Part 1 canlıda (e5030bb), Tier 3 CI paralel canlıda (1f86229)

---

## 1. Özet

Mevcut `lib/company.ts` şirketin tüm iletişim + marka bilgisini barındıran static TypeScript sabiti; 5 public/server dosya import ediyor. Şirket bilgisi değiştiğinde kod değiştirip deploy etmek gerek — **bu phase bunu admin panel üzerinden yönetilebilir hale getirir.**

Yaklaşım: tek satırlı `settings_company` tablosu (JSONB blob + updated_at + updated_by) + zod doğrulama + `unstable_cache(tags=["company"])` + admin form (Plan 4c "section Card" pattern). Consumer'lar async fetch'e geçer; 2 client component parent RSC'den prop alır.

Analytics dashboard (Plan 5c Part 2 roadmap'teki ikinci yarım) scope'tan çıkarıldı — iki farklı domain, bağımsız test/review (Gate 2 kısalığı), YAGNI (ihtiyaç şu an boş, Plausible dashboard yeterli olabilir).

---

## 2. Brainstorm karar log (2026-04-24)

| # | Soru | Karar | Neden |
|---|---|---|---|
| 1 | Scope: company editör + analytics mi, ayrı mı? | **D: Ayır** | Domain izolasyonu, Gate 2 kısalığı, analytics belki YAGNI |
| 2 | DB schema: flat columns / JSONB blob / key-value / hybrid? | **B: JSONB blob** | Nested struct esnek, migration-less, Plan 5c Part 1 sektör pattern |
| 3 | i18n: single / adres multi / brandName+adres / full? | **A: Single-locale** | Mevcut site TR tek adres gösteriyor, AR/RU user'lar Maps ile çözüyor, YAGNI |
| 4 | Form UX: tek liste / accordion / tab / section Card? | **D: Section Card** | Plan 4c pattern, mobil dostu, tek RHF form, scroll-natural |
| 5 | Consumer migration: komple async / context / env-regen / fallback-layer? | **A: Async + tag cache** | Plan 5c Part 1 uyumlu, minimum indirection, client prop drill 2 yer |

---

## 3. Mimari

```
[Admin] → /admin/settings/company (RSC)
         → <CompanyForm defaultValues={await getCompanyForAdmin()}>
         → submit → updateCompany server action
         → validate (zod) → UPDATE settings_company → revalidateTag("company")
         → redirect + toast

[Public/RSC/API] → await getCompany()
         → unstable_cache(tags=["company"]) miss → SELECT data FROM settings_company
                                                hit  → cached Company object

[Client — WhatsAppFab in LocaleLayout]     → prop drill from RSC
[Client — WhatsAppButton in contact page]  → prop drill from RSC
```

**Cache:** `unstable_cache` tag `["company"]`, revalidate `Infinity` (yalnızca manuel tag invalidate). Edit frequency çok düşük — full cache ideal.

**Transaction:** Tek satır UPDATE, ACID. `updated_at`/`updated_by` otomatik.

**RLS:** `settings_company` `is_admin()` READ/UPDATE/INSERT. Public okuma server-side `service-role` helper ile (zaten mevcut `createServiceClient()` pattern).

---

## 4. Data model

### 4.1 DB migration

`supabase/migrations/20260424XXXXXX_settings_company.sql`:

```sql
-- Single-row table for company info — source of truth for lib/company.ts replacement.
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

CREATE POLICY settings_company_admin_read
  ON public.settings_company FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY settings_company_admin_write
  ON public.settings_company FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Insert policy: only admins can seed (initial INSERT done via migration below).
CREATE POLICY settings_company_admin_insert
  ON public.settings_company FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

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

**Not:** `updated_by` seed'de NULL (migration kullanıcısı auth.users'ta yok); ilk admin edit'ten sonra dolacak.

### 4.2 Zod schema

`lib/admin/schemas/company.ts`:

```typescript
import { z } from "zod";

const TEL_E164 = /^\+[0-9]{10,15}$/;
const WA_RE    = /^[0-9]{10,15}$/;        // wa.me format: no plus
const ISO2_RE  = /^[A-Z]{2}$/;

const addressSchema = z.object({
  street: z.string().min(2).max(200),
  district: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  countryCode: z.string().regex(ISO2_RE),
  maps: z.string().url().max(500),
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
  handle: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_]+$/),
  display: z.string().min(2).max(50),
});

const webSchema = z.object({
  primary: z.string().url(),
  alt: z.string().url(),
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

**Nota:** Tüm field required. Mevcut `lib/company.ts` hepsini dolduruyor; null/undefined kaldırılabilir alan yok. İleride (örn. fax retire) `.nullable()` + migration update ile genişler.

---

## 5. Dosya inventory

### Yeni dosyalar

```
supabase/migrations/20260424XXXXXX_settings_company.sql   # §4.1
lib/admin/schemas/company.ts                              # §4.2
lib/admin/company.ts                                      # getCompanyForAdmin() service-client read
app/admin/settings/company/page.tsx                       # RSC — getCompanyForAdmin() + <CompanyForm>
app/admin/settings/company/actions.ts                     # updateCompany server action
components/admin/settings/company/CompanyForm.tsx         # "use client" RHF + zod + 4 Card
components/admin/settings/company/CompanySection.tsx      # Pure Card wrapper (title + children)
tests/unit/lib/admin/schemas/company.test.ts              # CompanySchema 5 tests
tests/unit/components/admin/settings/company/CompanyForm.test.tsx  # 2 tests (default + dirty)
tests/e2e/admin-company-settings.spec.ts                  # Render + edit + persist + public reflect
```

### Modifiye

```
lib/company.ts                                # static COMPANY → async getCompany() (unstable_cache, server-only)
lib/supabase/types.ts                         # regen (settings_company row)
components/admin/Shell.tsx                    # active union += "company"; NavLink "Şirket"
app/[locale]/layout.tsx                       # await getCompany() + prop pass to Footer/WhatsAppFab
app/[locale]/contact/page.tsx                 # await getCompany() + prop to WhatsAppButton
app/api/contact/route.ts                      # await getCompany()
components/layout/Footer.tsx                  # interface FooterProps { company: Company }
components/contact/WhatsAppButton.tsx         # interface Props { wa, display, ... }
components/contact/WhatsAppFab.tsx            # interface Props { wa, display, ... }
```

### lib/company.ts yeni hali

```typescript
import "server-only";
import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import type { Company } from "@/lib/admin/schemas/company";

export const COMPANY_CACHE_TAG = "company";

export const getCompany = unstable_cache(
  async (): Promise<Company> => {
    const svc = createServiceClient();
    const { data, error } = await svc
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

**`server-only` import:** client bundle'a sızmayı engeller; `createServiceClient` zaten server-only ama compile-time guard ekleyelim.

---

## 6. Admin UX

### 6.1 Route

`app/admin/settings/company/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { getCompanyForAdmin } from "@/lib/admin/company";
import { CompanyForm } from "@/components/admin/settings/company/CompanyForm";

export default async function Page() {
  const user = await requireAdmin();
  const company = await getCompanyForAdmin();  // Admin-scoped, zod-validated read
  return (
    <Shell user={user} active="company">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-medium tracking-tight">Şirket Bilgileri</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Public site'ta gösterilen iletişim ve marka bilgileri.
        </p>
      </header>
      <CompanyForm defaultValues={company} />
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
│   maps (URL)                                     │
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

**CompanySection component** (pure presentational):

```tsx
interface CompanySectionProps {
  index: number;     // 01-04
  title: string;
  children: ReactNode;
}
```

Cobalt section header (Plan 4c premium form pattern): `font-mono` small "01" + title + hairline separator.

### 6.3 Server action — updateCompany

`app/admin/settings/company/actions.ts`:

```typescript
"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { CompanySchema, type Company } from "@/lib/admin/schemas/company";
import { COMPANY_CACHE_TAG } from "@/lib/company";
import { revalidateTag } from "next/cache";

interface UpdateResult {
  ok: boolean;
  error?: string;
}

export async function updateCompany(input: unknown): Promise<UpdateResult> {
  const user = await requireAdmin();
  const parsed = CompanySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation_failed" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings_company")
    .update({
      data: parsed.data,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", ...);  // tek satır olduğu için id parametresi helper'dan

  if (error) return { ok: false, error: error.message };

  revalidateTag(COMPANY_CACHE_TAG);
  return { ok: true };
}
```

**Not:** tek satır invariant olduğu için pratik olarak `.update()` whole-row yeterli; `id` known-at-first-fetch (admin read zaten döner) veya `(true)` singleton index üzerinden daraltılır.

### 6.4 Shell nav

```tsx
// components/admin/Shell.tsx
active: "catalog" | "products" | "sectors" | "references" | "bildirimler" | "company"

// nav:
<NavLink href="/admin/settings/company" active={active === "company"}>
  Şirket
</NavLink>
```

"Şirket" label kısa — 6 nav link `flex gap-6 max-w-6xl` altında taşmadan sığar.

---

## 7. Error handling

| Senaryo | Davranış |
|---|---|
| DB row yok (emergency) | `getCompany()` throw → Sentry error → 500 page |
| Admin `getCompanyForAdmin()` miss | Admin page'de "Seed eksik, migration çalıştırın" banner + CTA (manuel seed yok) |
| Admin submit zod fail | Field-level RHF errors + `aria-invalid`; submit button re-enable |
| Admin submit DB fail | Form-level red banner + error message |
| İki admin concurrent edit | Son yazan kazanır (updated_at/updated_by log'da görünür); versiyon geçmişi YOK |
| Public read — cache hit, seed sonra değişti | `revalidateTag("company")` bir sonraki request'te fresh |
| Turnstile-like throttling | Gereksiz; admin rate-limit koşmuyor (tek kullanıcı) |

---

## 8. Testing strategy

### 8.1 Unit tests

**`tests/unit/lib/admin/schemas/company.test.ts`** — 5 test:
1. Happy path — mevcut seed değerleri parse olur
2. Invalid `phone.tel` (eksik +) — reject
3. Invalid `email.primary` — reject
4. Invalid `web.primary` URL — reject
5. Missing required `legalName` — reject

**`tests/unit/components/admin/settings/company/CompanyForm.test.tsx`** — 2 test:
1. Renders with `defaultValues` — `<input name="brandName" value="Kıta Plastik">`
2. Submit button disabled initially; edit field → `isDirty && isValid` → enabled

### 8.2 E2E test

**`tests/e2e/admin-company-settings.spec.ts`** — 1 smoke:
```
- hasAdminCreds guard
- loginAsAdmin → /admin/settings/company
- Form visible, "Kıta Plastik" input rendered
- Edit phone.display → "+90 224 111 11 11"
- Submit → reload → value persisted
- Visit /tr/iletisim (public) → new phone in contact info
- Revert phone → original value (clean state)
```

**`hasAdminCreds` guard** CI'da skip, lokal admin creds set olunca çalışır (Plan 5c Part 1 pattern).

### 8.3 Verify hedefi

- Unit: 236 + 7 = **243 test** (5 schema + 2 form)
- E2E: 88 + 1 = **89 test**
- Typecheck + lint + format + audit + build + E2E hepsi yeşil
- `pnpm verify` ≤ eski (Tier 3 CI yeni süreyi verir)

---

## 9. Migration order (wave-based)

### Wave 1 — Data layer (4 task, ~30 dk)
- T1: DB migration `20260424XXXXXX_settings_company.sql` (TDD: migration test + seed)
- T2: Zod schema `lib/admin/schemas/company.ts` + 5 unit test
- T3: `lib/company.ts` rewrite (`getCompany()` async, server-only)
- T4: `lib/admin/company.ts` — `getCompanyForAdmin()` (service client + zod validate)

Commit point: canlıda site HÂLÂ static COMPANY kullanıyor — sıfır regresyon riski.

### Wave 2 — Consumer migration (3 task, ~45 dk)
- T5: `app/[locale]/layout.tsx` — await getCompany() + Footer/WhatsAppFab prop pass
- T6: `app/[locale]/contact/page.tsx` + `app/api/contact/route.ts` — await
- T7: Footer/WhatsAppButton/WhatsAppFab — interface + prop refactor

Commit point: Consumer'lar DB'den okuyor; seed aynı değerler, public-side görünüm değişmez.

### Wave 3 — Admin UI (5 task, ~60 dk)
- T8: Shell.tsx nav + active union genişlet
- T9: `CompanySection` pure component
- T10: `CompanyForm` RHF + zod + 4 Card + 2 unit test
- T11: `app/admin/settings/company/page.tsx` + `actions.ts`
- T12: `admin-company-settings.spec.ts` E2E smoke

### Wave 4 — Deploy (3 task, ~30-45 dk)
- T13: PR açma + CI bekle + Gate 2 Codex review
- T14: Critical/high fix (varsa) + re-CI
- T15: Squash merge + Coolify deploy + canlı smoke + RESUME.md update

**Rollback:**
- Wave 1+2 committed ise: `DROP TABLE settings_company` migration + Wave 1+2 commits revert → `lib/company.ts` static'e dön
- Wave 3+4 committed ise: admin page 404 OK (public çalışır), hata yok

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| `unstable_cache` Next 15 API evolution | Plan 5c Part 1'de kullanıldı, stable ✓ |
| Client component prop drill 2 yer | Minimal, pattern temiz; refactor ihtiyacı düşük |
| Admin tel format serbest (display vs tel) | UI placeholder + zod hint; validation runtime catches |
| Seed JSON syntax error (tek karakter) | Migration test (INSERT + SELECT roundtrip) Wave 1'de |
| DB tek satır invariant | UNIQUE INDEX `((true))` singleton enforce |
| Cache key conflict | tag `"company"` unique |
| WhatsApp FAB prop drill causes unnecessary client re-render | `company.whatsapp` stable object, React memoize işe yarar |

---

## 11. Scope DIŞI

- **Catalog analytics dashboard** — Plan 5c Part 3'e park edildi (ayrı brainstorm + spec + plan)
- **Versiyon geçmişi** — `settings_company_history` audit table YAGNI (tek admin)
- **Multi-lang address** — i18n kararı A (single-locale); JSONB olduğu için ileride migration-less
- **"Ayarlar" dropdown submenu Shell refactor** — horizontal 6 link yeter; submenu refactor Plan 5c Part 4 olabilir
- **Autosave** — explicit "Kaydet" düğmesi; autosave UX karmaşası gereksiz
- **"Seed et" admin butonu** — YAGNI; migration zaten seed'liyor, emergency senaryo çok düşük olasılık
- **Public company info API endpoint** — RSC direct read yeterli; REST API şu an gerekmez

---

## 12. Gate 1 Review Log

**Self-review:**
- Placeholder scan: ✓ (hepsi somut, TBD yok)
- Internal consistency: ✓ (Wave order Architecture ile uyumlu)
- Scope check: ✓ (tek domain, tek PR ölçeği)
- Ambiguity check: ✓ (zod schema tüm field'ları açık tanımlı)

**Codex Gate 1 review:** `pending` — bu dosya commit sonrası `/codex-review-spec docs/superpowers/specs/2026-04-24-plan5c-part2-company-settings-editor-design.md` çalıştırılır.

---

## 13. Onay / sonraki adım

Spec dosyası `docs/superpowers/specs/2026-04-24-plan5c-part2-company-settings-editor-design.md` olarak commit edilecek.

Sonra:
1. `/codex-review-spec` Gate 1 — critical/high inline fix
2. User review gate — değişiklik isterse revize
3. `superpowers:writing-plans` — task-level plan
4. Subagent-driven execute + Gate 2 + deploy

**🔍 Reviewed by:** Claude + Codex (GPT-5.4) (Gate 1 sonrası güncellenecek)
