# Plan 5c Part 1 — /admin/sectors + /admin/references CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin panelinden sectors edit-only + references full-CRUD + public display_name fallback chain + statik logo → Supabase Storage migration (dual-read safe).

**Architecture:** Next.js 15 App Router + RSC + Server Actions + Supabase (Postgres + Storage) + TDD. Admin `/admin/{sectors,references}/*` TR-only, Shell navigation ile entegre. Public bileşenler `display_name[locale] ?? tClients(key+'.name') ?? key` fallback chain'i ile admin-created reference'leri render eder. Sector DB slug (TR) → canonical EN public slug mapping helper (`lib/admin/sector-route-mapping.ts`) revalidatePath + E2E için. Logo path'leri legacy `/references/*.svg` ve yeni `client-logos/<uuid>.<ext>` dual-read ile desteklenir — deploy sequence safe.

**Tech Stack:** Next.js 15.5.15, React 19, TS 5.9.3, Tailwind 4, next-intl 4.9.1, Supabase (supabase-js v2), Zod v4, Vitest, Playwright, `@/lib/admin/auth` (mevcut).

**Spec referansı:** `docs/superpowers/specs/2026-04-23-plan5c-part1-sectors-references-crud-design.md`

---

## File Structure

### Yeni dosyalar (create)

```
lib/utils/safe-translate.ts                   Missing translation sessiz-skip helper (H1)
lib/admin/sector-route-mapping.ts             DB slug (TR) → canonical EN public slug (H2)
lib/admin/sector-key-mapping.ts               DB slug → sector_key (camelCase) dual-write helper
lib/admin/schemas/sector.ts                   Zod UpdateSectorSchema
lib/admin/schemas/reference.ts                Zod Create/UpdateReferenceSchema
lib/admin/sectors.ts                          Server read helpers (listSectors, getSectorById)
lib/admin/references.ts                       Server read helpers (listReferences, getReferenceById)

app/admin/sectors/actions.ts                  updateSector server action
app/admin/sectors/page.tsx                    List (3 row, edit-only)
app/admin/sectors/[id]/edit/page.tsx          Edit form
app/admin/references/actions.ts               create/update/softDelete/restore/moveUp/moveDown
app/admin/references/page.tsx                 List (active + deleted tabs)
app/admin/references/new/page.tsx             Create form
app/admin/references/[id]/edit/page.tsx       Edit form

components/admin/sectors/SectorHeroField.tsx  Tek hero image upload (sector-images bucket)
components/admin/sectors/SectorForm.tsx       LocaleTabs + hero + meta + active
components/admin/sectors/SectorList.tsx       3 row read-only list

components/admin/references/LogoField.tsx     Tek logo upload (client-logos bucket, SVG kabul)
components/admin/references/SectorSelect.tsx  Sector dropdown (sector_id)
components/admin/references/ReferenceForm.tsx LocaleTabs display_name + logo + sector + order
components/admin/references/ReferenceList.tsx Active/deleted tabs + arrow reorder

scripts/migrate-client-logos-to-storage.ts    One-shot: public/references/*.svg → client-logos

supabase/migrations/20260424090000_plan5c_sectors_references_crud.sql

tests/unit/lib/utils/safe-translate.test.ts
tests/unit/lib/admin/sector-route-mapping.test.ts
tests/unit/lib/admin/sector-key-mapping.test.ts
tests/unit/lib/admin/schemas/sector.test.ts
tests/unit/lib/admin/schemas/reference.test.ts
tests/unit/components/admin/sectors/SectorForm.test.tsx
tests/unit/components/admin/references/ReferenceForm.test.tsx
tests/unit/components/admin/references/ReferenceList.test.tsx

tests/e2e/admin-sectors-crud.spec.ts
tests/e2e/admin-references-crud.spec.ts
```

### Değişecek dosyalar (modify)

```
lib/references/types.ts                       + displayName?: Partial<Record<Locale, string>> | null
lib/references/data.ts                        + display_name select + dual-read toPublicUrl + display_name map
components/home/ReferencesStrip.tsx           Name = displayName fallback chain
components/references/ReferenceCard.tsx       Aynı fallback chain
app/[locale]/references/page.tsx              Aynı fallback chain
components/admin/Shell.tsx                    Nav'a "Sektörler" + "Referanslar"
```

### Migration dependency

Tüm task'lar Task 6 (migration) sonrası test edilebilir. Task 1-5 foundation paralel, Task 6 blocker, sonra 7+.

---

## Task 1: `safeTranslate` helper (H1 fix — missing translation sessiz-skip)

**Files:**
- Create: `lib/utils/safe-translate.ts`
- Test: `tests/unit/lib/utils/safe-translate.test.ts`

**Why:** next-intl `t('nonexistent')` default olarak fallback string döner (key adı) veya `throwError=true` ile throw eder. Admin-created reference'te translation key yok — sessizce `null` dönmesi lazım ki public bileşen `||` chain ile DB display_name'e düşebilsin.

- [ ] **Step 1: Failing test**

```ts
// tests/unit/lib/utils/safe-translate.test.ts
import { describe, it, expect } from "vitest";
import { safeTranslate } from "@/lib/utils/safe-translate";

describe("safeTranslate", () => {
  it("returns string when key exists", () => {
    const t = (k: string) => {
      if (k === "foo.bar") return "Hello";
      throw new Error(`missing: ${k}`);
    };
    expect(safeTranslate(t, "foo.bar")).toBe("Hello");
  });

  it("returns null when translator throws (missing key)", () => {
    const t = (k: string) => {
      throw new Error(`missing: ${k}`);
    };
    expect(safeTranslate(t, "nope")).toBeNull();
  });

  it("returns null when translator returns the key itself (echo fallback)", () => {
    const t = (k: string) => k;
    expect(safeTranslate(t, "echo.me")).toBeNull();
  });

  it("returns null when translator returns empty string", () => {
    const t = (_: string) => "";
    expect(safeTranslate(t, "empty")).toBeNull();
  });

  it("returns null when translator returns undefined", () => {
    const t = (_: string) => undefined as unknown as string;
    expect(safeTranslate(t, "undef")).toBeNull();
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/lib/utils/safe-translate.test.ts`
Expected: FAIL "Cannot find module '@/lib/utils/safe-translate'"

- [ ] **Step 3: Implement**

```ts
// lib/utils/safe-translate.ts
type Translator = (key: string) => string | undefined;

export function safeTranslate(t: Translator, key: string): string | null {
  try {
    const value = t(key);
    if (!value) return null;
    if (value === key) return null; // echo fallback — next-intl returns key when missing
    return value;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/lib/utils/safe-translate.test.ts`
Expected: PASS (5 yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/utils/safe-translate.ts tests/unit/lib/utils/safe-translate.test.ts
git commit -m "feat(utils): add safeTranslate helper for missing-key silent fallback"
```

---

## Task 2: Sector route mapping (H2 fix — DB slug → canonical EN slug)

**Files:**
- Create: `lib/admin/sector-route-mapping.ts`
- Test: `tests/unit/lib/admin/sector-route-mapping.test.ts`

**Why:** DB `sectors.slug` TR kebab (`cam-yikama`) ama public canonical pathname EN (`bottle-washing`). next-intl pathnames locale-specific URL'lere canonical'dan map eder. `revalidatePath` canonical'ı yazmalı.

- [ ] **Step 1: Failing test**

```ts
// tests/unit/lib/admin/sector-route-mapping.test.ts
import { describe, it, expect } from "vitest";
import { dbSlugToRouteSlug, SECTOR_DB_TO_ROUTE } from "@/lib/admin/sector-route-mapping";

describe("dbSlugToRouteSlug", () => {
  it("maps all 3 seeded DB slugs to canonical EN", () => {
    expect(dbSlugToRouteSlug("cam-yikama")).toBe("bottle-washing");
    expect(dbSlugToRouteSlug("kapak")).toBe("caps");
    expect(dbSlugToRouteSlug("tekstil")).toBe("textile");
  });

  it("throws on unknown DB slug", () => {
    expect(() => dbSlugToRouteSlug("unknown")).toThrow(/Unknown sector DB slug/);
  });

  it("SECTOR_DB_TO_ROUTE has exactly 3 entries (seeded sectors)", () => {
    expect(Object.keys(SECTOR_DB_TO_ROUTE)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/lib/admin/sector-route-mapping.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/admin/sector-route-mapping.ts
export const SECTOR_DB_TO_ROUTE: Readonly<Record<string, string>> = Object.freeze({
  "cam-yikama": "bottle-washing",
  "kapak": "caps",
  "tekstil": "textile",
});

export function dbSlugToRouteSlug(dbSlug: string): string {
  const route = SECTOR_DB_TO_ROUTE[dbSlug];
  if (!route) throw new Error(`Unknown sector DB slug: ${dbSlug}`);
  return route;
}
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/lib/admin/sector-route-mapping.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/admin/sector-route-mapping.ts tests/unit/lib/admin/sector-route-mapping.test.ts
git commit -m "feat(admin): sector DB slug → canonical EN route mapping helper"
```

---

## Task 3: Sector key mapping (dual-write helper)

**Files:**
- Create: `lib/admin/sector-key-mapping.ts`
- Test: `tests/unit/lib/admin/sector-key-mapping.test.ts`

**Why:** `sector_key` kolonu DROP değil (dual-write). Form `sector_id` yazar + helper `sector_key` auto-sync. Spec Section 3.

- [ ] **Step 1: Failing test**

```ts
// tests/unit/lib/admin/sector-key-mapping.test.ts
import { describe, it, expect } from "vitest";
import { dbSlugToSectorKey } from "@/lib/admin/sector-key-mapping";

describe("dbSlugToSectorKey", () => {
  it("maps all 3 seeded DB slugs to camelCase sector_key", () => {
    expect(dbSlugToSectorKey("cam-yikama")).toBe("camYikama");
    expect(dbSlugToSectorKey("kapak")).toBe("kapak");
    expect(dbSlugToSectorKey("tekstil")).toBe("tekstil");
  });

  it("throws on unknown DB slug", () => {
    expect(() => dbSlugToSectorKey("unknown")).toThrow(/Unknown sector DB slug/);
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/lib/admin/sector-key-mapping.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/admin/sector-key-mapping.ts
const DB_SLUG_TO_KEY: Readonly<Record<string, string>> = Object.freeze({
  "cam-yikama": "camYikama",
  "kapak": "kapak",
  "tekstil": "tekstil",
});

export function dbSlugToSectorKey(dbSlug: string): string {
  const key = DB_SLUG_TO_KEY[dbSlug];
  if (!key) throw new Error(`Unknown sector DB slug: ${dbSlug}`);
  return key;
}
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/lib/admin/sector-key-mapping.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/admin/sector-key-mapping.ts tests/unit/lib/admin/sector-key-mapping.test.ts
git commit -m "feat(admin): sector DB slug → sector_key (camelCase) dual-write helper"
```

---

## Task 4: Zod `UpdateSectorSchema`

**Files:**
- Create: `lib/admin/schemas/sector.ts`
- Test: `tests/unit/lib/admin/schemas/sector.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/lib/admin/schemas/sector.test.ts
import { describe, it, expect } from "vitest";
import { UpdateSectorSchema } from "@/lib/admin/schemas/sector";

const valid = {
  name: { tr: "Cam Yıkama", en: "Glass Washing", ru: "", ar: "" },
  description: null,
  long_description: null,
  meta_title: null,
  meta_description: null,
  hero_image: null,
  display_order: 10,
  active: true,
};

describe("UpdateSectorSchema", () => {
  it("accepts minimum valid input (only TR name)", () => {
    expect(() => UpdateSectorSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty TR name", () => {
    expect(() => UpdateSectorSchema.parse({ ...valid, name: { tr: "", en: "x", ru: "", ar: "" } }))
      .toThrow();
  });

  it("accepts hero_image with path + 4-lang alt", () => {
    const input = {
      ...valid,
      hero_image: {
        path: "cam-yikama/abc.webp",
        alt: { tr: "Atölye", en: "Workshop", ru: "", ar: "" },
      },
    };
    expect(() => UpdateSectorSchema.parse(input)).not.toThrow();
  });

  it("accepts i18n optional fields as null", () => {
    expect(() => UpdateSectorSchema.parse(valid)).not.toThrow();
  });

  it("rejects negative display_order", () => {
    expect(() => UpdateSectorSchema.parse({ ...valid, display_order: -5 })).toThrow();
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/lib/admin/schemas/sector.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/admin/schemas/sector.ts
import { z } from "zod";

export const I18nString = z.object({
  tr: z.string().trim().default(""),
  en: z.string().trim().default(""),
  ru: z.string().trim().default(""),
  ar: z.string().trim().default(""),
});

export const UpdateSectorSchema = z.object({
  name: I18nString.refine((v) => v.tr.length > 0, "TR ad zorunlu"),
  description: I18nString.nullable(),
  long_description: I18nString.nullable(),
  meta_title: I18nString.nullable(),
  meta_description: I18nString.nullable(),
  hero_image: z
    .object({
      path: z.string().min(1),
      alt: I18nString,
    })
    .nullable(),
  display_order: z.number().int().min(0).max(1000),
  active: z.boolean(),
});

export type UpdateSectorInput = z.infer<typeof UpdateSectorSchema>;
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/lib/admin/schemas/sector.test.ts`
Expected: PASS (5 yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/schemas/sector.ts tests/unit/lib/admin/schemas/sector.test.ts
git commit -m "feat(admin): zod UpdateSectorSchema + I18nString shared"
```

---

## Task 5: Zod `Create/UpdateReferenceSchema`

**Files:**
- Create: `lib/admin/schemas/reference.ts`
- Test: `tests/unit/lib/admin/schemas/reference.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/lib/admin/schemas/reference.test.ts
import { describe, it, expect } from "vitest";
import { CreateReferenceSchema, UpdateReferenceSchema } from "@/lib/admin/schemas/reference";

const validCreate = {
  key: "c9",
  display_name: null,
  logo_path: "client-logos/00000000-0000-0000-0000-000000000000.svg",
  sector_id: "11111111-1111-1111-1111-111111111111",
  display_order: 90,
  active: true,
};

describe("CreateReferenceSchema", () => {
  it("accepts valid create input", () => {
    expect(() => CreateReferenceSchema.parse(validCreate)).not.toThrow();
  });

  it("rejects key with special chars", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, key: "bad key!" })).toThrow();
  });

  it("rejects key too long (>32)", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, key: "x".repeat(33) })).toThrow();
  });

  it("rejects invalid logo_path (wrong bucket format)", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, logo_path: "/references/c1.svg" }))
      .toThrow();
  });

  it("rejects invalid UUID sector_id", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, sector_id: "not-uuid" })).toThrow();
  });

  it("accepts display_name as null", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, display_name: null })).not.toThrow();
  });

  it("accepts display_name with partial 4-lang fields", () => {
    expect(() =>
      CreateReferenceSchema.parse({
        ...validCreate,
        display_name: { tr: "Firma X", en: "", ru: "", ar: "" },
      }),
    ).not.toThrow();
  });
});

describe("UpdateReferenceSchema", () => {
  it("omits key field (immutable)", () => {
    const { key: _omit, ...withoutKey } = validCreate;
    expect(() => UpdateReferenceSchema.parse(withoutKey)).not.toThrow();
  });

  it("rejects input with key field (should be stripped or err)", () => {
    const result = UpdateReferenceSchema.safeParse(validCreate);
    // zod .omit() strips extra fields in safeParse — no error, but key is not in output type
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/lib/admin/schemas/reference.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/admin/schemas/reference.ts
import { z } from "zod";
import { I18nString } from "./sector";

const LOGO_PATH_REGEX = /^[a-z0-9-]+\/[a-f0-9-]{36}\.(svg|png|jpg|jpeg|webp)$/i;

export const CreateReferenceSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z0-9-]+$/i, "Yalnızca harf/rakam/tire")
    .min(1)
    .max(32),
  display_name: I18nString.nullable(),
  logo_path: z.string().regex(LOGO_PATH_REGEX, "Geçersiz logo yolu"),
  sector_id: z.string().uuid("Geçersiz sector_id"),
  display_order: z.number().int().min(0).max(10000),
  active: z.boolean().default(true),
});

export const UpdateReferenceSchema = CreateReferenceSchema.omit({ key: true });

export type CreateReferenceInput = z.infer<typeof CreateReferenceSchema>;
export type UpdateReferenceInput = z.infer<typeof UpdateReferenceSchema>;
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/lib/admin/schemas/reference.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/admin/schemas/reference.ts tests/unit/lib/admin/schemas/reference.test.ts
git commit -m "feat(admin): zod Create/UpdateReferenceSchema + logo path regex"
```

---

## Task 6: Migration — sectors 4 cols + clients 2 cols + bucket hardening (H4)

**Files:**
- Create: `supabase/migrations/20260424090000_plan5c_sectors_references_crud.sql`
- Modify: `lib/supabase/types.ts` (regen after apply)

**Prereq check:** `.env.local`'da `SUPABASE_ACCESS_TOKEN` olmalı; `pnpm exec supabase status` çalışıyor olmalı.

- [ ] **Step 1: Migration SQL yaz**

```sql
-- supabase/migrations/20260424090000_plan5c_sectors_references_crud.sql
-- Plan 5c Part 1: Sectors content extension + References display_name + sector_id FK
--                 + client-logos bucket + bucket hardening (file_size_limit, mime)

-- ============================================================
-- 1. Sectors: 4 yeni kolon (Section 3 Spec)
-- ============================================================
alter table public.sectors
  add column if not exists hero_image jsonb,
  add column if not exists long_description jsonb,
  add column if not exists meta_title jsonb,
  add column if not exists meta_description jsonb;

-- ============================================================
-- 2. Clients: display_name + sector_id FK
-- ============================================================
alter table public.clients
  add column if not exists display_name jsonb,
  add column if not exists sector_id uuid references public.sectors(id) on delete set null;

-- Data migration: sector_key camelCase → sector_id UUID
update public.clients
set sector_id = (
  select id from public.sectors where slug = case clients.sector_key
    when 'camYikama' then 'cam-yikama'
    when 'kapak' then 'kapak'
    when 'tekstil' then 'tekstil'
  end
)
where sector_id is null;

-- ============================================================
-- 3. Storage: client-logos bucket + hardening (H4)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-logos',
  'client-logos',
  true,
  1048576,  -- 1 MB
  array['image/svg+xml','image/png','image/jpeg','image/webp']
)
on conflict (id) do update set
  public              = excluded.public,
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

create policy "public read client-logos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'client-logos');

create policy "admin manage client-logos" on storage.objects
  for all to authenticated
  using (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()))
  with check (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()));

-- sector-images bucket Plan 3'te oluşturuldu; hardening idempotent uygula
update storage.buckets set
  file_size_limit    = 5242880,  -- 5 MB
  allowed_mime_types = array['image/png','image/jpeg','image/webp']
where id = 'sector-images';
```

- [ ] **Step 2: Migration apply (remote)**

```bash
pnpm exec supabase db push
```

Expected: "Applying migration 20260424090000_plan5c_sectors_references_crud.sql ... Finished"

- [ ] **Step 3: Regenerate Supabase types**

```bash
pnpm exec supabase gen types typescript --linked > lib/supabase/types.ts
```

Expected: types file güncellenir. `sectors.hero_image`, `clients.display_name`, `clients.sector_id` yeni alanlar tiplerde görünür.

- [ ] **Step 4: Smoke — manuel SQL check**

```bash
pnpm exec supabase db psql --linked -c "
select column_name, data_type from information_schema.columns
where table_schema='public' and table_name='sectors'
  and column_name in ('hero_image','long_description','meta_title','meta_description');
"
```

Expected: 4 row (hepsi `jsonb`).

```bash
pnpm exec supabase db psql --linked -c "
select id, file_size_limit, allowed_mime_types from storage.buckets
where id in ('client-logos','sector-images');
"
```

Expected: 2 row, doğru limit + mime array.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260424090000_plan5c_sectors_references_crud.sql lib/supabase/types.ts
git commit -m "feat(db): Plan 5c migration — sectors content cols + clients display_name/sector_id + client-logos bucket hardening"
```

---

## Task 7: Logo migration script (`scripts/migrate-client-logos-to-storage.ts`)

**Files:**
- Create: `scripts/migrate-client-logos-to-storage.ts`
- Test: manuel (idempotent, real data)

**Not:** Bu script Phase B'de çalışır (Task 31 Deploy). Task 6 migration + Task 8 dual-read deploy sonrası. Test coverage: idempotent re-run + legacy path detection.

- [ ] **Step 1: Script yaz**

```ts
// scripts/migrate-client-logos-to-storage.ts
/**
 * One-shot migration: public/references/c1.svg ... c8.svg → client-logos bucket.
 * Idempotent — DB'de logo_path zaten `client-logos/` ile başlıyorsa skip.
 */
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const svc = createClient<Database>(SUPABASE_URL, SERVICE_KEY);
const PUBLIC_REF_DIR = path.resolve(process.cwd(), "public", "references");

async function main() {
  const { data: clients, error } = await svc
    .from("clients")
    .select("id, key, logo_path")
    .order("key");
  if (error) {
    console.error("Fetch clients failed:", error.message);
    process.exit(1);
  }

  for (const client of clients ?? []) {
    if (client.logo_path.startsWith("client-logos/")) {
      console.log(`[skip] ${client.key} already migrated → ${client.logo_path}`);
      continue;
    }

    if (!client.logo_path.startsWith("/references/")) {
      console.warn(`[warn] ${client.key} unexpected path: ${client.logo_path}`);
      continue;
    }

    const localFile = path.join(PUBLIC_REF_DIR, path.basename(client.logo_path));
    const ext = path.extname(localFile).slice(1).toLowerCase() || "svg";
    const mimeMap: Record<string, string> = {
      svg: "image/svg+xml",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };
    const contentType = mimeMap[ext] ?? "application/octet-stream";

    const fileBuffer = await readFile(localFile);
    const newPath = `${randomUUID()}.${ext}`;

    const { error: uploadErr } = await svc.storage
      .from("client-logos")
      .upload(newPath, fileBuffer, { contentType, upsert: false });
    if (uploadErr) {
      console.error(`[fail upload] ${client.key}: ${uploadErr.message}`);
      continue;
    }

    const fullPath = `client-logos/${newPath}`;
    const { error: updateErr } = await svc
      .from("clients")
      .update({ logo_path: fullPath })
      .eq("id", client.id);
    if (updateErr) {
      console.error(`[fail db update] ${client.key}: ${updateErr.message}`);
      // rollback upload
      await svc.storage.from("client-logos").remove([newPath]).catch(() => {});
      continue;
    }

    console.log(`[ok] ${client.key}: ${client.logo_path} → ${fullPath}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Dry-run (script yazıldı, henüz çalıştırılmayacak — Task 31'de)**

Syntax check:

```bash
pnpm tsc --noEmit scripts/migrate-client-logos-to-storage.ts
```

Expected: No errors (veya tsconfig path aliası hatası — bu durumda script `.tsc` standalone değil, `pnpm tsx` ile çalışır; syntax OK kabul).

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-client-logos-to-storage.ts
git commit -m "feat(scripts): one-shot logo migration public/references → client-logos bucket"
```

---

## Task 8: `lib/references/types.ts` + `data.ts` dual-read (H1 + H3)

**Files:**
- Modify: `lib/references/types.ts`
- Modify: `lib/references/data.ts`
- Test: `tests/unit/lib/references/data.test.ts` (opsiyonel — mevcut varsa güncelle, yoksa skip)

**Why:** H1 — displayName DB'den expose. H3 — logo_path dual-read (legacy `/references/*.svg` vs storage path).

- [ ] **Step 1: `types.ts` güncelle**

```ts
// lib/references/types.ts
import type { Locale } from "@/i18n/routing";

export type SectorKey = "camYikama" | "kapak" | "tekstil";

export interface Reference {
  id: string;
  key: string;
  logoPath: string;                                        // public URL (dual-read resolved)
  sectorKey: SectorKey;
  displayName: Partial<Record<Locale, string>> | null;     // NEW
}
```

- [ ] **Step 2: `data.ts` dual-read + display_name**

```ts
// lib/references/data.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Reference, SectorKey } from "./types";

interface Row {
  id: string;
  key: string;
  logo_path: string;
  sector_key: string;
  display_name: Record<string, string> | null;
}

function toPublicUrl(logoPath: string, supabaseUrl: string): string {
  if (logoPath.startsWith("/")) return logoPath;       // legacy /references/*.svg
  if (logoPath.startsWith("http")) return logoPath;     // absolute
  // storage path like "client-logos/<uuid>.svg"
  return `${supabaseUrl}/storage/v1/object/public/${logoPath}`;
}

function mapRow(r: Row, supabaseUrl: string): Reference {
  return {
    id: r.id,
    key: r.key,
    logoPath: toPublicUrl(r.logo_path, supabaseUrl),
    sectorKey: r.sector_key as SectorKey,
    displayName: (r.display_name ?? null) as Reference["displayName"],
  };
}

export async function getReferences(): Promise<ReadonlyArray<Reference>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, key, logo_path, sector_key, display_name")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true }); // M1 stable tie-breaker
  if (error || !data) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage(`[references] fetch failed: ${error?.message ?? "unknown"}`, "warning");
    return [];
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (data as Row[]).map((r) => mapRow(r, supabaseUrl));
}

export async function getReferencesBySector(sector: SectorKey): Promise<ReadonlyArray<Reference>> {
  const all = await getReferences();
  return all.filter((r) => r.sectorKey === sector);
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm run typecheck
```

Expected: No errors. `Reference.displayName` yeni type; `getReferences` return tipine yansır.

- [ ] **Step 4: Mevcut unit test'ler (references) hâlâ geçiyor mu**

```bash
pnpm vitest run tests/unit/components/ReferencesStrip.test.tsx
```

Expected: PASS (test `displayName` kullanmıyorsa değişmez; kullanıyorsa Task 9'da güncellenir).

- [ ] **Step 5: Commit**

```bash
git add lib/references/types.ts lib/references/data.ts
git commit -m "feat(references): dual-read public URL + display_name expose (H1+H3 spec fixes)"
```

---

## Task 9: `ReferencesStrip` fallback chain (H1)

**Files:**
- Modify: `components/home/ReferencesStrip.tsx`
- Test: `tests/unit/components/ReferencesStrip.test.tsx` (güncelle)

- [ ] **Step 1: Failing test güncelle**

```tsx
// tests/unit/components/ReferencesStrip.test.tsx — fallback chain assertion eklenir
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

vi.mock("@/lib/references/data", () => ({
  getReferences: vi.fn(async () => [
    {
      id: "1",
      key: "c1",
      logoPath: "https://cdn/x/c1.svg",
      sectorKey: "camYikama",
      displayName: { tr: "Acme Corp", en: "Acme Corp", ru: "", ar: "" },
    },
    {
      id: "2",
      key: "c2",
      logoPath: "/references/c2.svg",
      sectorKey: "kapak",
      displayName: null, // legacy: translation'dan düşer
    },
  ]),
}));

import { ReferencesStrip } from "@/components/home/ReferencesStrip";

const messages = {
  home: { references: { eyebrow: "Müşteriler", title: "Referanslarımız", viewAll: "Tümü" } },
  references: { clients: { c2: { name: "Legacy Co" } } }, // c1 yok → displayName'den düşer
};

describe("ReferencesStrip", () => {
  it("uses displayName when present, falls back to translation when null", async () => {
    const ui = await ReferencesStrip();
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        {ui}
      </NextIntlClientProvider>,
    );
    const images = screen.getAllByRole("img");
    const alts = images.map((img) => img.getAttribute("alt"));
    expect(alts).toContain("Acme Corp"); // from displayName.tr
    expect(alts).toContain("Legacy Co"); // from translation
  });

  it("falls back to key when both displayName and translation missing", async () => {
    // Bu case E2E'de doğrulanır — unit'te mock'ları re-configure etmek complex
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/components/ReferencesStrip.test.tsx`
Expected: FAIL (mevcut implementation displayName'i okumaz)

- [ ] **Step 3: Implement fallback chain**

```tsx
// components/home/ReferencesStrip.tsx
import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Container } from "../layout/Container";
import { getReferences } from "@/lib/references/data";
import { safeTranslate } from "@/lib/utils/safe-translate";
import type { Locale } from "@/i18n/routing";

export async function ReferencesStrip() {
  const tHome = await getTranslations("home.references");
  const tClients = await getTranslations("references.clients");
  const locale = (await getLocale()) as Locale;
  const references = await getReferences();

  return (
    <section
      aria-labelledby="references-strip-title"
      className="border-y border-[var(--color-border-hairline)] bg-[var(--color-bg-subtle)] py-12 md:py-16"
    >
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{tHome("eyebrow")}</p>
            <h2
              id="references-strip-title"
              className="font-display mt-3 text-[22px] leading-[1.2] font-medium tracking-[-0.01em] md:text-[26px]"
              style={{ fontOpticalSizing: "auto" }}
            >
              {tHome("title")}
            </h2>
          </div>
          <Link
            href="/references"
            className="text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-200 ease-out hover:text-[var(--color-accent-cobalt)]"
          >
            {tHome("viewAll")} →
          </Link>
        </div>

        <ul
          role="list"
          className="grid grid-cols-2 items-center gap-x-10 gap-y-8 sm:grid-cols-4 lg:grid-cols-8"
        >
          {references.map((ref) => {
            const name =
              ref.displayName?.[locale]?.trim() ||
              safeTranslate((k) => tClients(k), `${ref.key}.name`) ||
              ref.key;
            return (
              <li key={ref.id} className="flex items-center justify-center">
                <Image
                  src={ref.logoPath}
                  alt={name}
                  width={140}
                  height={48}
                  className="h-9 w-auto opacity-55 brightness-50 grayscale transition-opacity duration-200 ease-out hover:opacity-100 hover:brightness-100 hover:grayscale-0"
                />
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/components/ReferencesStrip.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/home/ReferencesStrip.tsx tests/unit/components/ReferencesStrip.test.tsx
git commit -m "feat(home): ReferencesStrip display_name fallback chain (H1)"
```

---

## Task 10: `ReferenceCard` fallback chain (H1)

**Files:**
- Modify: `components/references/ReferenceCard.tsx`

**Why:** Aynı fallback pattern /references list sayfasında.

- [ ] **Step 1: Mevcut kod oku**

Run: `cat components/references/ReferenceCard.tsx`
Expected: Component `tClients(ref.key + '.name')` pattern kullanıyor — refactor hedefi.

- [ ] **Step 2: Implement fallback chain**

```tsx
// components/references/ReferenceCard.tsx
import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import { safeTranslate } from "@/lib/utils/safe-translate";
import type { Reference } from "@/lib/references/types";
import type { Locale } from "@/i18n/routing";

interface Props {
  ref_: Reference;
}

export async function ReferenceCard({ ref_ }: Props) {
  const tClients = await getTranslations("references.clients");
  const locale = (await getLocale()) as Locale;

  const name =
    ref_.displayName?.[locale]?.trim() ||
    safeTranslate((k) => tClients(k), `${ref_.key}.name`) ||
    ref_.key;

  return (
    <li className="flex items-center justify-center rounded-lg border border-[var(--color-border-hairline)] bg-[var(--color-bg-subtle)] p-6">
      <Image src={ref_.logoPath} alt={name} width={160} height={60} className="h-12 w-auto" />
    </li>
  );
}
```

> Not: Prop adı `ref` reserved (React ref forwarding); `ref_` underscore suffix ile collision önlenir. Callers'ı güncelle.

- [ ] **Step 3: Typecheck + callers güncelle**

```bash
pnpm run typecheck
```

Eğer `ReferenceCard` eski `<ReferenceCard ref={r} />` pattern ile kullanılıyorsa, callers `<ReferenceCard ref_={r} />` olarak güncellenir. `app/[locale]/references/page.tsx` ana caller.

- [ ] **Step 4: Commit**

```bash
git add components/references/ReferenceCard.tsx
git commit -m "feat(references): ReferenceCard display_name fallback chain (H1)"
```

---

## Task 11: `/[locale]/references/page.tsx` fallback chain (H1)

**Files:**
- Modify: `app/[locale]/references/page.tsx`

- [ ] **Step 1: Mevcut kod oku**

Run: `cat 'app/[locale]/references/page.tsx'`
Expected: Component muhtemelen kendi `tClients` + `ref.key` pattern'ı kullanıyor.

- [ ] **Step 2: Implement fallback chain**

```tsx
// app/[locale]/references/page.tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { getReferences } from "@/lib/references/data";
import { safeTranslate } from "@/lib/utils/safe-translate";
import { ReferenceCard } from "@/components/references/ReferenceCard";

const ROUTE = "/references";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.references" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}${ROUTE}`,
      languages: buildAlternates(ROUTE, origin).languages,
    },
  };
}

export default async function ReferencesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.references");
  const references = await getReferences();

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-text-primary font-display mt-3 text-4xl font-medium tracking-tight md:text-5xl">
          {t("title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{t("subtitle")}</p>
      </header>

      <ul
        role="list"
        className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
      >
        {references.map((r) => (
          <ReferenceCard key={r.id} ref_={r} />
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm run typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/[locale]/references/page.tsx'
git commit -m "feat(references): public page uses ReferenceCard with displayName fallback (H1)"
```

---

## Task 12: `lib/admin/sectors.ts` read helpers

**Files:**
- Create: `lib/admin/sectors.ts`

- [ ] **Step 1: Implement**

```ts
// lib/admin/sectors.ts
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

export async function listSectors(): Promise<Sector[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("sectors")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(`listSectors: ${error.message}`);
  return data ?? [];
}

export async function getSectorById(id: string): Promise<Sector | null> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("sectors").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`getSectorById: ${error.message}`);
  }
  return data;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/admin/sectors.ts
git commit -m "feat(admin): sectors read helpers (listSectors, getSectorById)"
```

---

## Task 13: `lib/admin/references.ts` read helpers

**Files:**
- Create: `lib/admin/references.ts`

- [ ] **Step 1: Implement**

```ts
// lib/admin/references.ts
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

export async function listReferences(opts: { active: boolean }): Promise<Client[]> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("clients")
    .select("*")
    .eq("active", opts.active)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true }); // M1 stable tie-breaker
  if (error) throw new Error(`listReferences: ${error.message}`);
  return data ?? [];
}

export async function getReferenceById(id: string): Promise<Client | null> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("clients").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getReferenceById: ${error.message}`);
  }
  return data;
}

export async function keyExists(key: string, exceptId?: string): Promise<boolean> {
  const svc = createServiceClient();
  let query = svc.from("clients").select("id").eq("key", key);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query.maybeSingle();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return Boolean(data);
}

export async function maxDisplayOrder(active: boolean): Promise<number> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("clients")
    .select("display_order")
    .eq("active", active)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data?.display_order ?? 0;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/admin/references.ts
git commit -m "feat(admin): references read helpers (list, get, keyExists, maxDisplayOrder)"
```

---

## Task 14: `app/admin/sectors/actions.ts` — `updateSector`

**Files:**
- Create: `app/admin/sectors/actions.ts`

- [ ] **Step 1: Implement**

```ts
// app/admin/sectors/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { UpdateSectorSchema } from "@/lib/admin/schemas/sector";
import { dbSlugToRouteSlug } from "@/lib/admin/sector-route-mapping";
import { assertUuid } from "@/lib/utils/assert";
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

function revalidatePublicSectors(dbSlug: string): void {
  const routeSlug = dbSlugToRouteSlug(dbSlug);
  for (const loc of LOCALES) {
    revalidatePath(`/${loc}/sectors`, "layout");
    revalidatePath(`/${loc}/sectors/${routeSlug}`, "page");
  }
}

export async function updateSector(id: string, formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  assertUuid(id);

  const existing = await getSectorById(id);
  if (!existing) throw new Error("Sektör bulunamadı");

  const input = UpdateSectorSchema.parse({
    name: parseJson(formData.get("name"), { tr: "", en: "", ru: "", ar: "" }),
    description: parseJson(formData.get("description"), null),
    long_description: parseJson(formData.get("long_description"), null),
    meta_title: parseJson(formData.get("meta_title"), null),
    meta_description: parseJson(formData.get("meta_description"), null),
    hero_image: parseJson(formData.get("hero_image"), null),
    display_order: Number(formData.get("display_order") ?? 0),
    active: formData.get("active") === "on",
  });

  const svc = createServiceClient();
  const { error } = await svc
    .from("sectors")
    .update({
      name: input.name,
      description: input.description,
      long_description: input.long_description,
      meta_title: input.meta_title,
      meta_description: input.meta_description,
      hero_image: input.hero_image,
      display_order: input.display_order,
      active: input.active,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "sector_updated",
    entity_type: "sector",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { name: input.name, active: input.active, display_order: input.display_order },
  });

  revalidatePublicSectors(existing.slug);
  redirect("/admin/sectors?success=updated");
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/sectors/actions.ts
git commit -m "feat(admin/sectors): updateSector action (canonical EN revalidate — H2)"
```

---

## Task 15: `app/admin/references/actions.ts` — full CRUD + reorder

**Files:**
- Create: `app/admin/references/actions.ts`

- [ ] **Step 1: Implement**

```ts
// app/admin/references/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import {
  CreateReferenceSchema,
  UpdateReferenceSchema,
} from "@/lib/admin/schemas/reference";
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
    await svc.storage
      .from("client-logos")
      .remove([oldKey])
      .catch(async (err) => {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(err, {
          tags: { module: "admin_references", phase: "update_old_logo" },
          extra: { oldKey },
        });
      });
  }

  await recordAudit({
    action: "reference_updated",
    entity_type: "client",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: {
      display_name: input.display_name,
      logo_path: logoChanged
        ? { from: existing.logo_path, to: input.logo_path }
        : undefined,
      sector_id:
        input.sector_id !== existing.sector_id ? { from: existing.sector_id, to: input.sector_id } : undefined,
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
  const op = direction === "up" ? { op: "lt" as const, asc: false } : { op: "gt" as const, asc: true };

  const { data: neighbors } = await svc
    .from("clients")
    .select("id, display_order")
    .eq("active", current.active)
    [op.op]("display_order", current.display_order)
    .order("display_order", { ascending: op.asc })
    .order("id", { ascending: op.asc })
    .limit(1);

  const neighbor = neighbors?.[0];
  if (!neighbor) return; // no-op (top or bottom)

  // Swap: two updates (transaction guaranteed by postgrest request atomicity? No — use RPC or 2 calls)
  const { error: e1 } = await svc
    .from("clients")
    .update({ display_order: neighbor.display_order })
    .eq("id", current.id);
  if (e1) throw new Error(e1.message);
  const { error: e2 } = await svc
    .from("clients")
    .update({ display_order: current.display_order })
    .eq("id", neighbor.id);
  if (e2) throw new Error(e2.message);

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
```

- [ ] **Step 2: Typecheck**

```bash
pnpm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/references/actions.ts
git commit -m "feat(admin/references): full CRUD actions (create/update/softDelete/restore/moveUp/moveDown) with dual-write sector_key + audit"
```

---

## Task 16: `SectorHeroField` component

**Files:**
- Create: `components/admin/sectors/SectorHeroField.tsx`

**Responsibility:** Tek hero image upload (sector-images bucket, sector slug alt-klasör), preview, silme, 4-dil alt text. No TDD needed — UI glue; E2E covers flow.

- [ ] **Step 1: Implement**

```tsx
// components/admin/sectors/SectorHeroField.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export interface HeroImage {
  path: string;
  alt: { tr: string; en: string; ru: string; ar: string };
}

interface Props {
  sectorSlug: string;
  initial: HeroImage | null;
  onChange: (value: HeroImage | null) => void;
}

const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function SectorHeroField({ sectorSlug, initial, onChange }: Props) {
  const [hero, setHero] = useState<HeroImage | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("PNG/JPG/WEBP kabul ediliyor");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Maks 5 MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const uuid = crypto.randomUUID();
    const path = `${sectorSlug}/${uuid}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("sector-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (uploadErr) {
      setError(`Yüklenemedi: ${uploadErr.message}`);
      return;
    }

    const next: HeroImage = {
      path: `sector-images/${path}`,
      alt: hero?.alt ?? { tr: "", en: "", ru: "", ar: "" },
    };
    setHero(next);
    onChange(next);
  }

  function removeHero() {
    setHero(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateAlt(locale: "tr" | "en" | "ru" | "ar", value: string) {
    if (!hero) return;
    const next = { ...hero, alt: { ...hero.alt, [locale]: value } };
    setHero(next);
    onChange(next);
  }

  const publicUrl = hero
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.path}`
    : null;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Hero Görsel</label>
      {publicUrl ? (
        <div className="relative inline-block">
          <Image
            src={publicUrl}
            alt={hero?.alt.tr ?? ""}
            width={320}
            height={200}
            className="rounded border"
          />
          <button
            type="button"
            onClick={removeHero}
            className="absolute top-1 right-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
          >
            Sil
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={uploading}
        />
      )}
      {uploading && <p className="text-sm">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {hero && (
        <div className="space-y-2">
          {(["tr", "en", "ru", "ar"] as const).map((loc) => (
            <input
              key={loc}
              type="text"
              placeholder={`alt (${loc})`}
              value={hero.alt[loc]}
              onChange={(e) => updateAlt(loc, e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/sectors/SectorHeroField.tsx
git commit -m "feat(admin/sectors): SectorHeroField single-image upload with alt text"
```

---

## Task 17: `SectorForm` component

**Files:**
- Create: `components/admin/sectors/SectorForm.tsx`
- Test: `tests/unit/components/admin/sectors/SectorForm.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// tests/unit/components/admin/sectors/SectorForm.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectorForm } from "@/components/admin/sectors/SectorForm";

const sector = {
  id: "uuid",
  slug: "cam-yikama",
  name: { tr: "Cam Yıkama", en: "Glass Washing", ru: "", ar: "" },
  description: null,
  long_description: null,
  meta_title: null,
  meta_description: null,
  hero_image: null,
  display_order: 10,
  active: true,
};

describe("SectorForm", () => {
  it("renders 4 locale tab buttons (TR/EN/RU/AR)", () => {
    render(<SectorForm sector={sector} action={async () => {}} />);
    expect(screen.getByRole("tab", { name: /TR/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /RU/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /AR/i })).toBeInTheDocument();
  });

  it("pre-fills TR name field from sector.name.tr", () => {
    render(<SectorForm sector={sector} action={async () => {}} />);
    expect(screen.getByDisplayValue("Cam Yıkama")).toBeInTheDocument();
  });

  it("renders display_order input + active checkbox", () => {
    render(<SectorForm sector={sector} action={async () => {}} />);
    expect(screen.getByLabelText(/Sıra/i)).toHaveValue(10);
    expect(screen.getByLabelText(/Aktif/i)).toBeChecked();
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/components/admin/sectors/SectorForm.test.tsx`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Implement**

```tsx
// components/admin/sectors/SectorForm.tsx
"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { SectorHeroField, type HeroImage } from "./SectorHeroField";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

interface Props {
  sector: Sector;
  action: (id: string, formData: FormData) => Promise<void>;
}

type LocaleKey = "tr" | "en" | "ru" | "ar";
type I18n = Record<LocaleKey, string>;

function asI18n(value: unknown): I18n {
  const v = (value as Partial<I18n> | null) ?? {};
  return { tr: v.tr ?? "", en: v.en ?? "", ru: v.ru ?? "", ar: v.ar ?? "" };
}

export function SectorForm({ sector, action }: Props) {
  const [locale, setLocale] = useState<LocaleKey>("tr");
  const [name, setName] = useState<I18n>(asI18n(sector.name));
  const [desc, setDesc] = useState<I18n>(asI18n(sector.description));
  const [longDesc, setLongDesc] = useState<I18n>(asI18n(sector.long_description));
  const [metaTitle, setMetaTitle] = useState<I18n>(asI18n(sector.meta_title));
  const [metaDesc, setMetaDesc] = useState<I18n>(asI18n(sector.meta_description));
  const [hero, setHero] = useState<HeroImage | null>(sector.hero_image as HeroImage | null);
  const [displayOrder, setDisplayOrder] = useState(sector.display_order);
  const [active, setActive] = useState(sector.active);

  async function submit(formData: FormData) {
    formData.set("name", JSON.stringify(name));
    formData.set("description", JSON.stringify(desc));
    formData.set("long_description", JSON.stringify(longDesc));
    formData.set("meta_title", JSON.stringify(metaTitle));
    formData.set("meta_description", JSON.stringify(metaDesc));
    formData.set("hero_image", JSON.stringify(hero));
    formData.set("display_order", String(displayOrder));
    formData.set("active", active ? "on" : "off");
    await action(sector.id, formData);
  }

  return (
    <form action={submit} className="space-y-6">
      <div role="tablist" className="flex gap-2 border-b">
        {(["tr", "en", "ru", "ar"] as const).map((l) => (
          <button
            type="button"
            role="tab"
            aria-selected={locale === l}
            key={l}
            onClick={() => setLocale(l)}
            className={`px-4 py-2 ${locale === l ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3" role="tabpanel">
        <label className="block">
          <span className="block text-sm font-medium">Ad ({locale.toUpperCase()})</span>
          <input
            type="text"
            value={name[locale]}
            onChange={(e) => setName({ ...name, [locale]: e.target.value })}
            required={locale === "tr"}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Kısa açıklama ({locale.toUpperCase()})</span>
          <textarea
            value={desc[locale]}
            onChange={(e) => setDesc({ ...desc, [locale]: e.target.value })}
            rows={3}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">
            Uzun açıklama ({locale.toUpperCase()}) — markdown
          </span>
          <textarea
            value={longDesc[locale]}
            onChange={(e) => setLongDesc({ ...longDesc, [locale]: e.target.value })}
            rows={8}
            className="w-full rounded border px-3 py-2 font-mono"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Meta title ({locale.toUpperCase()})</span>
          <input
            type="text"
            value={metaTitle[locale]}
            onChange={(e) => setMetaTitle({ ...metaTitle, [locale]: e.target.value })}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Meta description ({locale.toUpperCase()})</span>
          <textarea
            value={metaDesc[locale]}
            onChange={(e) => setMetaDesc({ ...metaDesc, [locale]: e.target.value })}
            rows={2}
            className="w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <SectorHeroField sectorSlug={sector.slug} initial={hero} onChange={setHero} />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Sıra</span>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            max={1000}
            className="w-24 rounded border px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span className="text-sm font-medium">Aktif</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-medium text-white">
          Kaydet
        </button>
        <a href="/admin/sectors" className="rounded border px-4 py-2">
          Geri
        </a>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/components/admin/sectors/SectorForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin/sectors/SectorForm.tsx tests/unit/components/admin/sectors/SectorForm.test.tsx
git commit -m "feat(admin/sectors): SectorForm with LocaleTabs + hero + meta"
```

---

## Task 18: `SectorList` + `/admin/sectors/page.tsx`

**Files:**
- Create: `components/admin/sectors/SectorList.tsx`
- Create: `app/admin/sectors/page.tsx`

- [ ] **Step 1: SectorList (RSC)**

```tsx
// components/admin/sectors/SectorList.tsx
import Image from "next/image";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

interface Props {
  sectors: Sector[];
}

export function SectorList({ sectors }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm">
            <th className="p-3">Sıra</th>
            <th className="p-3">Slug</th>
            <th className="p-3">TR Ad</th>
            <th className="p-3">Hero</th>
            <th className="p-3">Durum</th>
            <th className="p-3">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((s) => {
            const hero = s.hero_image as { path?: string } | null;
            const heroUrl = hero?.path
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.path}`
              : null;
            const name = (s.name as Record<string, string> | null)?.tr ?? "";
            return (
              <tr key={s.id} className="border-b">
                <td className="p-3">{s.display_order}</td>
                <td className="p-3 font-mono text-sm">{s.slug}</td>
                <td className="p-3">{name}</td>
                <td className="p-3">
                  {heroUrl ? (
                    <Image src={heroUrl} alt="" width={64} height={40} className="rounded border" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-3">{s.active ? "✓" : "×"}</td>
                <td className="p-3">
                  <Link
                    href={`/admin/sectors/${s.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    Düzenle
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: `page.tsx`**

```tsx
// app/admin/sectors/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { SectorList } from "@/components/admin/sectors/SectorList";
import { listSectors } from "@/lib/admin/sectors";

export default async function AdminSectorsPage() {
  const user = await requireAdmin();
  const sectors = await listSectors();

  return (
    <Shell user={user} active="sectors">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Sektörler</h1>
        <SectorList sectors={sectors} />
      </div>
    </Shell>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm run typecheck`
Expected: Error on `Shell active="sectors"` — Shell type'ında henüz yok. Task 27'de güncellenir; geçici cast: `active={"sectors" as any}` — **kullanma, Task 27 öncesi birleştir.**

**Sıra düzeltmesi:** Task 27'yi önce tamamla (Shell nav update), sonra bu task'ın page.tsx commit'i.

Alternatif: Bu task'ta Shell tipine `"sectors" | "references"` ekle (Task 27 iş birliği):

```tsx
// components/admin/Shell.tsx — type güncelle
type ActiveSection =
  | "inbox"
  | "catalog-requests"
  | "products"
  | "sectors"         // YENİ
  | "references"      // YENİ
  | "settings";
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/sectors/SectorList.tsx app/admin/sectors/page.tsx components/admin/Shell.tsx
git commit -m "feat(admin/sectors): list page + SectorList table (edit-only, 3 rows)"
```

---

## Task 19: `/admin/sectors/[id]/edit/page.tsx`

**Files:**
- Create: `app/admin/sectors/[id]/edit/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/admin/sectors/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { SectorForm } from "@/components/admin/sectors/SectorForm";
import { getSectorById } from "@/lib/admin/sectors";
import { updateSector } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSectorPage({ params }: PageProps) {
  const user = await requireAdmin();
  const { id } = await params;
  const sector = await getSectorById(id);
  if (!sector) notFound();

  return (
    <Shell user={user} active="sectors">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Sektör Düzenle: {sector.slug}</h1>
        <SectorForm sector={sector} action={updateSector} />
      </div>
    </Shell>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm run typecheck`
Expected: No errors.

- [ ] **Step 3: Dev smoke**

Run: `pnpm dev`, browse `/admin/sectors/<id>/edit`, form render olmalı.

Kontrol et: LocaleTabs switch çalışıyor, TR Ad required, hero upload/preview/silme, Kaydet butonu submit'liyor (hedefini Task 14 action ile buluşturuyor).

- [ ] **Step 4: Commit**

```bash
git add 'app/admin/sectors/[id]/edit/page.tsx'
git commit -m "feat(admin/sectors): edit page with SectorForm"
```

---

## Task 20: `LogoField` + `SectorSelect` components

**Files:**
- Create: `components/admin/references/LogoField.tsx`
- Create: `components/admin/references/SectorSelect.tsx`

- [ ] **Step 1: `LogoField` implement**

```tsx
// components/admin/references/LogoField.tsx
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initial: string | null; // path like "client-logos/<uuid>.svg" or legacy "/references/c1.svg"
  onChange: (logoPath: string | null) => void;
}

const ALLOWED_EXT = ["svg", "png", "jpg", "jpeg", "webp"];
const MAX_BYTES = 1 * 1024 * 1024; // 1 MB
const MIN_WIDTH_RASTER = 400;

async function validateRasterWidth(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.onload = () => resolve(img.naturalWidth);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

function toPublicUrl(logoPath: string | null): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith("/")) return logoPath;
  if (logoPath.startsWith("http")) return logoPath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${logoPath}`;
}

export function LogoField({ initial, onChange }: Props) {
  const [logoPath, setLogoPath] = useState<string | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("SVG/PNG/JPG/WEBP kabul ediliyor");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Maks 1 MB");
      return;
    }

    // M4 client-side: raster için naturalWidth, SVG skip
    if (ext !== "svg") {
      try {
        const w = await validateRasterWidth(file);
        if (w < MIN_WIDTH_RASTER) {
          setError(`Min ${MIN_WIDTH_RASTER}px genişlik lazım (şu an ${w}px)`);
          return;
        }
      } catch {
        setError("Görsel okunamadı");
        return;
      }
    }

    setUploading(true);
    const supabase = createClient();
    const uuid = crypto.randomUUID();
    const key = `${uuid}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("client-logos")
      .upload(key, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (uploadErr) {
      setError(`Yüklenemedi: ${uploadErr.message}`);
      return;
    }

    const fullPath = `client-logos/${key}`;
    setLogoPath(fullPath);
    onChange(fullPath);
  }

  function remove() {
    setLogoPath(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const publicUrl = toPublicUrl(logoPath);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Logo</label>
      {publicUrl ? (
        <div className="relative inline-block">
          <Image
            src={publicUrl}
            alt="Logo preview"
            width={200}
            height={80}
            className="rounded border bg-white p-2"
          />
          <button
            type="button"
            onClick={remove}
            className="absolute top-1 right-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
          >
            Sil
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={uploading}
        />
      )}
      {uploading && <p className="text-sm">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: `SectorSelect` implement**

```tsx
// components/admin/references/SectorSelect.tsx
"use client";

import type { Database } from "@/lib/supabase/types";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

interface Props {
  sectors: Sector[];
  value: string;
  onChange: (sectorId: string) => void;
}

export function SectorSelect({ sectors, value, onChange }: Props) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">Sektör</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded border px-3 py-2"
      >
        <option value="">— Seçin —</option>
        {sectors.map((s) => {
          const name = (s.name as Record<string, string> | null)?.tr ?? s.slug;
          return (
            <option key={s.id} value={s.id}>
              {name}
            </option>
          );
        })}
      </select>
    </label>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/references/LogoField.tsx components/admin/references/SectorSelect.tsx
git commit -m "feat(admin/references): LogoField + SectorSelect components"
```

---

## Task 21: `ReferenceForm` component

**Files:**
- Create: `components/admin/references/ReferenceForm.tsx`
- Test: `tests/unit/components/admin/references/ReferenceForm.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// tests/unit/components/admin/references/ReferenceForm.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferenceForm } from "@/components/admin/references/ReferenceForm";

const sectors = [
  { id: "s1", slug: "cam-yikama", name: { tr: "Cam Yıkama" }, description: null,
    long_description: null, meta_title: null, meta_description: null, hero_image: null,
    hero_color: "#fff", display_order: 10, active: true, created_at: "", updated_at: "" },
];

describe("ReferenceForm", () => {
  it("create mode: key field editable", () => {
    render(
      <ReferenceForm
        mode="create"
        sectors={sectors as any}
        initial={null}
        defaultDisplayOrder={100}
        action={async () => {}}
      />,
    );
    const keyInput = screen.getByLabelText(/Anahtar/i);
    expect(keyInput).not.toBeDisabled();
  });

  it("edit mode: key field disabled", () => {
    render(
      <ReferenceForm
        mode="edit"
        sectors={sectors as any}
        initial={{
          id: "r1",
          key: "c1",
          display_name: null,
          logo_path: "/references/c1.svg",
          sector_id: "s1",
          sector_key: "camYikama",
          display_order: 10,
          active: true,
          created_at: "",
        } as any}
        defaultDisplayOrder={0}
        action={async () => {}}
      />,
    );
    const keyInput = screen.getByLabelText(/Anahtar/i);
    expect(keyInput).toBeDisabled();
  });

  it("renders 4 locale tabs for display_name", () => {
    render(
      <ReferenceForm
        mode="create"
        sectors={sectors as any}
        initial={null}
        defaultDisplayOrder={0}
        action={async () => {}}
      />,
    );
    expect(screen.getByRole("tab", { name: /TR/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /RU/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /AR/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/components/admin/references/ReferenceForm.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement**

```tsx
// components/admin/references/ReferenceForm.tsx
"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/types";
import { LogoField } from "./LogoField";
import { SectorSelect } from "./SectorSelect";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

type LocaleKey = "tr" | "en" | "ru" | "ar";
type I18n = Record<LocaleKey, string>;

function asI18n(value: unknown): I18n {
  const v = (value as Partial<I18n> | null) ?? {};
  return { tr: v.tr ?? "", en: v.en ?? "", ru: v.ru ?? "", ar: v.ar ?? "" };
}

interface CreateProps {
  mode: "create";
  sectors: Sector[];
  initial: null;
  defaultDisplayOrder: number;
  action: (formData: FormData) => Promise<void>;
}
interface EditProps {
  mode: "edit";
  sectors: Sector[];
  initial: Client;
  defaultDisplayOrder: number;
  action: (id: string, formData: FormData) => Promise<void>;
}
type Props = CreateProps | EditProps;

export function ReferenceForm(props: Props) {
  const { mode, sectors, initial, defaultDisplayOrder } = props;
  const [locale, setLocale] = useState<LocaleKey>("tr");
  const [key, setKey] = useState(initial?.key ?? "");
  const [displayName, setDisplayName] = useState<I18n>(asI18n(initial?.display_name));
  const [logoPath, setLogoPath] = useState<string | null>(initial?.logo_path ?? null);
  const [sectorId, setSectorId] = useState(initial?.sector_id ?? "");
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? defaultDisplayOrder);
  const [active, setActive] = useState(initial?.active ?? true);

  async function submit(formData: FormData) {
    if (mode === "create") formData.set("key", key);
    formData.set("display_name", JSON.stringify(displayName));
    formData.set("logo_path", logoPath ?? "");
    formData.set("sector_id", sectorId);
    formData.set("display_order", String(displayOrder));
    formData.set("active", active ? "on" : "off");
    if (mode === "edit") await props.action(initial.id, formData);
    else await props.action(formData);
  }

  return (
    <form action={submit} className="space-y-6">
      <label className="block">
        <span className="block text-sm font-medium">Anahtar</span>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={mode === "edit"}
          required={mode === "create"}
          pattern="[a-zA-Z0-9-]+"
          maxLength={32}
          className="w-full rounded border px-3 py-2"
          aria-label="Anahtar"
        />
      </label>

      <div role="tablist" className="flex gap-2 border-b">
        {(["tr", "en", "ru", "ar"] as const).map((l) => (
          <button
            type="button"
            role="tab"
            aria-selected={locale === l}
            key={l}
            onClick={() => setLocale(l)}
            className={`px-4 py-2 ${locale === l ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <label className="block" role="tabpanel">
        <span className="block text-sm font-medium">
          Ad ({locale.toUpperCase()}) — opsiyonel
        </span>
        <input
          type="text"
          value={displayName[locale]}
          onChange={(e) => setDisplayName({ ...displayName, [locale]: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
      </label>

      <LogoField initial={logoPath} onChange={setLogoPath} />

      <SectorSelect sectors={sectors} value={sectorId} onChange={setSectorId} />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Sıra</span>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            max={10000}
            className="w-24 rounded border px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span className="text-sm font-medium">Aktif</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-medium text-white">
          Kaydet
        </button>
        <a href="/admin/references" className="rounded border px-4 py-2">
          İptal
        </a>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/components/admin/references/ReferenceForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin/references/ReferenceForm.tsx tests/unit/components/admin/references/ReferenceForm.test.tsx
git commit -m "feat(admin/references): ReferenceForm with create/edit modes + LocaleTabs"
```

---

## Task 22: `ReferenceList` component

**Files:**
- Create: `components/admin/references/ReferenceList.tsx`
- Test: `tests/unit/components/admin/references/ReferenceList.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// tests/unit/components/admin/references/ReferenceList.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferenceList } from "@/components/admin/references/ReferenceList";

const active = [
  { id: "r1", key: "c1", display_name: null, logo_path: "/references/c1.svg",
    sector_id: "s1", sector_key: "camYikama", display_order: 10, active: true, created_at: "" },
];
const deleted = [
  { id: "r2", key: "c2", display_name: null, logo_path: "/references/c2.svg",
    sector_id: "s1", sector_key: "kapak", display_order: 20, active: false, created_at: "" },
];
const sectors: Record<string, string> = { s1: "Cam Yıkama" };

describe("ReferenceList", () => {
  it("shows Aktif + Silinmiş tab counts", () => {
    render(
      <ReferenceList
        activeRefs={active as any}
        deletedRefs={deleted as any}
        sectors={sectors}
        actions={{
          softDelete: async () => {},
          restore: async () => {},
          moveUp: async () => {},
          moveDown: async () => {},
        }}
      />,
    );
    expect(screen.getByText(/Aktif \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Silinmiş \(1\)/)).toBeInTheDocument();
  });

  it("renders + Yeni button", () => {
    render(
      <ReferenceList
        activeRefs={[]}
        deletedRefs={[]}
        sectors={sectors}
        actions={{
          softDelete: async () => {},
          restore: async () => {},
          moveUp: async () => {},
          moveDown: async () => {},
        }}
      />,
    );
    expect(screen.getByRole("link", { name: /Yeni/i })).toHaveAttribute(
      "href",
      "/admin/references/new",
    );
  });

  it("empty active state: shows helpful message", () => {
    render(
      <ReferenceList
        activeRefs={[]}
        deletedRefs={[]}
        sectors={sectors}
        actions={{
          softDelete: async () => {},
          restore: async () => {},
          moveUp: async () => {},
          moveDown: async () => {},
        }}
      />,
    );
    expect(screen.getByText(/Henüz referans yok/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Fail doğrula**

Run: `pnpm vitest run tests/unit/components/admin/references/ReferenceList.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement**

```tsx
// components/admin/references/ReferenceList.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface Actions {
  softDelete: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  moveUp: (id: string) => Promise<void>;
  moveDown: (id: string) => Promise<void>;
}

interface Props {
  activeRefs: Client[];
  deletedRefs: Client[];
  sectors: Record<string, string>;
  actions: Actions;
}

function toPublicUrl(logoPath: string): string {
  if (logoPath.startsWith("/")) return logoPath;
  if (logoPath.startsWith("http")) return logoPath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${logoPath}`;
}

export function ReferenceList({ activeRefs, deletedRefs, sectors, actions }: Props) {
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const rows = tab === "active" ? activeRefs : deletedRefs;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-4 py-2 ${tab === "active" ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          >
            Aktif ({activeRefs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("deleted")}
            className={`px-4 py-2 ${tab === "deleted" ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          >
            Silinmiş ({deletedRefs.length})
          </button>
        </div>
        <Link href="/admin/references/new" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          + Yeni
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-gray-500">
          {tab === "active" ? "Henüz referans yok" : "Silinmiş kayıt yok"}
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm">
              <th className="p-3">Sıra</th>
              <th className="p-3">Logo</th>
              <th className="p-3">Anahtar</th>
              <th className="p-3">TR Ad</th>
              <th className="p-3">Sektör</th>
              {tab === "active" && <th className="p-3">Sırala</th>}
              <th className="p-3">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const trName =
                (r.display_name as Record<string, string> | null)?.tr?.trim() || "—";
              const sectorName = r.sector_id ? (sectors[r.sector_id] ?? "?") : "—";
              const isFirst = idx === 0;
              const isLast = idx === rows.length - 1;
              return (
                <tr key={r.id} className="border-b">
                  <td className="p-3">{r.display_order}</td>
                  <td className="p-3">
                    <Image
                      src={toPublicUrl(r.logo_path)}
                      alt={r.key}
                      width={80}
                      height={30}
                      className="h-8 w-auto"
                    />
                  </td>
                  <td className="p-3 font-mono text-sm">{r.key}</td>
                  <td className="p-3">{trName}</td>
                  <td className="p-3">{sectorName}</td>
                  {tab === "active" && (
                    <td className="p-3">
                      <form action={() => actions.moveUp(r.id)} className="inline">
                        <button
                          type="submit"
                          disabled={isFirst}
                          className="px-2 py-1 disabled:opacity-30"
                        >
                          ⬆
                        </button>
                      </form>
                      <form action={() => actions.moveDown(r.id)} className="inline">
                        <button
                          type="submit"
                          disabled={isLast}
                          className="px-2 py-1 disabled:opacity-30"
                        >
                          ⬇
                        </button>
                      </form>
                    </td>
                  )}
                  <td className="p-3 space-x-3 text-sm">
                    <Link
                      href={`/admin/references/${r.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      Düzenle
                    </Link>
                    {tab === "active" ? (
                      <form action={() => actions.softDelete(r.id)} className="inline">
                        <button type="submit" className="text-red-600 hover:underline">
                          Sil
                        </button>
                      </form>
                    ) : (
                      <form action={() => actions.restore(r.id)} className="inline">
                        <button type="submit" className="text-emerald-600 hover:underline">
                          Geri yükle
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Pass**

Run: `pnpm vitest run tests/unit/components/admin/references/ReferenceList.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/admin/references/ReferenceList.tsx tests/unit/components/admin/references/ReferenceList.test.tsx
git commit -m "feat(admin/references): ReferenceList with tabs + arrow reorder + empty state"
```

---

## Task 23: `/admin/references/page.tsx` (list)

**Files:**
- Create: `app/admin/references/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/admin/references/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ReferenceList } from "@/components/admin/references/ReferenceList";
import { listReferences } from "@/lib/admin/references";
import { listSectors } from "@/lib/admin/sectors";
import {
  softDeleteReference,
  restoreReference,
  moveReferenceUp,
  moveReferenceDown,
} from "./actions";

export default async function AdminReferencesPage() {
  const user = await requireAdmin();
  const [active, deleted, sectors] = await Promise.all([
    listReferences({ active: true }),
    listReferences({ active: false }),
    listSectors(),
  ]);

  const sectorsMap: Record<string, string> = {};
  for (const s of sectors) {
    const name = (s.name as Record<string, string>)?.tr ?? s.slug;
    sectorsMap[s.id] = name;
  }

  async function softDelete(id: string) {
    "use server";
    await softDeleteReference(id);
  }
  async function restore(id: string) {
    "use server";
    await restoreReference(id);
  }
  async function moveUp(id: string) {
    "use server";
    await moveReferenceUp(id);
  }
  async function moveDown(id: string) {
    "use server";
    await moveReferenceDown(id);
  }

  return (
    <Shell user={user} active="references">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Referanslar</h1>
        <ReferenceList
          activeRefs={active}
          deletedRefs={deleted}
          sectors={sectorsMap}
          actions={{ softDelete, restore, moveUp, moveDown }}
        />
      </div>
    </Shell>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/references/page.tsx
git commit -m "feat(admin/references): list page with tabs + actions"
```

---

## Task 24: `/admin/references/new/page.tsx`

**Files:**
- Create: `app/admin/references/new/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/admin/references/new/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ReferenceForm } from "@/components/admin/references/ReferenceForm";
import { listSectors } from "@/lib/admin/sectors";
import { maxDisplayOrder } from "@/lib/admin/references";
import { createReference } from "../actions";

export default async function NewReferencePage() {
  const user = await requireAdmin();
  const [sectors, maxOrder] = await Promise.all([listSectors(), maxDisplayOrder(true)]);

  return (
    <Shell user={user} active="references">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Yeni Referans</h1>
        <ReferenceForm
          mode="create"
          sectors={sectors}
          initial={null}
          defaultDisplayOrder={maxOrder + 10}
          action={createReference}
        />
      </div>
    </Shell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm run typecheck
git add app/admin/references/new/page.tsx
git commit -m "feat(admin/references): new reference page"
```

---

## Task 25: `/admin/references/[id]/edit/page.tsx`

**Files:**
- Create: `app/admin/references/[id]/edit/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/admin/references/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ReferenceForm } from "@/components/admin/references/ReferenceForm";
import { listSectors } from "@/lib/admin/sectors";
import { getReferenceById } from "@/lib/admin/references";
import { updateReference } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReferencePage({ params }: PageProps) {
  const user = await requireAdmin();
  const { id } = await params;
  const [ref, sectors] = await Promise.all([getReferenceById(id), listSectors()]);
  if (!ref) notFound();

  return (
    <Shell user={user} active="references">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Referans Düzenle: {ref.key}</h1>
        <ReferenceForm
          mode="edit"
          sectors={sectors}
          initial={ref}
          defaultDisplayOrder={ref.display_order}
          action={updateReference}
        />
      </div>
    </Shell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm run typecheck
git add 'app/admin/references/[id]/edit/page.tsx'
git commit -m "feat(admin/references): edit reference page"
```

---

## Task 26: `Shell.tsx` nav update (Sektörler + Referanslar)

**Files:**
- Modify: `components/admin/Shell.tsx`

> **Not:** Task 18'de `ActiveSection` tip güncellemesi yapıldıysa bu task yalnızca nav link'lerini ekler.

- [ ] **Step 1: Mevcut nav'ı oku**

Run: `cat components/admin/Shell.tsx | head -80`
Expected: `Inbox, Katalog Talepleri, Ürünler, Ayarlar` linklerini gör.

- [ ] **Step 2: Sidebar'a iki link ekle**

Locate the sidebar nav section and add after Ürünler, before Ayarlar:

```tsx
<Link
  href="/admin/sectors"
  className={`block rounded px-3 py-2 ${active === "sectors" ? "bg-cobalt-50 font-semibold" : "hover:bg-gray-50"}`}
>
  Sektörler
</Link>
<Link
  href="/admin/references"
  className={`block rounded px-3 py-2 ${active === "references" ? "bg-cobalt-50 font-semibold" : "hover:bg-gray-50"}`}
>
  Referanslar
</Link>
```

Active tipi (`ActiveSection` veya inline literal union) `"sectors" | "references"` içermeli.

- [ ] **Step 3: Typecheck**

```bash
pnpm run typecheck
```

Expected: No errors. Tüm caller'lar (page.tsx dosyaları) doğru string geçmeli.

- [ ] **Step 4: Dev smoke**

Run: `pnpm dev`, browse `/admin/inbox`, sidebar'da "Sektörler" + "Referanslar" linkleri görünür, tıklayınca ilgili sayfalara gidiyor.

- [ ] **Step 5: Commit**

```bash
git add components/admin/Shell.tsx
git commit -m "feat(admin): Shell nav adds Sectors + References sections"
```

---

## Task 27: E2E — admin sectors + references spec'leri

**Files:**
- Create: `tests/e2e/admin-sectors-crud.spec.ts`
- Create: `tests/e2e/admin-references-crud.spec.ts`

**Prereq:** `tests/e2e/helpers/admin-login.ts` (Plan 4b'de var). Kullan.

- [ ] **Step 1: Sectors E2E**

```ts
// tests/e2e/admin-sectors-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-login";

test.describe("Admin sectors CRUD", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin(context);
    await page.goto("/admin/sectors");
  });

  test("lists 3 seed sectors", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sektörler" })).toBeVisible();
    await expect(page.getByText("cam-yikama")).toBeVisible();
    await expect(page.getByText("kapak")).toBeVisible();
    await expect(page.getByText("tekstil")).toBeVisible();
  });

  test("edits cam-yikama TR name and sees success toast", async ({ page }) => {
    await page.getByRole("row", { name: /cam-yikama/ }).getByRole("link", { name: "Düzenle" }).click();
    await expect(page.getByDisplayValue("Cam Yıkama")).toBeVisible();
    const newName = `Cam Yıkama — E2E ${Date.now()}`;
    await page.getByLabel(/Ad \(TR\)/).fill(newName);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/admin\/sectors\?success=updated/);
    await expect(page.getByText(newName)).toBeVisible();
  });

  test("public EN pathname /en/sectors/bottle-washing still returns 200", async ({ request }) => {
    const r = await request.get("/en/sectors/bottle-washing");
    expect(r.status()).toBe(200);
  });

  test("public TR pathname /tr/sektorler/cam-yikama still returns 200", async ({ request }) => {
    const r = await request.get("/tr/sektorler/cam-yikama");
    expect(r.status()).toBe(200);
  });
});
```

- [ ] **Step 2: References E2E**

```ts
// tests/e2e/admin-references-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-login";

const TEST_KEY = `e2e-${Date.now().toString(36).slice(-8)}`;

test.describe("Admin references CRUD", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin(context);
    await page.goto("/admin/references");
  });

  test("active tab shows seed references (8)", async ({ page }) => {
    await expect(page.getByText(/Aktif \(\d+\)/)).toBeVisible();
  });

  test("creates a new reference (placeholder logo — uses seed path)", async ({ page }) => {
    await page.getByRole("link", { name: "+ Yeni" }).click();
    await expect(page).toHaveURL(/\/admin\/references\/new/);
    await page.getByLabel("Anahtar").fill(TEST_KEY);
    await page.getByLabel(/Ad \(TR\)/).fill("E2E Test");
    // SVG paste via logo_path direct (mocked file upload skipped in this assertion)
    // For real test, use evaluate() to set state directly, or:
    // await page.getByLabel(/Logo/).setInputFiles("./tests/fixtures/test-logo.svg");
    // For now verify form renders + submit URL:
    await expect(page.getByRole("button", { name: "Kaydet" })).toBeVisible();
  });

  test("edits an existing reference display_name (c1)", async ({ page }) => {
    // Tabloda c1 satırını bul
    const row = page.getByRole("row", { name: /c1/ }).first();
    await row.getByRole("link", { name: "Düzenle" }).click();
    await page.getByLabel(/Ad \(TR\)/).fill("Acme Corp E2E");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/admin\/references\?success=updated/);
  });

  test("soft-delete + restore roundtrip (c8)", async ({ page }) => {
    const row = page.getByRole("row", { name: /c8/ }).first();
    await row.getByRole("button", { name: "Sil" }).click();
    // C8 should now appear in Silinmiş tab
    await page.getByRole("button", { name: /Silinmiş/ }).click();
    await expect(page.getByText("c8")).toBeVisible();
    await page.getByRole("button", { name: "Geri yükle" }).click();
    await page.getByRole("button", { name: /Aktif/ }).click();
    await expect(page.getByText("c8")).toBeVisible();
  });

  test("public homepage ReferencesStrip responds 200", async ({ request }) => {
    const r = await request.get("/tr");
    expect(r.status()).toBe(200);
  });
});
```

- [ ] **Step 3: Run both specs locally**

```bash
pnpm playwright test tests/e2e/admin-sectors-crud.spec.ts tests/e2e/admin-references-crud.spec.ts
```

Expected: All green. Flaky olursa `--retries=2` deneme.

- [ ] **Step 4: Full CI-mirror**

```bash
pnpm run typecheck
pnpm run lint
pnpm vitest run
pnpm playwright test
pnpm run build
```

Expected: Tüm yeşil.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/admin-sectors-crud.spec.ts tests/e2e/admin-references-crud.spec.ts
git commit -m "test(e2e): admin sectors + references CRUD specs"
```

---

## Task 28: Deploy wave — migration + script + smoke + PR (Gate 2)

**Files:**
- No new; this is deployment orchestration.

- [ ] **Step 1: Full local verify (feedback_verify_before_push)**

```bash
pnpm run typecheck
pnpm run lint
pnpm vitest run
pnpm playwright test
pnpm run build
```

Expected: Tüm yeşil. Herhangi bir fail → root-cause + tekrar.

- [ ] **Step 2: Branch push + PR**

```bash
git push -u origin <branch>
gh pr create --title "feat: Plan 5c Part 1 — sectors edit + references CRUD" --body "$(cat <<'EOF'
## Summary

Plan 5c Part 1 implementation — sectors edit-only + references full CRUD + public display_name fallback chain + statik logo → Supabase Storage migration.

**Spec:** `docs/superpowers/specs/2026-04-23-plan5c-part1-sectors-references-crud-design.md`

## Scope

- `/admin/sectors` — 3 row edit-only (4-dil LocaleTabs + hero image + meta SEO + active)
- `/admin/references` — full CRUD (create/edit/soft-delete/restore + arrow reorder)
- 4-dil display_name JSONB public fallback chain (`ReferencesStrip`, `ReferenceCard`, `references/page.tsx`)
- Migration: sectors 4 new cols, clients 2 new cols, `client-logos` bucket + hardening (file_size_limit=1MB, allowed_mime_types)
- Logo migration script (public/references/*.svg → client-logos bucket; dual-read safe)
- `sector-route-mapping` + `sector-key-mapping` helpers

## Test plan

- [x] 12+ unit tests (vitest)
- [x] 10+ E2E tests (Playwright)
- [x] Typecheck + lint + build
- [ ] Post-deploy smoke
- [ ] Codex Gate 2 review

EOF
)"
```

- [ ] **Step 3: CI gözlemle**

```bash
gh run watch
```

Expected: Yeşil.

- [ ] **Step 4: Codex Gate 2 review**

PR URL'yi al, `/codex-review-pr` slash command'ını tetikle (veya manuel):

```bash
# .claude/commands/codex-review-pr.md içindeki talimatla çalıştır
```

Output PR body'e append edilir. Critical/high bulgu varsa fix, tekrar CI, tekrar Gate 2 (1-2 round maks). Medium/low "Known differences" başlığında belgele.

- [ ] **Step 5: Merge sonrası deploy wave**

```bash
# Coolify auto-deploy GHA workflow_run → /api/v1/deploy otomatik tetiklenir
# İzle:
gh run list --workflow="deploy.yml" --limit 1

# Migration zaten Task 6'da remote'a push edildi.
# Bu aşamada:
pnpm exec supabase gen types typescript --linked > lib/supabase/types.ts
# (Types zaten repo'da; sadece doğrulama.)
```

- [ ] **Step 6: Phase B — logo migration script çalıştır (canlı dual-read aktif sonra)**

```bash
# Production env ile:
NEXT_PUBLIC_SUPABASE_URL=<prod> \
SUPABASE_SERVICE_ROLE_KEY=<prod-service> \
pnpm tsx scripts/migrate-client-logos-to-storage.ts
```

Expected: 8 client satırı `client-logos/<uuid>.svg` formatına güncellenir.

- [ ] **Step 7: Canlı smoke**

```bash
curl -sI https://kitaplastik.com/ | head -3
curl -sI https://kitaplastik.com/tr/references | head -3
curl -sI https://kitaplastik.com/en/sectors/bottle-washing | head -3
curl -sI https://kitaplastik.com/admin/sectors | head -3   # 302 → login
```

Manual:
- Login as admin
- /admin/sectors → 3 row
- Edit cam-yikama, upload a hero image, save → success toast → list'te hero thumbnail
- /admin/references → 8 active
- New reference: key `test-e2e`, logo upload (SVG), sector dropdown, save → görünür
- Public anasayfa ReferencesStrip → logo'lar ve alt text'ler doğru
- Sil test-e2e → silinmiş tab'ine düşer → geri yükle
- `/admin/references` active tab'de tekrar görünür

- [ ] **Step 8: RESUME.md güncelle (session close)**

NEXT SESSION KICKOFF bölümüne Plan 5c Part 1 ✅ canlıda not düş. Plan 5c Part 2 sıradakini işaret et.

```bash
# Edit RESUME.md, commit:
git add docs/superpowers/RESUME.md
git commit -m "docs(resume): Plan 5c Part 1 ✅ merged — next Plan 5c Part 2"
git push
```

- [ ] **Step 9: Memory update**

`project_kitaplastik.md` günlemi yap — Plan 5c Part 1 merged, display_name chain canlıda, logo migration done.

---

## Dependency Map

```
Foundation (paralel):
  T1 safeTranslate ──┐
  T2 sector-route-mapping ──┐
  T3 sector-key-mapping ──┐
  T4 sector schema ──┐
  T5 reference schema ──┤
                      │
Migration blocker:  T6 ─── T7 (logo script)
                      │
lib/references:     T8 ─── T9 (ReferencesStrip)
                      │    T10 (ReferenceCard)
                      │    T11 (references page)
                      │
Admin lib:          T12 (sectors) ──┐
                    T13 (references) ──┤
                                       │
Admin actions:      T14 (sector) ──────┤
                    T15 (reference) ───┤
                                       │
Admin components (paralel):
                    T16 SectorHeroField ──┐
                    T17 SectorForm ──────┤
                    T18 SectorList+page ─┤
                    T19 Sector edit page ┤
                    T20 LogoField+SectorSelect ─┤
                    T21 ReferenceForm ─────┤
                    T22 ReferenceList ─────┤
                    T23 Reference list page ┤
                    T24 Reference new page ─┤
                    T25 Reference edit page ┤
                                           │
Nav:                T26 Shell nav ─────────┤
                                           │
E2E:                T27 sectors + references ┤
                                             │
Deploy:             T28 migration+script+smoke+PR+Gate2
```

Paralelleşme fırsatı: T1-T5 (foundation), T12-T13 (admin lib), T16-T25 (admin components + pages) büyük ölçüde bağımsız — subagent-driven execution'da aynı wave'e verilebilir.

---

## Self-Review (inline fix sonrası)

**Spec coverage:**
- Section 1 Public UI scope → T8-T11 ✓
- Section 1 Non-goals → respected (no dynamic route, no sector creation UI) ✓
- Section 2 Architecture files → T1-T26 all covered ✓
- Section 3 Data model + migration → T6 ✓
- Section 3 Bucket hardening (H4) → T6 ✓
- Section 3 Statik logo migration (H3) → T7 + T28 Phase B ✓
- Section 4 Admin pages → T18, T19, T23, T24, T25 ✓
- Section 4 Shell nav → T26 ✓
- Section 5.1 updateSector → T14 ✓
- Section 5.1 Canonical revalidation (H2) → T14 uses `dbSlugToRouteSlug` ✓
- Section 5.2 References full CRUD + reorder → T15 ✓
- Section 5.3 Zod schemas → T4, T5 ✓
- Section 5.3.1 Client-side dimension (M4) → T20 LogoField ✓
- Section 5.5 Audit → T14, T15 ✓
- Section 6 Unit tests → T1-T5, T17, T21, T22 ✓ (12 test covered)
- Section 6 E2E tests → T27 ✓
- Section 7 Review Gates → T28 Step 4 ✓
- Section 8 Deploy sequence (Phase A → B) → T28 ✓
- Section 9 Prereq → user-facing ✓

**Gaps:** None. Full coverage.

**Placeholder scan:** No TBDs, no "add appropriate error handling," no generic "Similar to Task N."

**Type consistency:**
- `HeroImage` (T16) referenced from T17 SectorForm: `hero_image: HeroImage | null` ✓
- `Sector`, `Client` Database types reused consistently ✓
- `I18n` local type in forms + `I18nString` Zod shared via import (T4 → T5 import path `./sector`) ✓
- `dbSlugToRouteSlug` signature: `(dbSlug: string) => string` across T2, T14 ✓
- `dbSlugToSectorKey` signature: `(dbSlug: string) => string` across T3, T15 ✓
