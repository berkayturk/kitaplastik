# Plan 5c Part 1 — /admin/sectors + /admin/references CRUD — Design Spec

**Tarih:** 2026-04-23
**Milestone:** Plan 5c Part 1
**Süre tahmini:** ~5-6 saat (tek PR)
**Önceki plan:** Plan 5d (next-intl v4, `41d778a`) ✅ merged
**Sonraki plan:** Plan 5c Part 2 — public `/sectors/*` + `/references` sayfalarının Supabase'e bağlanması

---

## 1. Amaç & Kapsam

İki eksik admin CRUD modülünü tamamlar:

- **`/admin/sectors`** — 3 sabit sektörün içerik editörü (edit-only, create/delete yok)
- **`/admin/references`** — referans logolarının full CRUD'u (create/edit/soft-delete/restore + reorder)

Public site tarafı bu spec'in kapsamında değil (Plan 5c Part 2). Bu spec sadece **admin tooling + schema genişletme + storage altyapı**.

### Brainstorm kararları (5 soru → 5 karar)

| # | Karar |
|---|---|
| 1 | **Scope A:** Tek spec + tek plan + tek PR — sectors + references birlikte |
| 2 | **References model B:** `clients.display_name jsonb` (4-dil) eklenir |
| 3 | **Sectors model B:** `hero_image jsonb` + `long_description jsonb` + `meta_title jsonb` + `meta_description jsonb` eklenir |
| 4 | **Altyapı B:** Yeni `client-logos` bucket + `clients.sector_id uuid` FK; `sector_key` deprecated (DROP değil — dual-write) |
| 5 | **UX A:** Sectors "edit-only"; references full CRUD |

### Public UI kapsamı (Codex H1 fix — Part 1 minimal public update)

Admin-created reference'lerin public'te görünebilmesi için aşağıdaki dosyalar **bu PR'da** güncellenir (scope'a dahil):

- `components/home/ReferencesStrip.tsx` — `display_name` fallback chain
- `components/references/ReferenceCard.tsx` — aynı
- `app/[locale]/references/page.tsx` — aynı
- `lib/references/types.ts` — `Reference` tipine `displayName: Partial<Record<Locale,string>> | null` ekle
- `lib/references/data.ts` — `display_name` select'e ekle, `mapRow` ile expose et

**Name resolution fallback chain** (public bileşenlerde):

```typescript
const name =
  ref.displayName?.[locale]?.trim() ||      // yeni: DB'den
  safeTranslate(tClients, `${ref.key}.name`) || // legacy: JSON fallback (8 seed ref için)
  ref.key;                                   // son çare
```

`safeTranslate` helper try/catch sarar — yeni admin-created key için missing translation atlamaz, sessizce null döner.

### Non-goals

- Public `/sectors/[slug]` dinamik route — hardcoded 3 klasör kalır (Part 2)
- Sectors content'in public sayfalara injection'ı — Part 2
- Yeni sektör ekleme akışı — YAGNI (Part 2'nin dinamik route kararıyla gelir)
- `sector_key` DROP migration — Part 2 veya ayrı teknik-borç oturumu
- Translation JSON cleanup — legacy 8 ref fallback için kalır (Part 2'de audit)
- Auto-translate — user manuel (Plan 4b feedback)

---

## 2. Mimari (yüksek seviye)

Plan 4b (products) pattern'ına yakın. **Reuse iddiası düzeltildi (Codex M2):** `LocaleTabs`, `assertUuid`, `recordAudit`, `revalidatePath`, `safeTranslate` helper'ı direkt reuse edilir; **upload tarafı yeni wrapper'larla** yazılır çünkü `components/admin/products/ImageUploader.tsx` şu an `product-images` bucket'a ve gallery paradigm'ına hardcoded (10MB, JPEG/PNG/WebP; SVG yok). Generic refactor = scope patlar.

```
app/admin/sectors/
├── page.tsx                    # list (3 satır, edit-only)
├── [id]/edit/page.tsx          # edit form
└── actions.ts                  # updateSector (create/delete yok)

app/admin/references/
├── page.tsx                    # list (active + deleted tabs)
├── new/page.tsx                # create form
├── [id]/edit/page.tsx          # edit form
└── actions.ts                  # create/update/softDelete/restore/moveUp/moveDown

components/admin/sectors/
├── SectorForm.tsx              # LocaleTabs + SectorHeroField + meta fields
├── SectorHeroField.tsx         # YENİ wrapper — tek dosya upload, sector-images bucket, alt 4-dil
└── SectorList.tsx              # 3 row edit-only list

components/admin/references/
├── ReferenceForm.tsx           # LocaleTabs + LogoField + SectorSelect + display_order
├── ReferenceList.tsx           # active/deleted tabs + arrow reorder
├── LogoField.tsx               # YENİ wrapper — tek logo upload, client-logos bucket, SVG kabul
└── SectorSelect.tsx            # sectors dropdown (sector_id)

# Public (Codex H1 — name resolution)
components/home/ReferencesStrip.tsx    # display_name fallback chain
components/references/ReferenceCard.tsx # display_name fallback chain
app/[locale]/references/page.tsx       # display_name fallback chain
lib/references/types.ts                # Reference.displayName ekle
lib/references/data.ts                 # display_name select + map
lib/utils/safe-translate.ts            # YENİ helper — missing translation sessiz atlar

# Admin lib
lib/admin/sectors.ts                   # listSectors, getSectorById
lib/admin/references.ts                # listReferences({active}), getReferenceById
lib/admin/sector-key-mapping.ts        # slug ↔ sector_key (camelCase) helper
lib/admin/sector-route-mapping.ts      # DB slug ↔ canonical EN slug (Codex H2)
lib/admin/schemas/sector.ts            # UpdateSectorSchema (zod)
lib/admin/schemas/reference.ts         # CreateReferenceSchema, UpdateReferenceSchema

scripts/migrate-client-logos-to-storage.ts
                                       # one-shot: public/references/*.svg → client-logos bucket
```

**Admin Shell nav** (`components/admin/Shell.tsx`):
```
Inbox · Katalog Talepleri · Ürünler · Sektörler · Referanslar · Ayarlar
```

**Sector route mapping** (`lib/admin/sector-route-mapping.ts` — Codex H2 fix):

```typescript
// DB slug (TR kebab) → canonical public pathname slug (EN)
// next-intl pathnames konfigurasyonu canonical EN'den locale-specific slug'a map eder
export const SECTOR_DB_TO_ROUTE: Record<string, string> = {
  "cam-yikama": "bottle-washing",
  "kapak":      "caps",
  "tekstil":    "textile",
};

export function dbSlugToRouteSlug(dbSlug: string): string {
  const route = SECTOR_DB_TO_ROUTE[dbSlug];
  if (!route) throw new Error(`Unknown sector DB slug: ${dbSlug}`);
  return route;
}
```

Bu mapping `revalidatePath` ve E2E assertion'larda kullanılır.

---

## 3. Veri Modeli & Migration

Tek migration: `supabase/migrations/20260424090000_plan5c_sectors_references_crud.sql`

### Sectors schema genişletmesi

```sql
alter table public.sectors
  add column hero_image jsonb,
  -- { path: "cam-yikama/<uuid>.webp", alt: { tr: "", en: "", ru: "", ar: "" } } | null
  add column long_description jsonb,
  -- { tr: "markdown...", en: "...", ru: "...", ar: "..." } | null
  add column meta_title jsonb,
  -- { tr: "...", en: "...", ru: "...", ar: "..." } | null
  add column meta_description jsonb;
  -- { tr: "...", en: "...", ru: "...", ar: "..." } | null
```

Tüm yeni alanlar nullable → mevcut 3 satır migration sonrası valid kalır (admin edit edene kadar boş).

### Clients schema genişletmesi

```sql
alter table public.clients
  add column display_name jsonb,
  -- { tr: "Firma X", en: "Company X", ru: "...", ar: "..." } | null
  add column sector_id uuid references public.sectors(id) on delete set null;

-- data migration: sector_key camelCase → sector_id UUID
update public.clients
set sector_id = (
  select id from public.sectors where slug = case clients.sector_key
    when 'camYikama' then 'cam-yikama'
    when 'kapak'     then 'kapak'
    when 'tekstil'   then 'tekstil'
  end
)
where sector_id is null;

-- `sector_key` DROP edilmez — ReferencesStrip + lib/references hâlâ okuyor.
-- Dual-write pattern: admin form submit'te sector_id → sector_key auto-sync.
```

### Storage bucket + RLS + hardening (Codex H4)

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-logos',
  'client-logos',
  true,
  1048576,  -- 1 MB
  array['image/svg+xml','image/png','image/jpeg','image/webp']
)
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- sector-images bucket Plan 3'te oluşturuldu; hardening Plan 4b'de products için yapıldı,
-- sector-images için aynı ayarları idempotent uygula:
update storage.buckets set
  file_size_limit    = 5242880,  -- 5 MB (hero images sector için biraz daha büyük kabul)
  allowed_mime_types = array['image/png','image/jpeg','image/webp']
where id = 'sector-images';

create policy "public read client-logos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'client-logos');

create policy "admin manage client-logos" on storage.objects
  for all to authenticated
  using (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()))
  with check (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()));

-- Path guard (opsiyonel, eşzamanlı check — mime_type zaten DB-level enforced)
-- Path: <uuid>.<ext> veya <sector-slug>/<uuid>.<ext>
-- Regex check storage.objects trigger ile eklenebilir; MVP için server action regex
-- validation yeterli (lib/admin/schemas/reference.ts logo_path regex).
```

`sector-images` bucket Plan 3'te oluşturuldu; hardening bu migration'la idempotent eklenir.

### Storage path pattern

- **Sector hero:** `sector-images/<sector_slug>/<uuid>.<ext>` (slug immutable → path stabil)
- **Client logos:** `client-logos/<uuid>.<ext>` (key'le bağ yok; rename-safe, SVG/PNG/WebP/JPG/JPEG kabul)

### Statik logo migration (one-shot) + deploy sırası (Codex H3)

`scripts/migrate-client-logos-to-storage.ts`:
1. `public/references/c1.svg ... c8.svg` her biri fs.readFile ile oku
2. `client-logos/<new-uuid>.svg` path'ine service-role client ile upload
3. `UPDATE clients SET logo_path = '<new-path>' WHERE key = 'cN'`
4. Script idempotent — `logo_path` zaten `client-logos/` ile başlıyorsa skip

**Deploy sırası (Codex H3 — dual-read pattern):**

1. **Phase A (code-first deploy)** — `lib/references/data.ts` ve public bileşenler **dual-read** destekli:
   ```typescript
   // lib/references/data.ts mapRow:
   function toPublicUrl(logoPath: string): string {
     if (logoPath.startsWith("/")) return logoPath;  // legacy /references/*.svg
     if (logoPath.startsWith("http")) return logoPath;  // absolute
     // Storage path: bucket/key → Supabase public URL
     const { data } = svc.storage.from("client-logos").getPublicUrl(logoPath);
     return data.publicUrl;
   }
   ```
   Phase A deploy edilir, canlıda dual-read aktif. Eski `/references/*.svg` path'leri hâlâ çalışır.

2. **Phase B (migration script run)** — Phase A canlıdayken script çalıştırılır:
   ```bash
   pnpm tsx scripts/migrate-client-logos-to-storage.ts
   ```
   Script `clients.logo_path` değerlerini storage path'e günceller. Dual-read kod yeni path'leri otomatik public URL'e çevirir.

3. **Phase C (cleanup, opsiyonel — sonraki oturum)** — `public/references/*.svg` dosyaları silinebilir veya tech-debt olarak kalır. Dual-read legacy `/` path fallback'i hâlâ destekler, risksiz.

**Tek PR içinde Phase A + B birlikte deploy edilir** (tek commit wave): code → merge → migration run. Dual-read pattern hiçbir ara anda public site kırılmasını önler.

---

## 4. Sayfalar & Akışlar

### 4.1 `/admin/sectors` (list, 3 satır)

| Sıra | Slug | TR Ad | Hero | Durum | Aksiyon |
|------|------|-------|------|-------|---------|
| 10 | cam-yikama | Cam Yıkama | 🖼️ | ✓ | [Düzenle] |
| 20 | kapak | Kapak | 🖼️ | ✓ | [Düzenle] |
| 30 | tekstil | Tekstil | ❌ | ✓ | [Düzenle] |

- Hero kolonu: upload edilmişse thumbnail preview, yoksa ❌ ikonu
- Yeni/Sil butonu yok
- display_order read-only (arrow yok)

### 4.2 `/admin/sectors/[id]/edit`

LocaleTabs (TR/EN/RU/AR):
- Ad (TR zorunlu, diğerleri opsiyonel — seed'den dolu)
- Kısa açıklama (opsiyonel, textarea)
- Uzun açıklama (opsiyonel, markdown textarea)
- Meta title (opsiyonel)
- Meta description (opsiyonel)

LocaleTabs dışı:
- Hero image (tek dosya upload, preview, silme, alt 4-dil)
- Display order (number input, 0-1000)
- Aktif (checkbox)

Slug edit YOK (immutable — route klasörleri bağımlı).

Butonlar: **Kaydet** / **Geri**.

### 4.3 `/admin/references` (list, 8+ satır)

```
[Aktif (N)] [Silinmiş (M)]                          [+ Yeni]

| Sıra | Logo | Anahtar | TR Ad | Sektör | ⬆⬇ | Aksiyon |
```

- Reorder: arrow buttons (üstteki Up disabled, alttaki Down disabled)
- Empty display_name → `—`
- Silinmiş tabında: [Geri yükle] butonu

### 4.4 `/admin/references/new` + `/admin/references/[id]/edit`

Alanlar:
- LocaleTabs display_name (TR/EN/RU/AR, hepsi opsiyonel)
- Logo (LogoField — tek dosya, SVG/PNG/WebP/JPG, max 1MB, min 400px genişlik)
- Key (create'te editable; edit'te read-only — seed güvenliği)
- Sektör (SectorSelect — 3 sektör dropdown, sector_id yazar)
- Display order (number, default: `max(display_order)+10`)
- Aktif (checkbox, default true)

Edit sayfasında ayrıca [Sil] (soft) butonu.

### 4.5 Admin Shell nav

Sidebar sıralama:
```
Inbox → Katalog Talepleri → Ürünler → Sektörler → Referanslar → Ayarlar
```

---

## 5. Server Actions & Validation

### 5.1 `app/admin/sectors/actions.ts`

```typescript
export async function updateSector(id: string, formData: FormData): Promise<void>
```

Akış:
1. `requireAdminRole()`
2. `assertUuid(id)`
3. `UpdateSectorSchema.parse(...)` (zod)
4. `svc.from("sectors").update({...}).eq("id", id)`
5. `recordAudit({ action: "sector_updated", diff })`
6. `revalidatePath` — canonical EN slug ile (Codex H2):
   ```typescript
   import { dbSlugToRouteSlug } from "@/lib/admin/sector-route-mapping";
   const routeSlug = dbSlugToRouteSlug(existing.slug); // "cam-yikama" → "bottle-washing"
   for (const loc of LOCALES) {
     revalidatePath(`/${loc}/sectors`, "layout");
     revalidatePath(`/${loc}/sectors/${routeSlug}`, "page");
   }
   ```
   next-intl pathnames locale-specific URL'lere auto-resolve eder.
7. `redirect("/admin/sectors?success=updated")`

### 5.2 `app/admin/references/actions.ts`

```typescript
export async function createReference(formData: FormData): Promise<void>
export async function updateReference(id: string, formData: FormData): Promise<void>
export async function softDeleteReference(id: string): Promise<void>
export async function restoreReference(id: string): Promise<void>
export async function moveReferenceUp(id: string): Promise<void>
export async function moveReferenceDown(id: string): Promise<void>
```

**createReference:**
1. `requireAdminRole()`
2. `CreateReferenceSchema.parse(...)`
3. Sector lookup: sector_id → sectors.slug → camelCase → sector_key (`lib/admin/sector-key-mapping.ts`)
4. Insert (sector_id + sector_key dual-write)
5. `recordAudit({ action: "reference_created" })`
6. `revalidatePath` — ana sayfa (ReferencesStrip) + `/references` (4 locale)
7. `redirect("/admin/references?success=created")`

**updateReference:**
- Logo replace edilmişse eski `logo_path` Storage'dan silinir (`svc.storage.from("client-logos").remove([oldPath])`) → hata olursa Sentry capture, işlem devam eder (orphan kabul edilir).
- Sector değişmişse sector_key auto-sync.

**softDeleteReference / restoreReference:** sadece `active=false/true`. Logo silmez (restore mümkün).

**moveReferenceUp/Down:**
- Aynı active state içinde neighbor bul — **stable sort** (`display_order` asc, sonra `id` asc — Codex M1 fix)
- İki row'un display_order'larını swap (single statement: `update ... set display_order = case when id=$1 then $curr2 when id=$2 then $curr1 end`)
- Komşu yoksa no-op
- `display_order` eşit (race sonucu duplicate) → stable sort `id` tie-breaker'ı deterministic order sağlar; swap hâlâ çalışır, duplicate tolere edilir (MVP traffic; unique constraint eklenmez — YAGNI)

**Listeleme query pattern** (`lib/admin/references.ts`, `lib/references/data.ts`):

```typescript
.order("display_order", { ascending: true })
.order("id", { ascending: true })  // tie-breaker
```

### 5.3 Zod şemaları

`lib/admin/schemas/sector.ts`:

```typescript
const I18nString = z.object({
  tr: z.string().trim().default(""),
  en: z.string().trim().default(""),
  ru: z.string().trim().default(""),
  ar: z.string().trim().default(""),
});

export const UpdateSectorSchema = z.object({
  name: I18nString.refine(v => v.tr.length > 0, "TR ad zorunlu"),
  description: I18nString.optional().nullable(),
  long_description: I18nString.optional().nullable(),
  meta_title: I18nString.optional().nullable(),
  meta_description: I18nString.optional().nullable(),
  hero_image: z.object({
    path: z.string().min(1),
    alt: I18nString,
  }).nullable(),
  display_order: z.number().int().min(0).max(1000),
  active: z.boolean(),
});
```

`lib/admin/schemas/reference.ts`:

```typescript
export const CreateReferenceSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/i, "Yalnızca harf/rakam/tire").min(1).max(32),
  display_name: I18nString.optional().nullable(),
  logo_path: z.string().regex(/^[a-z0-9-]+\/[a-f0-9-]{36}\.(svg|png|jpg|jpeg|webp)$/i),
  sector_id: z.string().uuid(),
  display_order: z.number().int().min(0).max(10000),
  active: z.boolean().default(true),
});

export const UpdateReferenceSchema = CreateReferenceSchema.omit({ key: true });
```

### 5.3.1 Logo dimension validation (Codex M4 — client-side only)

Server-side zod sadece `logo_path` format check eder. Dimension/size check **client-side pre-upload:**

- **Raster (PNG/JPEG/WebP):** `new Image()` ile `naturalWidth < 400` → yükleme engelle, user'a hata mesajı.
- **SVG:** Dimension check SKIP — SVG vector, viewBox konsepti fizibil değil. Sadece MIME + file size (bucket policy 1MB kısıtlar).
- **Server (bucket policy):** `file_size_limit=1048576`, `allowed_mime_types=...` — storage DB-level enforcement.
- **UX:** Upload öncesi validation fail → `LogoField` inline error, form submit butonu disable. Server'a hatalı dosya gönderilmez.

### 5.4 Hata yönetimi

| Durum | Davranış |
|---|---|
| Validation fail (zod) | `throw new Error(...)` → `/admin/error.tsx` boundary |
| Unique violation (`clients_key_key`) | DB hatası → `lib/admin/db-errors.ts` Türkçe mesaja map |
| Storage upload/remove fail | Sentry capture + user-facing "Görsel yüklenemedi, tekrar deneyin" |
| Concurrent move (race) | Display_order eşitse → no-op; tolerable |

### 5.5 Audit trail

Her mutation → `audit_log` insert:
- `sector_updated` (diff: değişen field'lar)
- `reference_created` (diff: key, sector_id, logo_path)
- `reference_updated` (diff: değişen field'lar + logo from→to)
- `reference_soft_deleted` / `reference_restored`
- `reference_reordered` (diff: display_order from→to)

---

## 6. Test Stratejisi

### 6.1 Unit (Vitest) — 12-15 yeni test

```
tests/unit/lib/admin/schemas/sector.test.ts          (4-5 case)
tests/unit/lib/admin/schemas/reference.test.ts       (4-5 case)
tests/unit/lib/admin/sector-key-mapping.test.ts      (2 case — slug↔camelCase + unknown throw)
tests/unit/components/admin/sectors/SectorForm.test.tsx       (3 case)
tests/unit/components/admin/references/ReferenceForm.test.tsx (3 case)
tests/unit/components/admin/references/ReferenceList.test.tsx (3 case)
```

### 6.2 E2E (Playwright) — 2 yeni spec, ~12 test case

```
tests/e2e/admin-sectors-crud.spec.ts
  ✓ admin login → /admin/sectors → 3 row
  ✓ Edit → form submit → success toast + list'e dönüş
  ✓ Public /en/sectors/bottle-washing + /tr/sektorler/cam-yikama hâlâ 200 (Codex H2)
  ✓ Revalidation mapping testi — DB slug cam-yikama → canonical bottle-washing

tests/e2e/admin-references-crud.spec.ts
  ✓ Active tab 8 row
  ✓ Yeni → submit → list'te görünür
  ✓ Edit display_name → ReferencesStrip'te alt text güncel
  ✓ Soft-delete → silinmiş tabına taşınır → restore → aktif
  ✓ Move up → swap + audit log
  ✓ Public anasayfa ReferencesStrip 200
```

Programatik admin login helper (Plan 4b: `tests/e2e/helpers/admin-login.ts`) reuse.

### 6.3 Lokal doğrulama (feedback_local_ci_e2e_parity)

Her iterative task sonrası:
```
pnpm run typecheck
pnpm run lint
pnpm vitest run
pnpm playwright test tests/e2e/admin-sectors-crud.spec.ts tests/e2e/admin-references-crud.spec.ts
pnpm run build
```

Merge öncesi: full E2E suite (~8 dk local, CI 2 worker ~4-5 dk).

### 6.4 TDD döngüsü

Her task için:
1. RED — failing test
2. GREEN — minimum implementation
3. REFACTOR — test hâlâ pass
4. Commit — conventional (`test(...):` + `feat(...):` ya da squash)

---

## 7. Cross-AI Review Gates (Codex)

> **Not (Codex M3 + user decision):** Bu bölüm feature acceptance criteria'sı değil, kalıcı engineering process governance'dır. Kullanıcı 2026-04-23 oturumunda her spec'e inline dahil edilmesini explicit istedi (memory: `feedback_codex_dual_review_gate.md`). Ayrı `PROTOCOL.md` dosyasına taşıma reddedildi — spec tek-dosya self-contained kalsın.

Bu spec (ve gelecek tüm specler için) iki zorunlu review gate:

### Gate 1 — Spec-level Codex review

Trigger: spec self-review tamamlandıktan sonra, user review'dan önce.

Tool: `.claude/commands/codex-review-spec.md` slash command.

Review dimensions:
1. Internal coherence
2. Migration safety
3. Security (RLS, storage policy, input validation)
4. Edge cases (concurrent admin, empty state, rollback)
5. Architecture fit (existing pattern'a uyum)
6. Scope creep (YAGNI)
7. Placeholder/TBD kaçağı

Claude bulguları kendi self-review'ı ile birleştirir:
- **Critical/High** → spec'te inline fix
- **Medium** → user'a sunulur, karar alınır
- **Low/divergent** → spec sonundaki **"Review Log"** appendix'inde belgelenir

### Gate 2 — PR-diff Codex review

Trigger: Execution tamamlanıp CI yeşil olunca, merge öncesi.

Tool: `.claude/commands/codex-review-pr.md` slash command.

Review dimensions:
1. Implementation ↔ spec uyumu
2. Regression riski
3. Test adequacy (unit + E2E coverage)
4. Security (secret leak, injection, auth)
5. Performance (N+1, unbounded loop)
6. Unidiomatic code (Turkish regex, mutation, type safety)

Çıktı PR body'e "## Codex Review" başlığı altında eklenir. Critical/high düzeltilir + tekrar review; medium/low "Known differences" olarak PR'a belgelenir. PR body'e `🔍 Reviewed by: Claude + Codex (GPT-5.4)` satırı.

### Failure modes (soft-warn, hard-block değil)

| Durum | Davranış |
|---|---|
| Codex CLI offline / auth expire | Spec/PR'a "codex review skipped: <neden>" notu, tech-debt flag, işlem devam eder |
| Çelişkili bulgular (Claude yeşil, Codex kırmızı) | Kullanıcıya tablo halinde sunulur, user arbiter |
| Düşük-sinyal Codex çıktısı | Review Log'a kayıt, self-review primary signal |
| Spec > 15K token | Bölüm-bazlı review (architecture, migration, UX ayrı ayrı) |

### Convergence

- **Tek round.** Claude critical/high fix'leri uygular, re-review yapılmaz.
- User review (insan gate) ikinci kontrol noktası.
- Uyumsuzluk → user arbitrasyon, döngü değil.

### Spec hash ile selective re-run

Review Log header'ında `sha256` hash. Spec substantially değişirse (yeni section) re-run önerilir; typo fix için değil.

### Retroactive scope

Mevcut merge-edilmiş specler (2026-04-16, 2026-04-21 Plan 4b, vb.) backfill edilmez. Bu gate **yeni yazılacak tüm specler için** zorunludur.

---

## 8. Release & Rollback

### Deploy sırası (Codex H3 — dual-read safe)

1. **Kod deploy öncesi:** `lib/references/data.ts` dual-read pattern aktif (Section 3 Phase A görmesi için). Bu PR'ın tüm kod değişiklikleri dual-read içerir.
2. **Migration apply:** `pnpm exec supabase db push` — ALTER TABLE ADD COLUMN + bucket hardening + data migration (sector_id backfill).
3. **Build + deploy:** Coolify auto-deploy GHA → canlıda dual-read kod aktif.
4. **Statik logo migration script run:** `pnpm tsx scripts/migrate-client-logos-to-storage.ts` — `logo_path` storage path'e güncellenir. Dual-read kod yeni path'i otomatik handle eder.
5. **Smoke:** `/admin/sectors`, `/admin/references`, ana sayfa ReferencesStrip, `/references` listesi, `/sectors/bottle-washing`.

### Rollback planı

- **Schema:** ALTER ADD COLUMN pure reversible (`alter table drop column`). Data migration (sector_id) tek yönlü ama sector_key hâlâ populated, veri kaybı yok.
- **Storage paths:** Script değişikliği reversible değil — fakat dual-read kod legacy `/references/*.svg` path'lerini hâlâ destekler. Acil rollback: `UPDATE clients SET logo_path = '/references/' || key || '.svg'` — eski JSON dosyaları hâlâ deploy'da.
- **Bucket hardening:** `file_size_limit` / `allowed_mime_types` geri alınabilir (`update storage.buckets set file_size_limit=null, allowed_mime_types=null`).
- **Kod:** `git revert <commit>` + Coolify redeploy.

---

## 9. Prereq (kullanıcıdan)

- **3 yüksek kaliteli sektör görseli** (cam yıkama, kapak, tekstil) — min 1600px width, landscape, production floor veya ürün close-up
- Görseller yoksa placeholder ile başlanabilir, admin upload flow test edilip sonra gerçek görseller yüklenir

---

## 10. Açık sorular (user answer bekliyor)

Hiçbiri — 5 soruda tüm kararlar alındı.

---

## Review Log

### Review Log — 2026-04-23 (Codex Gate 1)

**Spec hash (pre-review):** `sha256:9d24d6e7628789ee97d316fd5de8be341979ca9a6a7283ca3040fb4e96e61c78`
**Review round:** 1
**Status:** completed
**Reviewer:** Codex CLI 0.118.0 (via `codex:codex-rescue` subagent)

### Özet (Codex)

En kritik açık: references CRUD `display_name` ile yeni içerik kaynağı açıyor ama public references rendering hâlâ `messages`/`key` tabanlı — admin-created kayıtlar için isim çözümü spec'te kapanmıyor. Genel risk seviyesi: **high**. Öneri: high bulgular spec'te netleştirilmeden merge etme, medium'ları aynı turda kapat.

### Bulgular + eylem

| Severity | Section | Issue | Action Taken |
|----------|---------|-------|--------------|
| high | 1 / 4.4 / 5.2 / 6.2 | Public rendering hâlâ `tClients(ref.key)` — admin-created ref görünmez | **Fixed inline** — Section 1 "Public UI kapsamı" + Section 2 file listesi + fallback chain + `safeTranslate` helper. Scope'a `ReferencesStrip`, `ReferenceCard`, `references/page.tsx` dahil. |
| high | 1 / 5.1 / 6.2 | Sector DB slug (`cam-yikama`) ≠ public route (`bottle-washing`) — revalidatePath ve E2E yanlış | **Fixed inline** — Section 2 `lib/admin/sector-route-mapping.ts` eklendi, Section 5.1 revalidatePath canonical EN slug'ı kullanır, Section 6.2 E2E `/en/sectors/bottle-washing` + `/tr/sektorler/cam-yikama` test eder. |
| high | 3 / 8 | Logo migration script deploy'dan önce çalışırsa eski kod kırılır | **Fixed inline** — Section 3 dual-read pattern (Phase A code → Phase B script), Section 8 deploy sırası güncellendi. Legacy `/references/*.svg` fallback kod'ta korundu. |
| high | 3 (storage) | `client-logos` bucket `file_size_limit` + `allowed_mime_types` yok (Plan 4b hardening'dan sapma) | **Fixed inline** — Section 3 bucket insert'e `file_size_limit=1048576` + mime array eklendi + `sector-images` idempotent hardening update. |
| medium | 4.4 / 5.2 | `display_order` race — concurrent create/reorder duplicate | **User decision: A** (stable sort). Section 5.2 `.order(display_order).order(id)` tie-breaker eklendi. Unique constraint YAGNI. |
| medium | 2 | LocaleTabs/ImageUploader reuse iddiası abartılı | **User decision: A** (yeni wrapper). Section 2'de `LogoField` + `SectorHeroField` explicit yeni wrapper olarak işaretlendi; upload refactor scope dışı. |
| medium | 7 | Cross-AI Review Gates feature spec'e process governance sokuyor (scope creep) | **User decision: C** (olduğu gibi kalsın — explicit user request). Section 7 başına disclaimer notu eklendi, `feedback_codex_dual_review_gate.md` memory referansı. |
| medium | 4.4 / 5.3 | 400px width validation katmanı tanımlanmamış (SVG viewBox sorunu) | **User decision: A** (client-side). Section 5.3.1 eklendi: raster `naturalWidth` check, SVG skip, bucket policy MIME+size enforcement. |

### Divergent / low findings

_Yok — tüm Codex bulguları actionable'dı._

### Follow-up (Plan 5c Part 2 veya sonrası)

- `sector_key` kolonu DROP (Part 2 public migration sonrası)
- Translation JSON `references.clients.*` cleanup (8 legacy ref display_name'e migrate olduğunda)
- Unique constraint `(active, display_order)` opsiyonel (multi-admin trafiği artarsa)
- `sector-images` bucket path trigger regex guard (security deep-dive)
