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

### Non-goals

- Public `/sectors/[slug]` dinamik route — hardcoded 3 klasör kalır (Part 2)
- ReferencesStrip/`/references` public UI değişiklikleri — minimum (sadece alt text `display_name` fallback)
- Yeni sektör ekleme akışı — YAGNI (Part 2'nin dinamik route kararıyla gelir)
- `sector_key` DROP migration — Part 2 veya ayrı teknik-borç oturumu
- Auto-translate — user manuel (Plan 4b feedback)

---

## 2. Mimari (yüksek seviye)

Plan 4b (products) pattern'ına birebir uyumlu. Reusable primitive'ler halihazırda generic (`LocaleTabs`, `ImageUploader`, `assertUuid`, `recordAudit`, `revalidatePath`).

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
├── SectorForm.tsx              # LocaleTabs + HeroImageField + meta fields
└── SectorList.tsx              # 3 row edit-only list

components/admin/references/
├── ReferenceForm.tsx           # LocaleTabs + LogoField + SectorSelect + display_order
├── ReferenceList.tsx           # active/deleted tabs + arrow reorder
├── LogoField.tsx               # single-logo upload wrapper
└── SectorSelect.tsx            # sectors dropdown (sector_id)

lib/admin/sectors.ts            # listSectors, getSectorById
lib/admin/references.ts         # listReferences({active}), getReferenceById
lib/admin/sector-key-mapping.ts # slug ↔ sector_key (camelCase) helper
lib/admin/schemas/sector.ts     # UpdateSectorSchema (zod)
lib/admin/schemas/reference.ts  # CreateReferenceSchema, UpdateReferenceSchema

scripts/migrate-client-logos-to-storage.ts
                                # one-shot: public/references/*.svg → client-logos bucket
```

**Admin Shell nav** (`components/admin/Shell.tsx`):
```
Inbox · Katalog Talepleri · Ürünler · Sektörler · Referanslar · Ayarlar
```

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

### Storage bucket + RLS

```sql
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

create policy "public read client-logos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'client-logos');

create policy "admin manage client-logos" on storage.objects
  for all to authenticated
  using (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()))
  with check (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()));
```

`sector-images` bucket Plan 3'te zaten mevcut (RLS de hazır).

### Storage path pattern

- **Sector hero:** `sector-images/<sector_slug>/<uuid>.<ext>` (slug immutable → path stabil)
- **Client logos:** `client-logos/<uuid>.<ext>` (key'le bağ yok; rename-safe, SVG/PNG/WebP/JPG/JPEG kabul)

### Statik logo migration (one-shot)

`scripts/migrate-client-logos-to-storage.ts`:
1. `public/references/c1.svg ... c8.svg` her biri fs.readFile ile oku
2. `client-logos/<new-uuid>.svg` path'ine service-role client ile upload
3. `UPDATE clients SET logo_path = '<new-path>' WHERE key = 'cN'`
4. Script idempotent — `logo_path` zaten `client-logos/` ile başlıyorsa skip

Deploy öncesi bir kere çalıştırılır. Sonraki `public/references/*.svg` dosyaları bu oturumda temizlenebilir veya teknik-borç olarak bırakılır (fallback, tutulması zararsız).

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
6. `revalidatePath` — tüm locale'lerde `/sectors` + `/sectors/[slug]` (4 locale × 4 path = 16 path)
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
- Aynı active state içinde neighbor bul (`display_order` ascending)
- İki row'un display_order'larını swap (single statement: `update ... set display_order = case when id=$1 then $curr2 when id=$2 then $curr1 end`)
- Komşu yoksa no-op

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
  ✓ Public /sectors/cam-yikama hâlâ 200

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

### Deploy sırası

1. Migration apply (`pnpm exec supabase db push`)
2. Statik logo migration script run (`pnpm tsx scripts/migrate-client-logos-to-storage.ts`)
3. Build + deploy (Coolify auto-deploy GHA)
4. Smoke: `/admin/sectors`, `/admin/references`, ana sayfa ReferencesStrip

### Rollback planı

- Migration pure ALTER ADD COLUMN — reversible (`alter table drop column`). Data migration tek yönlü ama sector_key hâlâ populated, veri kaybı yok.
- Statik logo migration reversible değil — `logo_path` storage path'e yazıldı. Rollback: hand-update `logo_path = '/references/cN.svg'`.
- Hata durumunda `git revert` + Coolify redeploy + manuel logo_path update.

---

## 9. Prereq (kullanıcıdan)

- **3 yüksek kaliteli sektör görseli** (cam yıkama, kapak, tekstil) — min 1600px width, landscape, production floor veya ürün close-up
- Görseller yoksa placeholder ile başlanabilir, admin upload flow test edilip sonra gerçek görseller yüklenir

---

## 10. Açık sorular (user answer bekliyor)

Hiçbiri — 5 soruda tüm kararlar alındı.

---

## Review Log

<!--
Bu bölüme Codex review çıktıları append edilir. Format:

## Review Log — YYYY-MM-DD (Codex)
**Spec hash:** `sha256:...`
**Review round:** 1
**Status:** completed

### Özet (3 satır)
...

### Bulgular
| Severity | Section | Issue | Suggestion | Action Taken |
| critical | X.Y | ... | ... | fixed inline |
| medium   | X.Y | ... | ... | user-decision: ... |
-->

_Pending — Gate 1 henüz çalıştırılmadı._
