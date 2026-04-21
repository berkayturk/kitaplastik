# Plan 4b — Admin Products CRUD + Public Ürün Sayfaları Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin panelinden ürün CRUD (4-dil opsiyonel tab, 10 preset spec, görsel upload, soft-delete/restore, benzer-ekle clone) + public `/products` grid & `/products/[slug]` detay sayfası + Standart RFQ ProductPicker'ı katalog-backed autocomplete'e çevirmek.

**Architecture:** Next.js 15 App Router + RSC + Server Actions + Supabase (Postgres + Storage) + TDD. Admin `/admin/products/*` TR-only, Shell navigation ile entegre. Public `/[locale]/products*` 4 dilde render, "boşsa gösterme" filtresi (`name->>{locale} not null`). Alt text runtime auto-fallback. Slug first-save locked + opt-in düzenle toggle. Clone = Storage.copy ile yeni UUID path'ler + yeni row insert.

**Tech Stack:** Next.js 15.5.15, React 19, TS 5.9.3, Tailwind 4, next-intl 3.26.5, Supabase (supabase-js v2), Zod v4, Vitest, Playwright, shadcn/ui primitive'ler, Resend (mevcut), `@/lib/admin/auth` (mevcut).

**Spec referansı:** `docs/superpowers/specs/2026-04-21-plan4b-admin-products-crud-design.md`

---

## File Structure

### Yeni dosyalar (create)

```
lib/products/alt-text.ts                    Runtime alt text fallback helper
lib/products/json-ld.ts                     XSS-safe JSON-LD string helper (escape </script)
lib/utils/slugify.ts                        Türkçe-aware slug üretici
lib/utils/unique-slug.ts                    DB-backed uniqueness (ürün slug)
lib/admin/spec-presets.ts                   10 preset × 4 dil label
lib/admin/schemas/product.ts                Zod CreateProduct/UpdateProduct
lib/admin/products.ts                       Server CRUD helpers (read/list)

app/admin/products/actions.ts               create/update/softDelete/restore/cloneProduct
app/admin/products/page.tsx                 Liste (RSC) — tab + search
app/admin/products/new/page.tsx             Yeni Ürün formu (RSC shell + ProductForm client island)
app/admin/products/[id]/edit/page.tsx       Düzenle formu

app/[locale]/products/[slug]/page.tsx       Ürün detay (yeni, dynamic)

components/admin/products/ProductList.tsx   Liste UI (tab + arama + tablo)
components/admin/products/ProductRow.tsx    Tek satır
components/admin/products/ProductForm.tsx   Ana form (client, compose)
components/admin/products/LocaleTabs.tsx    TR/EN/RU/AR switcher
components/admin/products/SlugField.tsx     Kilitli + toggle + uyarı
components/admin/products/SpecBuilder.tsx   Preset dropdown + up/down + delete
components/admin/products/ImageUploader.tsx Storage direct upload + reorder
components/admin/products/DeleteDialog.tsx  Confirm modal
components/admin/products/RestoreButton.tsx Geri yükle action button
components/admin/products/CloneButton.tsx   Benzer ekle action button
components/admin/products/SaveProgressModal.tsx Blocking "Kaydediliyor..."

components/public/products/ProductGrid.tsx  Grid layout
components/public/products/ProductCard.tsx  Kart (görsel + ad + sektör)
components/public/products/ProductDetail.tsx Detay sayfası ana bileşen
components/public/products/ProductGallery.tsx Ana görsel + thumbs + lightbox
components/public/products/ProductSpecTable.tsx Spec tablosu

tests/unit/lib/utils/slugify.test.ts
tests/unit/lib/utils/unique-slug.test.ts
tests/unit/lib/admin/spec-presets.test.ts
tests/unit/lib/admin/schemas/product.test.ts
tests/unit/lib/products/alt-text.test.ts
tests/unit/lib/products/json-ld.test.ts
tests/unit/components/admin/products/SlugField.test.tsx
tests/unit/components/admin/products/SpecBuilder.test.tsx

tests/e2e/helpers/admin-login.ts            Programmatic session cookie inject
tests/e2e/admin-product-create.spec.ts
tests/e2e/admin-product-edit.spec.ts
tests/e2e/admin-product-clone.spec.ts
tests/e2e/admin-product-delete-restore.spec.ts
tests/e2e/public-products-grid.spec.ts
tests/e2e/public-product-detail.spec.ts
tests/e2e/rfq-product-picker.spec.ts
```

### Değişecek dosyalar (modify)

```
messages/{tr,en,ru,ar}/common.json          +productImageLabel key
app/[locale]/products/page.tsx              Placeholder silinir, gerçek grid
components/admin/Shell.tsx                  Nav'a "Ürünler" link, active tipi güncellenir
components/rfq/ProductPicker.tsx            Free-text → catalog autocomplete + empty state
components/rfq/StandartRfqForm.tsx          locale prop'u ProductPicker'a geçir
```

---

## Task 1: I18n key `productImageLabel` + alt text helper

**Files:**
- Modify: `messages/tr/common.json`
- Modify: `messages/en/common.json`
- Modify: `messages/ru/common.json`
- Modify: `messages/ar/common.json`
- Create: `lib/products/alt-text.ts`
- Test: `tests/unit/lib/products/alt-text.test.ts`

- [ ] **Step 1: Failing test yaz**

```ts
// tests/unit/lib/products/alt-text.test.ts
import { describe, it, expect } from "vitest";
import { getImageAltText } from "@/lib/products/alt-text";

describe("getImageAltText", () => {
  const name = {
    tr: "PET Preform Kapak 28 mm",
    en: "PET Preform Cap 28 mm",
    ru: "ПЭТ Преформа Крышка 28 мм",
    ar: "غطاء PET preform مقاس 28 مم",
  };

  it("ana görselde (order=0) sadece ürün adını döner (TR)", () => {
    expect(getImageAltText({ name, locale: "tr", order: 0, imageLabel: "görsel" }))
      .toBe("PET Preform Kapak 28 mm");
  });

  it("galeri görselinde order+1 + imageLabel ekler (EN)", () => {
    expect(getImageAltText({ name, locale: "en", order: 1, imageLabel: "image" }))
      .toBe("PET Preform Cap 28 mm — image 2");
  });

  it("RU Cyrillic labelı doğru birleştirir", () => {
    expect(getImageAltText({ name, locale: "ru", order: 2, imageLabel: "изображение" }))
      .toBe("ПЭТ Преформа Крышка 28 мм — изображение 3");
  });

  it("AR RTL için aynı format", () => {
    expect(getImageAltText({ name, locale: "ar", order: 3, imageLabel: "صورة" }))
      .toBe("غطاء PET preform مقاس 28 مم — صورة 4");
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/lib/products/alt-text.test.ts`
Expected: FAIL with "Cannot find module '@/lib/products/alt-text'"

- [ ] **Step 3: Helper + i18n key implement**

```ts
// lib/products/alt-text.ts
import type { Locale } from "@/i18n/routing";

export interface ProductName {
  tr: string;
  en?: string;
  ru?: string;
  ar?: string;
}

interface Args {
  name: ProductName;
  locale: Locale;
  order: number;
  imageLabel: string;
}

export function getImageAltText({ name, locale, order, imageLabel }: Args): string {
  const base = name[locale] ?? name.tr;
  if (order === 0) return base;
  return `${base} — ${imageLabel} ${order + 1}`;
}
```

4 dilde `common.json`'a key ekle (her dosyanın root object'ine):

```jsonc
// messages/tr/common.json
"productImageLabel": "görsel"

// messages/en/common.json
"productImageLabel": "image"

// messages/ru/common.json
"productImageLabel": "изображение"

// messages/ar/common.json
"productImageLabel": "صورة"
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/lib/products/alt-text.test.ts`
Expected: PASS (4 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/products/alt-text.ts tests/unit/lib/products/alt-text.test.ts messages/{tr,en,ru,ar}/common.json
git commit -m "feat(products): add image alt text auto-fallback helper + i18n key"
```

---

## Task 2: XSS-safe JSON-LD helper (Schema.org güvenli encode)

**Files:**
- Create: `lib/products/json-ld.ts`
- Test: `tests/unit/lib/products/json-ld.test.ts`

Bu helper, `<script type="application/ld+json">` tag'ine enjekte edilecek JSON string'i `</script` ve `<!--` gibi tehlikeli dizileri escape ederek güvenli hale getirir. Detay sayfasında (Task 22) kullanılır. XSS açık bırakmamak için `JSON.stringify` tek başına yeterli değildir çünkü `</script>` içerik kırar.

- [ ] **Step 1: Failing test yaz**

```ts
// tests/unit/lib/products/json-ld.test.ts
import { describe, it, expect } from "vitest";
import { toSafeLdJson } from "@/lib/products/json-ld";

describe("toSafeLdJson", () => {
  it("standart JSON objesi için geçerli string üretir", () => {
    const out = toSafeLdJson({ a: 1, b: "hi" });
    expect(JSON.parse(out)).toEqual({ a: 1, b: "hi" });
  });

  it("string içindeki </script bayrağını escape eder", () => {
    const malicious = { name: "bad</script><script>alert(1)</script>" };
    const out = toSafeLdJson(malicious);
    expect(out).not.toMatch(/<\/script/);
    expect(out).toMatch(/\\u003c\/script/i);
  });

  it("string içindeki HTML yorum açılışını da escape eder", () => {
    const out = toSafeLdJson({ x: "<!-- comment" });
    expect(out).not.toContain("<!--");
    expect(out).toMatch(/\\u003c!--/);
  });

  it("U+2028 / U+2029 line separators escape edilir (JSON'da geçerli, JS'de değil)", () => {
    const out = toSafeLdJson({ x: "line sep" });
    expect(out).not.toContain(" ");
    expect(out).toContain("\\u2028");
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/lib/products/json-ld.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Helper implement**

```ts
// lib/products/json-ld.ts
/**
 * JSON.stringify + HTML-safe escapes. Use only for <script type="application/ld+json">.
 * Escapes characters that could break out of a <script> tag or JSON context in HTML.
 */
export function toSafeLdJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/ /g, "\\u2028")
    .replace(/ /g, "\\u2029");
}
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/lib/products/json-ld.test.ts`
Expected: PASS (4 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/products/json-ld.ts tests/unit/lib/products/json-ld.test.ts
git commit -m "feat(products): add XSS-safe JSON-LD encoder for Schema.org injection"
```

---

## Task 3: Türkçe-aware slugify

**Files:**
- Create: `lib/utils/slugify.ts`
- Test: `tests/unit/lib/utils/slugify.test.ts`

- [ ] **Step 1: Failing test yaz**

```ts
// tests/unit/lib/utils/slugify.test.ts
import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("Türkçe karakterleri ASCII'ye çevirir", () => {
    expect(slugify("PET Preform Kapak 28 mm")).toBe("pet-preform-kapak-28-mm");
    expect(slugify("Şişe Yıkama Kapağı")).toBe("sise-yikama-kapagi");
    expect(slugify("İstanbul Özel Ürün")).toBe("istanbul-ozel-urun");
  });

  it("fazla boşluk ve noktalama'yı temizler", () => {
    expect(slugify("  Çift  Boşluk!!! ")).toBe("cift-bosluk");
    expect(slugify("Ürün (v2) — 2025")).toBe("urun-v2-2025");
  });

  it("alfasayısal olmayan karakterleri silip tire ile birleştirir", () => {
    expect(slugify("% / ? @ ş")).toBe("s");
  });

  it("boş string boş slug döner", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/lib/utils/slugify.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: slugify implement**

```ts
// lib/utils/slugify.ts
const TR_MAP: Record<string, string> = {
  "ı": "i", "I": "i", "İ": "i",
  "ş": "s", "Ş": "s",
  "ğ": "g", "Ğ": "g",
  "ü": "u", "Ü": "u",
  "ö": "o", "Ö": "o",
  "ç": "c", "Ç": "c",
};

export function slugify(input: string): string {
  if (!input) return "";
  const asciified = Array.from(input)
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");
  return asciified
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/lib/utils/slugify.test.ts`
Expected: PASS (4 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/utils/slugify.ts tests/unit/lib/utils/slugify.test.ts
git commit -m "feat(utils): add Türkçe-aware slugify helper"
```

---

## Task 4: Unique slug helper (DB-backed)

**Files:**
- Create: `lib/utils/unique-slug.ts`
- Test: `tests/unit/lib/utils/unique-slug.test.ts`

- [ ] **Step 1: Failing test yaz**

```ts
// tests/unit/lib/utils/unique-slug.test.ts
import { describe, it, expect, vi } from "vitest";
import { uniqueSlug } from "@/lib/utils/unique-slug";

describe("uniqueSlug", () => {
  it("slug free ise olduğu gibi döner", async () => {
    const exists = vi.fn(async () => false);
    expect(await uniqueSlug("pet-kapak", exists)).toBe("pet-kapak");
    expect(exists).toHaveBeenCalledWith("pet-kapak");
  });

  it("slug alınmışsa -2, -3 suffix dener", async () => {
    const taken = new Set(["pet-kapak", "pet-kapak-2"]);
    const exists = vi.fn(async (s: string) => taken.has(s));
    expect(await uniqueSlug("pet-kapak", exists)).toBe("pet-kapak-3");
  });

  it("çok fazla collision'da anlamlı hata fırlatır", async () => {
    const exists = vi.fn(async () => true);
    await expect(uniqueSlug("x", exists, { maxAttempts: 3 })).rejects.toThrow(/unique slug/i);
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/lib/utils/unique-slug.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Helper implement**

```ts
// lib/utils/unique-slug.ts
interface Opts {
  maxAttempts?: number;
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  opts: Opts = {},
): Promise<string> {
  const max = opts.maxAttempts ?? 50;
  if (!(await exists(base))) return base;
  for (let i = 2; i <= max; i++) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`Could not generate unique slug for base "${base}" in ${max} attempts`);
}
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/lib/utils/unique-slug.test.ts`
Expected: PASS (3 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/utils/unique-slug.ts tests/unit/lib/utils/unique-slug.test.ts
git commit -m "feat(utils): add uniqueSlug helper with collision suffix"
```

---

## Task 5: Spec presets (10 × 4 dil)

**Files:**
- Create: `lib/admin/spec-presets.ts`
- Test: `tests/unit/lib/admin/spec-presets.test.ts`

- [ ] **Step 1: Failing test yaz**

```ts
// tests/unit/lib/admin/spec-presets.test.ts
import { describe, it, expect } from "vitest";
import { SPEC_PRESETS, getPresetLabel, type SpecPresetId } from "@/lib/admin/spec-presets";

describe("SPEC_PRESETS", () => {
  it("tam olarak 10 preset tanımlı", () => {
    expect(SPEC_PRESETS).toHaveLength(10);
  });

  it("her preset 4 dilde label'a sahip", () => {
    for (const p of SPEC_PRESETS) {
      expect(p.labels.tr).toBeTruthy();
      expect(p.labels.en).toBeTruthy();
      expect(p.labels.ru).toBeTruthy();
      expect(p.labels.ar).toBeTruthy();
    }
  });

  it("id'ler unique", () => {
    const ids = SPEC_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getPresetLabel", () => {
  it("verilen locale'de label döner", () => {
    expect(getPresetLabel("material", "tr")).toBe("Malzeme");
    expect(getPresetLabel("material", "en")).toBe("Material");
    expect(getPresetLabel("material", "ru")).toBe("Материал");
    expect(getPresetLabel("material", "ar")).toBe("مادة");
  });

  it("bilinmeyen preset için id fallback", () => {
    expect(getPresetLabel("unknown" as SpecPresetId, "tr")).toBe("unknown");
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/lib/admin/spec-presets.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Preset tablosu implement**

```ts
// lib/admin/spec-presets.ts
import type { Locale } from "@/i18n/routing";

export type SpecPresetId =
  | "material" | "dimension" | "color" | "moq" | "weight"
  | "certificate" | "production" | "recycling" | "shelfLife" | "tolerance";

export interface SpecPreset {
  id: SpecPresetId;
  labels: Record<Locale, string>;
}

export const SPEC_PRESETS: readonly SpecPreset[] = [
  { id: "material",     labels: { tr: "Malzeme",      en: "Material",    ru: "Материал",       ar: "مادة" } },
  { id: "dimension",    labels: { tr: "Boyut",        en: "Dimension",   ru: "Размер",         ar: "القياس" } },
  { id: "color",        labels: { tr: "Renk",         en: "Color",       ru: "Цвет",           ar: "اللون" } },
  { id: "moq",          labels: { tr: "MOQ",          en: "MOQ",         ru: "MOQ",            ar: "MOQ" } },
  { id: "weight",       labels: { tr: "Ağırlık",      en: "Weight",      ru: "Вес",            ar: "الوزن" } },
  { id: "certificate",  labels: { tr: "Sertifika",    en: "Certificate", ru: "Сертификат",     ar: "شهادة" } },
  { id: "production",   labels: { tr: "Üretim",       en: "Production",  ru: "Производство",   ar: "الإنتاج" } },
  { id: "recycling",    labels: { tr: "Geri Dönüşüm", en: "Recycling",   ru: "Переработка",    ar: "إعادة التدوير" } },
  { id: "shelfLife",    labels: { tr: "Raf Ömrü",     en: "Shelf Life",  ru: "Срок хранения",  ar: "مدة الصلاحية" } },
  { id: "tolerance",    labels: { tr: "Tolerans",     en: "Tolerance",   ru: "Допуск",         ar: "تحمل" } },
] as const;

const PRESET_MAP = new Map<SpecPresetId, SpecPreset>(
  SPEC_PRESETS.map((p) => [p.id, p]),
);

export function getPresetLabel(id: SpecPresetId, locale: Locale): string {
  const preset = PRESET_MAP.get(id);
  return preset?.labels[locale] ?? id;
}
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/lib/admin/spec-presets.test.ts`
Expected: PASS (5 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/spec-presets.ts tests/unit/lib/admin/spec-presets.test.ts
git commit -m "feat(admin): add 10 spec presets with 4-locale labels"
```

---

## Task 6: Zod product schemas

**Files:**
- Create: `lib/admin/schemas/product.ts`
- Test: `tests/unit/lib/admin/schemas/product.test.ts`

- [ ] **Step 1: Failing test yaz**

```ts
// tests/unit/lib/admin/schemas/product.test.ts
import { describe, it, expect } from "vitest";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/admin/schemas/product";

describe("CreateProductSchema", () => {
  const validBase = {
    sector_id: "00000000-0000-0000-0000-000000000001",
    name: { tr: "PET Kapak", en: "", ru: "", ar: "" },
    description: { tr: "Açıklama", en: "", ru: "", ar: "" },
    specs: [{ preset_id: "material", value: "PET" }],
    images: [{ path: "draft/abc.jpg", order: 0, alt_text: { tr: "", en: "", ru: "", ar: "" } }],
  };

  it("TR name zorunlu, diğerleri opsiyonel", () => {
    expect(CreateProductSchema.safeParse(validBase).success).toBe(true);

    const missingTr = { ...validBase, name: { tr: "", en: "Cap", ru: "", ar: "" } };
    expect(CreateProductSchema.safeParse(missingTr).success).toBe(false);
  });

  it("preset_id aynı olan iki spec reddedilir (unique)", () => {
    const duplicate = {
      ...validBase,
      specs: [
        { preset_id: "material", value: "PET" },
        { preset_id: "material", value: "EVOH" },
      ],
    };
    const result = CreateProductSchema.safeParse(duplicate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => /unique|duplicate/i.test(i.message))).toBe(true);
    }
  });

  it("bilinmeyen preset_id reddedilir", () => {
    const bad = { ...validBase, specs: [{ preset_id: "foo", value: "bar" }] };
    expect(CreateProductSchema.safeParse(bad).success).toBe(false);
  });

  it("max 5 görsel, 6 reddedilir", () => {
    const images = Array.from({ length: 6 }, (_, i) => ({
      path: `x/${i}.jpg`, order: i,
      alt_text: { tr: "", en: "", ru: "", ar: "" },
    }));
    expect(CreateProductSchema.safeParse({ ...validBase, images }).success).toBe(false);
  });
});

describe("UpdateProductSchema", () => {
  it("slug_override alanı opsiyonel, varsa slug formatı dayatır", () => {
    const validUpdate = {
      sector_id: "00000000-0000-0000-0000-000000000001",
      name: { tr: "Yeni Ad", en: "", ru: "", ar: "" },
      description: { tr: "", en: "", ru: "", ar: "" },
      specs: [],
      images: [],
      slug_override: "yeni-urun-slug",
    };
    expect(UpdateProductSchema.safeParse(validUpdate).success).toBe(true);

    const badSlug = { ...validUpdate, slug_override: "Boşluklu Slug!" };
    expect(UpdateProductSchema.safeParse(badSlug).success).toBe(false);
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/lib/admin/schemas/product.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Schemas implement**

```ts
// lib/admin/schemas/product.ts
import { z } from "zod";
import { SPEC_PRESETS } from "@/lib/admin/spec-presets";

const PRESET_IDS = SPEC_PRESETS.map((p) => p.id) as [string, ...string[]];

const LocalizedText = z.object({
  tr: z.string(),
  en: z.string(),
  ru: z.string(),
  ar: z.string(),
});

const SpecItem = z.object({
  preset_id: z.enum(PRESET_IDS),
  value: z.string().min(1, "value gerekli").max(200),
});

const ImageItem = z.object({
  path: z.string().min(1),
  order: z.number().int().min(0),
  alt_text: LocalizedText,
});

const SlugString = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid slug format");

const uniquePresets = (specs: { preset_id: string }[], ctx: z.RefinementCtx) => {
  const seen = new Set<string>();
  for (const [i, s] of specs.entries()) {
    if (seen.has(s.preset_id)) {
      ctx.addIssue({
        code: "custom",
        path: ["specs", i, "preset_id"],
        message: `preset_id "${s.preset_id}" must be unique per product`,
      });
    }
    seen.add(s.preset_id);
  }
};

const Base = z.object({
  sector_id: z.string().uuid(),
  name: LocalizedText.refine((n) => n.tr.trim().length > 0, {
    message: "name.tr zorunlu",
    path: ["tr"],
  }),
  description: LocalizedText,
  specs: z.array(SpecItem).max(10).superRefine(uniquePresets),
  images: z.array(ImageItem).max(5),
});

export const CreateProductSchema = Base;

export const UpdateProductSchema = Base.extend({
  slug_override: SlugString.optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/lib/admin/schemas/product.test.ts`
Expected: PASS (5 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/schemas/product.ts tests/unit/lib/admin/schemas/product.test.ts
git commit -m "feat(admin): add Zod product schemas — TR zorunlu, preset unique, max 5 image"
```

---

## Task 7: Product read helpers + createProduct server action

**Files:**
- Create: `lib/admin/products.ts` (list/get helpers)
- Create: `app/admin/products/actions.ts`

- [ ] **Step 1: Read helpers yaz**

```ts
// lib/admin/products.ts
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface ProductImage { path: string; order: number; alt_text: Record<string, string> }
export interface ProductSpec { preset_id: string; value: string }

export interface ProductRow {
  id: string;
  slug: string;
  sector_id: string | null;
  name: Record<string, string>;
  description: Record<string, string>;
  images: ProductImage[];
  specs: ProductSpec[];
  active: boolean;
  display_order: number;
  updated_at: string;
}

export async function listProducts(opts: { active: boolean; search?: string }): Promise<ProductRow[]> {
  const svc = createServiceClient();
  let q = svc.from("products")
    .select("id, slug, sector_id, name, description, images, specs, active, display_order, updated_at")
    .eq("active", opts.active)
    .order("updated_at", { ascending: false });
  if (opts.search && opts.search.trim()) {
    q = q.ilike("slug", `%${opts.search.trim()}%`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProductRow[];
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("products")
    .select("id, slug, sector_id, name, description, images, specs, active, display_order, updated_at")
    .eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as ProductRow | null) ?? null;
}

export async function slugExists(slug: string, ignoreId?: string): Promise<boolean> {
  const svc = createServiceClient();
  let q = svc.from("products").select("id", { count: "exact", head: true }).eq("slug", slug);
  if (ignoreId) q = q.neq("id", ignoreId);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}
```

- [ ] **Step 2: createProduct action yaz**

```ts
// app/admin/products/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/admin/schemas/product";
import { slugify } from "@/lib/utils/slugify";
import { uniqueSlug } from "@/lib/utils/unique-slug";
import { slugExists, getProductById } from "@/lib/admin/products";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

function revalidatePublicProducts() {
  for (const loc of LOCALES) revalidatePath(`/${loc}/products`, "layout");
}

function parseJson<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (typeof raw !== "string" || !raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export async function createProduct(formData: FormData): Promise<void> {
  const user = await requireAdminRole();

  const input = CreateProductSchema.parse({
    sector_id: String(formData.get("sector_id") ?? ""),
    name: parseJson(formData.get("name"), { tr: "", en: "", ru: "", ar: "" }),
    description: parseJson(formData.get("description"), { tr: "", en: "", ru: "", ar: "" }),
    specs: parseJson(formData.get("specs"), []),
    images: parseJson(formData.get("images"), []),
  });

  const baseSlug = slugify(input.name.tr);
  if (!baseSlug) throw new Error("TR adından geçerli slug üretilemedi");
  const slug = await uniqueSlug(baseSlug, (s) => slugExists(s));

  const svc = createServiceClient();
  const { data, error } = await svc.from("products").insert({
    slug,
    sector_id: input.sector_id,
    name: input.name,
    description: input.description,
    specs: input.specs,
    images: input.images,
    active: true,
  }).select("id").single();
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_created",
    entity_type: "product",
    entity_id: data.id,
    user_id: user.id,
    ip: null,
    diff: { slug, sector_id: input.sector_id },
  });

  revalidatePublicProducts();
  redirect("/admin/products?success=created");
}
```

- [ ] **Step 3: Typecheck doğrula**

Run: `pnpm typecheck`
Expected: PASS (hiç tip hatası yok)

- [ ] **Step 4: Build doğrula**

Run: `pnpm build 2>&1 | grep -iE "error" | head -5`
Expected: hiç "error" çıktısı yok (build geçer)

- [ ] **Step 5: Commit**

```bash
git add lib/admin/products.ts app/admin/products/actions.ts
git commit -m "feat(admin/products): add read helpers + createProduct server action"
```

---

## Task 8: updateProduct server action

**Files:**
- Modify: `app/admin/products/actions.ts`

- [ ] **Step 1: updateProduct ekle (mevcut dosyaya ekle)**

```ts
// app/admin/products/actions.ts içinde ekle
export async function updateProduct(id: string, formData: FormData): Promise<void> {
  const user = await requireAdminRole();

  const slugOverride = String(formData.get("slug_override") ?? "").trim() || undefined;

  const input = UpdateProductSchema.parse({
    sector_id: String(formData.get("sector_id") ?? ""),
    name: parseJson(formData.get("name"), { tr: "", en: "", ru: "", ar: "" }),
    description: parseJson(formData.get("description"), { tr: "", en: "", ru: "", ar: "" }),
    specs: parseJson(formData.get("specs"), []),
    images: parseJson(formData.get("images"), []),
    ...(slugOverride ? { slug_override: slugOverride } : {}),
  });

  const existing = await getProductById(id);
  if (!existing) throw new Error("Ürün bulunamadı");

  let nextSlug = existing.slug;
  if (input.slug_override && input.slug_override !== existing.slug) {
    if (await slugExists(input.slug_override, id)) {
      throw new Error(`"${input.slug_override}" slug başka ürün tarafından kullanılıyor`);
    }
    nextSlug = input.slug_override;
  }

  const svc = createServiceClient();
  const { error } = await svc.from("products").update({
    slug: nextSlug,
    sector_id: input.sector_id,
    name: input.name,
    description: input.description,
    specs: input.specs,
    images: input.images,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_updated",
    entity_type: "product",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: {
      slug: nextSlug !== existing.slug ? { from: existing.slug, to: nextSlug } : undefined,
      name: input.name,
    },
  });

  revalidatePublicProducts();
  revalidatePath(`/admin/products/${id}/edit`);
  redirect("/admin/products?success=updated");
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/actions.ts
git commit -m "feat(admin/products): add updateProduct with opt-in slug_override + uniqueness check"
```

---

## Task 9: softDeleteProduct + restoreProduct

**Files:**
- Modify: `app/admin/products/actions.ts`

- [ ] **Step 1: Iki action ekle**

```ts
// app/admin/products/actions.ts içinde ekle
export async function softDeleteProduct(id: string): Promise<void> {
  const user = await requireAdminRole();
  const svc = createServiceClient();
  const { error } = await svc.from("products")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_soft_deleted",
    entity_type: "product",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { active: false },
  });

  revalidatePublicProducts();
  revalidatePath("/admin/products");
}

export async function restoreProduct(id: string): Promise<void> {
  const user = await requireAdminRole();
  const svc = createServiceClient();
  const { error } = await svc.from("products")
    .update({ active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "product_restored",
    entity_type: "product",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { active: true },
  });

  revalidatePublicProducts();
  revalidatePath("/admin/products");
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/actions.ts
git commit -m "feat(admin/products): add softDelete + restore actions"
```

---

## Task 10: cloneProduct server action (with Storage copy)

**Files:**
- Modify: `app/admin/products/actions.ts`

- [ ] **Step 1: cloneProduct ekle**

```ts
// app/admin/products/actions.ts içinde ekle
export async function cloneProduct(sourceId: string): Promise<void> {
  const user = await requireAdminRole();
  const svc = createServiceClient();

  const source = await getProductById(sourceId);
  if (!source) throw new Error("Kaynak ürün bulunamadı");

  const newSlug = await uniqueSlug(`${source.slug}-kopya`, (s) => slugExists(s));

  type ClonedImage = { path: string; order: number; alt_text: Record<string, string> };
  const cloned: ClonedImage[] = [];

  try {
    for (const img of source.images ?? []) {
      const newUuid = crypto.randomUUID();
      const ext = img.path.split(".").pop() || "jpg";
      const newPath = `${newSlug}/${newUuid}.${ext}`;
      const { error } = await svc.storage.from("product-images").copy(img.path, newPath);
      if (error) throw new Error(`storage.copy ${img.path} → ${newPath}: ${error.message}`);
      cloned.push({
        path: newPath,
        order: img.order,
        alt_text: img.alt_text ?? { tr: "", en: "", ru: "", ar: "" },
      });
    }

    const { data, error } = await svc.from("products").insert({
      slug: newSlug,
      sector_id: source.sector_id,
      name: source.name,
      description: source.description,
      specs: source.specs,
      images: cloned,
      active: true,
    }).select("id").single();
    if (error) throw new Error(error.message);

    await recordAudit({
      action: "product_cloned",
      entity_type: "product",
      entity_id: data.id,
      user_id: user.id,
      ip: null,
      diff: { source_id: sourceId, new_slug: newSlug, image_count: cloned.length },
    });

    revalidatePublicProducts();
    redirect(`/admin/products/${data.id}/edit?cloned=1`);
  } catch (err) {
    // Partial storage copy rollback: best-effort cleanup
    if (cloned.length > 0) {
      await svc.storage.from("product-images").remove(cloned.map((c) => c.path)).catch(() => {});
    }
    throw err;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/actions.ts
git commit -m "feat(admin/products): add cloneProduct with Storage.copy + rollback on failure"
```

---

## Task 11: SlugField component

**Files:**
- Create: `components/admin/products/SlugField.tsx`
- Test: `tests/unit/components/admin/products/SlugField.test.tsx`

- [ ] **Step 1: Failing test yaz**

```tsx
// tests/unit/components/admin/products/SlugField.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlugField } from "@/components/admin/products/SlugField";

describe("SlugField", () => {
  it("create mode'da readonly canlı preview gösterir", () => {
    render(<SlugField mode="create" initialSlug="" previewFromName="PET Kapak 28 mm" />);
    const input = screen.getByLabelText(/URL/i) as HTMLInputElement;
    expect(input.value).toBe("pet-kapak-28-mm");
    expect(input.readOnly).toBe(true);
  });

  it("edit mode default kilitli (readonly) + toggle kapalı", () => {
    render(<SlugField mode="edit" initialSlug="pet-kapak" />);
    const input = screen.getByLabelText(/URL/i) as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    expect(screen.queryByText(/URL değişir/i)).not.toBeInTheDocument();
  });

  it("edit mode'da toggle açılınca input editable + uyarı gösterilir", () => {
    render(<SlugField mode="edit" initialSlug="pet-kapak" />);
    fireEvent.click(screen.getByRole("button", { name: /slug'ı düzenle/i }));
    const input = screen.getByLabelText(/URL/i) as HTMLInputElement;
    expect(input.readOnly).toBe(false);
    expect(screen.getByText(/URL değişir/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/components/admin/products/SlugField.test.tsx`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: SlugField implement**

```tsx
// components/admin/products/SlugField.tsx
"use client";
import { useState } from "react";
import { slugify } from "@/lib/utils/slugify";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  initialSlug: string;
  previewFromName?: string;
  name?: string;
}

export function SlugField({ mode, initialSlug, previewFromName, name = "slug_override" }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState(initialSlug);

  const previewValue = mode === "create" && previewFromName ? slugify(previewFromName) : value;
  const editable = mode === "edit" && unlocked;

  return (
    <div className="space-y-1">
      <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text-secondary)]">
        URL (slug)
      </label>
      <div className="flex items-center gap-2">
        <input
          id="slug"
          name={editable ? name : undefined}
          type="text"
          value={editable ? value : previewValue}
          readOnly={!editable}
          onChange={(e) => setValue(slugify(e.target.value))}
          className="flex-1 rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 font-mono text-sm text-text-primary focus:border-[var(--color-accent-blue)] focus:outline-none"
          aria-label="URL slug"
        />
        {mode === "edit" && (
          <button
            type="button"
            onClick={() => setUnlocked((u) => !u)}
            className="text-xs font-medium text-[var(--color-accent-cobalt)] hover:underline"
          >
            {unlocked ? "İptal" : "Slug'ı düzenle"}
          </button>
        )}
      </div>
      {mode === "create" && (
        <p className="text-xs text-text-tertiary">
          URL otomatik üretiliyor: <span className="font-mono">/products/{previewValue || "…"}</span>
        </p>
      )}
      {editable && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          ⚠️ URL değişir, mevcut Google link'leri kırılır. Emin değilsen iptal et.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/components/admin/products/SlugField.test.tsx`
Expected: PASS (3 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add components/admin/products/SlugField.tsx tests/unit/components/admin/products/SlugField.test.tsx
git commit -m "feat(admin/products): add SlugField with opt-in edit toggle + warning"
```

---

## Task 12: SpecBuilder component

**Files:**
- Create: `components/admin/products/SpecBuilder.tsx`
- Test: `tests/unit/components/admin/products/SpecBuilder.test.tsx`

- [ ] **Step 1: Failing test yaz**

```tsx
// tests/unit/components/admin/products/SpecBuilder.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SpecBuilder } from "@/components/admin/products/SpecBuilder";

describe("SpecBuilder", () => {
  it("boş state: preset dropdown göster, satır yok", () => {
    render(<SpecBuilder value={[]} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /özellik ekle/i })).toBeInTheDocument();
    expect(screen.queryByRole("row")).not.toBeInTheDocument();
  });

  it("preset eklendikten sonra dropdown'da o preset disabled", () => {
    const onChange = vi.fn();
    render(<SpecBuilder value={[{ preset_id: "material", value: "PET" }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /özellik ekle/i }));
    const materialOpt = screen.getByRole("option", { name: /malzeme/i });
    expect(materialOpt).toBeDisabled();
  });

  it("silme butonu o satırı kaldırır", () => {
    const onChange = vi.fn();
    render(<SpecBuilder value={[{ preset_id: "material", value: "PET" }]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /sil/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("aşağı ok iki satırı swap eder", () => {
    const onChange = vi.fn();
    render(
      <SpecBuilder
        value={[
          { preset_id: "material", value: "PET" },
          { preset_id: "dimension", value: "28 mm" },
        ]}
        onChange={onChange}
      />,
    );
    const rows = screen.getAllByRole("row");
    fireEvent.click(within(rows[0]).getByRole("button", { name: /aşağı/i }));
    expect(onChange).toHaveBeenCalledWith([
      { preset_id: "dimension", value: "28 mm" },
      { preset_id: "material", value: "PET" },
    ]);
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm vitest run tests/unit/components/admin/products/SpecBuilder.test.tsx`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: SpecBuilder implement**

```tsx
// components/admin/products/SpecBuilder.tsx
"use client";
import { useState } from "react";
import { SPEC_PRESETS, type SpecPresetId, getPresetLabel } from "@/lib/admin/spec-presets";

export interface SpecRow {
  preset_id: SpecPresetId;
  value: string;
}

interface Props {
  value: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
}

export function SpecBuilder({ value, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const usedPresets = new Set(value.map((r) => r.preset_id));

  function updateRow(idx: number, patch: Partial<SpecRow>) {
    onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeRow(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function addPreset(id: SpecPresetId) {
    onChange([...value, { preset_id: id, value: "" }]);
    setPickerOpen(false);
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...value];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div role="table" aria-label="Teknik özellikler" className="space-y-1">
        {value.map((row, i) => (
          <div key={`${row.preset_id}-${i}`} role="row" className="flex items-center gap-2">
            <span className="w-32 text-sm text-[var(--color-text-secondary)]">
              {getPresetLabel(row.preset_id, "tr")}
            </span>
            <input
              type="text"
              value={row.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
              placeholder="Değer (örn. PET, 28 mm, 10.000 adet)"
              className="flex-1 rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-2 py-1 text-sm"
              aria-label={`${getPresetLabel(row.preset_id, "tr")} değeri`}
            />
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Aşağı taşı">↓</button>
            <button type="button" onClick={() => removeRow(i)} aria-label="Sil" className="text-[var(--color-accent-red)]">🗑</button>
          </div>
        ))}
      </div>

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          disabled={usedPresets.size >= SPEC_PRESETS.length}
          className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-sm font-medium hover:border-[var(--color-border-strong)]"
        >
          + Özellik Ekle
        </button>
        {pickerOpen && (
          <ul role="listbox" className="absolute z-10 mt-1 w-56 rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary p-1 shadow-lg">
            {SPEC_PRESETS.map((p) => {
              const disabled = usedPresets.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    role="option"
                    type="button"
                    onClick={() => addPreset(p.id)}
                    disabled={disabled}
                    aria-disabled={disabled}
                    className="flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-sm hover:bg-bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {p.labels.tr}
                    {disabled && <span className="text-xs text-text-tertiary">eklendi</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test geç**

Run: `pnpm vitest run tests/unit/components/admin/products/SpecBuilder.test.tsx`
Expected: PASS (4 testler yeşil)

- [ ] **Step 5: Commit**

```bash
git add components/admin/products/SpecBuilder.tsx tests/unit/components/admin/products/SpecBuilder.test.tsx
git commit -m "feat(admin/products): add SpecBuilder with preset-unique dropdown + up/down reorder"
```

---

## Task 13: ImageUploader component

**Files:**
- Create: `components/admin/products/ImageUploader.tsx`

- [ ] **Step 1: Component yaz**

```tsx
// components/admin/products/ImageUploader.tsx
"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export interface UploadedImage {
  path: string;
  order: number;
  alt_text: { tr: string; en: string; ru: string; ar: string };
}

interface Props {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  tempSlug: string;
  maxFiles?: number;
}

const BUCKET = "product-images";
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({ value, onChange, tempSlug, maxFiles = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function supa() {
    return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    setUploading(true);
    try {
      const added: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        if (value.length + added.length >= maxFiles) break;
        if (!ACCEPTED.includes(file.type)) {
          setError(`Desteklenmeyen format: ${file.type}`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`${file.name}: 10 MB üstü reddedildi`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const uuid = crypto.randomUUID();
        const path = `${tempSlug}/${uuid}.${ext}`;
        const { error: upErr } = await supa().storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600", contentType: file.type,
        });
        if (upErr) { setError(upErr.message); continue; }
        added.push({ path, order: 0, alt_text: { tr: "", en: "", ru: "", ar: "" } });
      }
      const merged = [...value, ...added].map((img, i) => ({ ...img, order: i }));
      onChange(merged);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx).map((img, i) => ({ ...img, order: i }));
    onChange(next);
  }
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next.map((img, i) => ({ ...img, order: i })));
  }

  const storageBase = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {value.map((img, i) => {
          const url = `${storageBase}/storage/v1/object/public/${BUCKET}/${img.path}`;
          return (
            <div key={img.path} className="relative aspect-square overflow-hidden rounded-sm border border-[var(--color-border-subtle-dark)]">
              <Image src={url} alt={`Görsel ${i + 1}`} fill className="object-cover" sizes="120px" unoptimized />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-1 py-0.5 text-xs text-white">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Öne al">◀</button>
                <span>{i === 0 ? "ANA" : i + 1}</span>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Sona al">▶</button>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                aria-label="Görseli kaldır"
              >
                ✕
              </button>
            </div>
          );
        })}
        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-sm border-2 border-dashed border-[var(--color-border-subtle-dark)] text-center text-xs text-text-secondary hover:border-[var(--color-border-strong)] disabled:opacity-50"
          >
            {uploading ? "Yükleniyor…" : "+ Ekle"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-sm text-[var(--color-accent-red)]">{error}</p>}
      <p className="mt-1 text-xs text-text-tertiary">
        Max {maxFiles} görsel × 10 MB. JPG/PNG/WebP. İlk görsel ana görseldir.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/admin/products/ImageUploader.tsx
git commit -m "feat(admin/products): add ImageUploader with Storage direct upload + reorder"
```

---

## Task 14: LocaleTabs component

**Files:**
- Create: `components/admin/products/LocaleTabs.tsx`

- [ ] **Step 1: Component yaz**

```tsx
// components/admin/products/LocaleTabs.tsx
"use client";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

const LOCALES: Locale[] = ["tr", "en", "ru", "ar"];
const LABELS: Record<Locale, string> = { tr: "TR", en: "EN", ru: "RU", ar: "AR" };

interface Props {
  active: Locale;
  filled: Record<Locale, boolean>;
  onSelect: (locale: Locale) => void;
}

export function LocaleTabs({ active, filled, onSelect }: Props) {
  return (
    <div role="tablist" aria-label="Dil sekmeleri" className="flex gap-1 border-b border-[var(--color-border-subtle-dark)]">
      {LOCALES.map((loc) => {
        const required = loc === "tr";
        const mark = filled[loc] ? "✓" : required ? "*" : "—";
        return (
          <button
            key={loc}
            type="button"
            role="tab"
            aria-selected={active === loc}
            onClick={() => onSelect(loc)}
            className={cn(
              "rounded-t-sm border-b-2 px-3 py-1.5 text-sm font-medium transition-colors",
              active === loc
                ? "border-[var(--color-accent-cobalt)] text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {LABELS[loc]} <span className="text-xs text-text-tertiary">{mark}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/admin/products/LocaleTabs.tsx
git commit -m "feat(admin/products): add LocaleTabs with filled-mark indicator"
```

---

## Task 15: ProductForm (compose client island) + SaveProgressModal

**Files:**
- Create: `components/admin/products/ProductForm.tsx`
- Create: `components/admin/products/SaveProgressModal.tsx`

- [ ] **Step 1: SaveProgressModal yaz**

```tsx
// components/admin/products/SaveProgressModal.tsx
"use client";
export function SaveProgressModal({ open, label = "Kaydediliyor..." }: { open: boolean; label?: string }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-md bg-bg-primary px-6 py-4 shadow-xl">
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ProductForm yaz**

```tsx
// components/admin/products/ProductForm.tsx
"use client";
import { useState, useTransition } from "react";
import type { Locale } from "@/i18n/routing";
import { LocaleTabs } from "./LocaleTabs";
import { SlugField } from "./SlugField";
import { SpecBuilder, type SpecRow } from "./SpecBuilder";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import { SaveProgressModal } from "./SaveProgressModal";

interface SectorOption { id: string; label: string }

interface InitialData {
  id?: string;
  slug?: string;
  sector_id: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  specs: SpecRow[];
  images: UploadedImage[];
}

interface Props {
  mode: "create" | "edit";
  sectors: SectorOption[];
  initial: InitialData;
  action: (formData: FormData) => Promise<void>;
}

const EMPTY_L10N: Record<Locale, string> = { tr: "", en: "", ru: "", ar: "" };

export function ProductForm({ mode, sectors, initial, action }: Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>("tr");
  const [name, setName] = useState<Record<Locale, string>>({ ...EMPTY_L10N, ...initial.name });
  const [description, setDescription] = useState<Record<Locale, string>>({ ...EMPTY_L10N, ...initial.description });
  const [sectorId, setSectorId] = useState(initial.sector_id);
  const [specs, setSpecs] = useState<SpecRow[]>(initial.specs);
  const [images, setImages] = useState<UploadedImage[]>(initial.images);
  const [pending, startTransition] = useTransition();

  const filled: Record<Locale, boolean> = {
    tr: name.tr.trim().length > 0,
    en: name.en.trim().length > 0,
    ru: name.ru.trim().length > 0,
    ar: name.ar.trim().length > 0,
  };

  const tempSlug = mode === "edit" && initial.slug
    ? initial.slug
    : `draft-${initial.id ?? "new"}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("sector_id", sectorId);
    fd.set("name", JSON.stringify(name));
    fd.set("description", JSON.stringify(description));
    fd.set("specs", JSON.stringify(specs));
    fd.set("images", JSON.stringify(images));

    const form = e.currentTarget;
    const slugOverride = (form.elements.namedItem("slug_override") as HTMLInputElement | null)?.value;
    if (slugOverride) fd.set("slug_override", slugOverride);

    startTransition(() => { void action(fd); });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="sector" className="block text-sm font-medium">Sektör *</label>
        <select
          id="sector" value={sectorId} onChange={(e) => setSectorId(e.target.value)} required
          className="mt-1 rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 text-sm"
        >
          <option value="">Seçiniz…</option>
          {sectors.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <LocaleTabs active={activeLocale} filled={filled} onSelect={setActiveLocale} />

      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Ürün Adı ({activeLocale.toUpperCase()}) {activeLocale === "tr" && "*"}
          </label>
          <input
            id="name"
            type="text"
            value={name[activeLocale]}
            onChange={(e) => setName({ ...name, [activeLocale]: e.target.value })}
            required={activeLocale === "tr"}
            className="mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Açıklama ({activeLocale.toUpperCase()}) {activeLocale === "tr" && "*"}
          </label>
          <textarea
            id="description" rows={5}
            value={description[activeLocale]}
            onChange={(e) => setDescription({ ...description, [activeLocale]: e.target.value })}
            required={activeLocale === "tr"}
            className="mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <SlugField mode={mode} initialSlug={initial.slug ?? ""} previewFromName={name.tr} />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Teknik Özellikler (dil-bağımsız)</h3>
        <SpecBuilder value={specs} onChange={setSpecs} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Görseller (ilk görsel ana görsel)</h3>
        <ImageUploader value={images} onChange={setImages} tempSlug={tempSlug} />
      </div>

      <div className="flex items-center justify-end gap-3">
        <a href="/admin/products" className="text-sm text-text-secondary hover:underline">İptal</a>
        <button
          type="submit" disabled={pending}
          className="rounded-sm bg-[var(--color-accent-cobalt)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          💾 {mode === "edit" ? "Değişiklikleri Kaydet" : "Kaydet ve Yayınla"}
        </button>
      </div>

      <SaveProgressModal open={pending} />
    </form>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/admin/products/ProductForm.tsx components/admin/products/SaveProgressModal.tsx
git commit -m "feat(admin/products): add ProductForm composing LocaleTabs/Slug/Spec/Image + save modal"
```

---

## Task 16: DeleteDialog + RestoreButton + CloneButton

**Files:**
- Create: `components/admin/products/DeleteDialog.tsx`
- Create: `components/admin/products/RestoreButton.tsx`
- Create: `components/admin/products/CloneButton.tsx`

- [ ] **Step 1: DeleteDialog yaz**

```tsx
// components/admin/products/DeleteDialog.tsx
"use client";
import { useState, useTransition } from "react";

export function DeleteDialog({ productName, action }: { productName: string; action: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Sil" className="text-[var(--color-accent-red)]">🗑</button>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-md bg-bg-primary p-5 shadow-xl">
            <h3 className="text-base font-semibold">Silmek istediğine emin misin?</h3>
            <p className="mt-2 text-sm text-text-secondary">
              "{productName}" ürünü Silinmiş tab'ına taşınacak. Daha sonra geri yükleyebilirsin.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="text-sm">İptal</button>
              <button
                type="button" disabled={pending}
                onClick={() => start(() => action().then(() => setOpen(false)))}
                className="rounded-sm bg-[var(--color-accent-red)] px-3 py-1.5 text-sm text-white disabled:opacity-60"
              >
                {pending ? "Siliniyor…" : "Evet, sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: RestoreButton + CloneButton yaz**

```tsx
// components/admin/products/RestoreButton.tsx
"use client";
import { useTransition } from "react";

export function RestoreButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button" disabled={pending}
      onClick={() => start(() => action())}
      className="text-sm font-medium text-[var(--color-accent-cobalt)] hover:underline disabled:opacity-50"
    >
      {pending ? "Geri yükleniyor…" : "Geri yükle"}
    </button>
  );
}
```

```tsx
// components/admin/products/CloneButton.tsx
"use client";
import { useTransition } from "react";

export function CloneButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button" disabled={pending}
      onClick={() => start(() => action())}
      className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-sm font-medium hover:border-[var(--color-border-strong)] disabled:opacity-50"
    >
      {pending ? "Kopyalanıyor…" : "Bu ürüne benzer yeni ekle"}
    </button>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/admin/products/DeleteDialog.tsx components/admin/products/RestoreButton.tsx components/admin/products/CloneButton.tsx
git commit -m "feat(admin/products): add Delete/Restore/Clone action buttons"
```

---

## Task 17: ProductList + ProductRow

**Files:**
- Create: `components/admin/products/ProductList.tsx`
- Create: `components/admin/products/ProductRow.tsx`

- [ ] **Step 1: ProductRow yaz**

```tsx
// components/admin/products/ProductRow.tsx
import Link from "next/link";
import Image from "next/image";
import type { ProductRow as ProductRowData } from "@/lib/admin/products";
import { DeleteDialog } from "./DeleteDialog";
import { RestoreButton } from "./RestoreButton";
import { env } from "@/lib/env";

interface Props {
  product: ProductRowData;
  sectorName: string | null;
  onDelete: () => Promise<void>;
  onRestore: () => Promise<void>;
}

export function ProductRow({ product, sectorName, onDelete, onRestore }: Props) {
  const thumb = product.images?.[0]?.path;
  const url = thumb
    ? `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images/${thumb}`
    : null;
  const filledBadges = (["tr", "en", "ru", "ar"] as const)
    .filter((l) => (product.name as Record<string, string>)[l]?.trim())
    .map((l) => l.toUpperCase()).join(" · ");

  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border-hairline)] py-2">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-bg-secondary">
        {url ? <Image src={url} alt="" fill className="object-cover" sizes="40px" unoptimized /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{product.name.tr || "(isimsiz)"}</div>
        <div className="text-xs text-text-tertiary">
          {sectorName ?? "—"} · <span className="font-mono">{filledBadges}</span>
        </div>
      </div>
      <Link href={`/admin/products/${product.id}/edit`} className="text-sm font-medium text-[var(--color-accent-cobalt)] hover:underline">
        Düzenle
      </Link>
      {product.active
        ? <DeleteDialog productName={product.name.tr || product.slug} action={onDelete} />
        : <RestoreButton action={onRestore} />}
    </div>
  );
}
```

- [ ] **Step 2: ProductList yaz**

```tsx
// components/admin/products/ProductList.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import type { ProductRow as ProductRowData } from "@/lib/admin/products";
import { ProductRow } from "./ProductRow";

interface SectorMap { [id: string]: string }

interface Props {
  activeProducts: ProductRowData[];
  deletedProducts: ProductRowData[];
  sectors: SectorMap;
  softDelete: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
}

export function ProductList({ activeProducts, deletedProducts, sectors, softDelete, restore }: Props) {
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const [search, setSearch] = useState("");

  const source = tab === "active" ? activeProducts : deletedProducts;
  const filtered = search.trim()
    ? source.filter((p) =>
        (p.name.tr ?? "").toLowerCase().includes(search.trim().toLowerCase()) ||
        p.slug.includes(search.trim().toLowerCase()))
    : source;

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ürünler</h1>
        <Link href="/admin/products/new"
          className="rounded-sm bg-[var(--color-accent-cobalt)] px-3 py-1.5 text-sm font-medium text-white">
          + Yeni Ürün Ekle
        </Link>
      </header>

      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={() => setTab("active")}
          className={`rounded-sm px-3 py-1 text-sm ${tab === "active" ? "bg-bg-secondary font-medium" : "text-text-secondary"}`}>
          Yayında ({activeProducts.length})
        </button>
        <button type="button" onClick={() => setTab("deleted")}
          className={`rounded-sm px-3 py-1 text-sm ${tab === "deleted" ? "bg-bg-secondary font-medium" : "text-text-secondary"}`}>
          Silinmiş ({deletedProducts.length})
        </button>
        <input
          type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Ürün adı veya slug"
          className="ml-auto w-64 rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-2 py-1 text-sm"
        />
      </div>

      <div>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-text-tertiary">Ürün yok.</p>}
        {filtered.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            sectorName={p.sector_id ? sectors[p.sector_id] ?? null : null}
            onDelete={() => softDelete(p.id)}
            onRestore={() => restore(p.id)}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/admin/products/ProductList.tsx components/admin/products/ProductRow.tsx
git commit -m "feat(admin/products): add ProductList + ProductRow with tabs & search"
```

---

## Task 18: /admin/products page.tsx (RSC list) + Shell nav güncelle

**Files:**
- Create: `app/admin/products/page.tsx`
- Modify: `components/admin/Shell.tsx`

- [ ] **Step 1: Shell nav'a "Ürünler" ekle**

`components/admin/Shell.tsx`'de iki değişiklik yap:

1. `active` prop type'ını `"inbox" | "bildirimler"` → `"inbox" | "products" | "bildirimler"` yap.
2. Nav kısmında mevcut 2 `<NavLink>` arasına (inbox ve bildirimler arasına) ekle:

```tsx
<NavLink href="/admin/products" active={active === "products"}>
  Ürünler
</NavLink>
```

Mevcut `/admin/inbox` ve `/admin/settings/notifications` sayfalarında `active` prop'u değişmez (geriye uyumlu).

- [ ] **Step 2: List RSC page yaz**

```tsx
// app/admin/products/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ProductList } from "@/components/admin/products/ProductList";
import { listProducts } from "@/lib/admin/products";
import { createServiceClient } from "@/lib/supabase/service";
import { softDeleteProduct, restoreProduct } from "./actions";

async function loadSectors(): Promise<Record<string, string>> {
  const svc = createServiceClient();
  const { data, error } = await svc.from("sectors").select("id, name");
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const name = (row.name as Record<string, string>)?.tr ?? "";
    map[row.id] = name;
  }
  return map;
}

export default async function AdminProductsPage() {
  const user = await requireAdmin();
  const [active, deleted, sectors] = await Promise.all([
    listProducts({ active: true }),
    listProducts({ active: false }),
    loadSectors(),
  ]);

  async function softDelete(id: string) { "use server"; await softDeleteProduct(id); }
  async function restore(id: string) { "use server"; await restoreProduct(id); }

  return (
    <Shell user={user} active="products">
      <ProductList
        activeProducts={active}
        deletedProducts={deleted}
        sectors={sectors}
        softDelete={softDelete}
        restore={restore}
      />
    </Shell>
  );
}
```

- [ ] **Step 3: Typecheck + build**

Run: `pnpm typecheck && pnpm build 2>&1 | tail -20`
Expected: build başarılı, `/admin/products` route listelenir, hata yok

- [ ] **Step 4: Commit**

```bash
git add app/admin/products/page.tsx components/admin/Shell.tsx
git commit -m "feat(admin/products): add list page + Shell nav Ürünler link"
```

---

## Task 19: /admin/products/new + [id]/edit pages

**Files:**
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/edit/page.tsx`

- [ ] **Step 1: new/page.tsx yaz**

```tsx
// app/admin/products/new/page.tsx
import { requireAdminRole } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { createServiceClient } from "@/lib/supabase/service";
import { createProduct } from "../actions";

async function loadSectorOptions() {
  const svc = createServiceClient();
  const { data, error } = await svc.from("sectors")
    .select("id, name, active").eq("active", true).order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    label: (s.name as Record<string, string>)?.tr ?? s.id,
  }));
}

export default async function NewProductPage() {
  const user = await requireAdminRole();
  const sectors = await loadSectorOptions();

  async function submit(fd: FormData) { "use server"; await createProduct(fd); }

  return (
    <Shell user={user} active="products">
      <h1 className="mb-4 text-xl font-semibold">Yeni Ürün</h1>
      <ProductForm
        mode="create"
        sectors={sectors}
        initial={{
          sector_id: "",
          name: { tr: "", en: "", ru: "", ar: "" },
          description: { tr: "", en: "", ru: "", ar: "" },
          specs: [],
          images: [],
        }}
        action={submit}
      />
    </Shell>
  );
}
```

- [ ] **Step 2: [id]/edit/page.tsx yaz**

```tsx
// app/admin/products/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAdminRole } from "@/lib/admin/auth";
import { Shell } from "@/components/admin/Shell";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { CloneButton } from "@/components/admin/products/CloneButton";
import { getProductById } from "@/lib/admin/products";
import { createServiceClient } from "@/lib/supabase/service";
import { updateProduct, cloneProduct } from "../../actions";

interface PageProps { params: Promise<{ id: string }> }

async function loadSectorOptions() {
  const svc = createServiceClient();
  const { data, error } = await svc.from("sectors")
    .select("id, name, active").order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    id: s.id,
    label: (s.name as Record<string, string>)?.tr ?? s.id,
  }));
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAdminRole();
  const [product, sectors] = await Promise.all([getProductById(id), loadSectorOptions()]);
  if (!product) notFound();

  async function submit(fd: FormData) { "use server"; await updateProduct(id, fd); }
  async function clone() { "use server"; await cloneProduct(id); }

  return (
    <Shell user={user} active="products">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Düzenle: {product.name.tr || product.slug}</h1>
        <CloneButton action={clone} />
      </div>
      <ProductForm
        mode="edit"
        sectors={sectors}
        initial={{
          id: product.id,
          slug: product.slug,
          sector_id: product.sector_id ?? "",
          name: { tr: "", en: "", ru: "", ar: "", ...product.name },
          description: { tr: "", en: "", ru: "", ar: "", ...product.description },
          specs: product.specs ?? [],
          images: product.images ?? [],
        }}
        action={submit}
      />
    </Shell>
  );
}
```

- [ ] **Step 3: Build doğrula**

Run: `pnpm build 2>&1 | grep -E "Route|/admin" | head -20`
Expected: `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit` route'ları listelenir

- [ ] **Step 4: Commit**

```bash
git add 'app/admin/products/new/page.tsx' 'app/admin/products/[id]/edit/page.tsx'
git commit -m "feat(admin/products): add new + edit pages with ProductForm + CloneButton"
```

---

## Task 20: Public ProductCard + ProductGrid

**Files:**
- Create: `components/public/products/ProductCard.tsx`
- Create: `components/public/products/ProductGrid.tsx`

- [ ] **Step 1: ProductCard yaz**

```tsx
// components/public/products/ProductCard.tsx
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { getImageAltText } from "@/lib/products/alt-text";

export interface PublicProduct {
  slug: string;
  sector_label?: string | null;
  name: Record<Locale, string>;
  images: Array<{ path: string; order: number; alt_text: Record<Locale, string> }>;
}

interface Props {
  product: PublicProduct;
  locale: Locale;
  imageLabel: string;
}

export function ProductCard({ product, locale, imageLabel }: Props) {
  const first = product.images?.[0];
  const url = first
    ? `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images/${first.path}`
    : null;
  const alt = first ? getImageAltText({ name: product.name, locale, order: 0, imageLabel }) : "";

  return (
    <Link href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-md border border-[var(--color-border-subtle-dark)] bg-bg-primary transition hover:border-[var(--color-accent-cobalt)]">
      <div className="relative aspect-[4/3] bg-bg-secondary">
        {url && <Image src={url} alt={alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" unoptimized />}
      </div>
      <div className="p-4">
        {product.sector_label && <p className="text-xs uppercase tracking-wide text-text-tertiary">{product.sector_label}</p>}
        <h3 className="mt-1 font-medium text-text-primary">{product.name[locale]}</h3>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: ProductGrid yaz**

```tsx
// components/public/products/ProductGrid.tsx
import type { Locale } from "@/i18n/routing";
import { ProductCard, type PublicProduct } from "./ProductCard";

interface Props {
  products: PublicProduct[];
  locale: Locale;
  imageLabel: string;
}

export function ProductGrid({ products, locale, imageLabel }: Props) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-text-secondary">Henüz yayında ürün yok.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} locale={locale} imageLabel={imageLabel} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/public/products/ProductCard.tsx components/public/products/ProductGrid.tsx
git commit -m "feat(public/products): add ProductCard + ProductGrid with alt-text fallback"
```

---

## Task 21: ProductGallery + ProductSpecTable + ProductDetail

**Files:**
- Create: `components/public/products/ProductGallery.tsx`
- Create: `components/public/products/ProductSpecTable.tsx`
- Create: `components/public/products/ProductDetail.tsx`

- [ ] **Step 1: ProductGallery yaz**

```tsx
// components/public/products/ProductGallery.tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { getImageAltText } from "@/lib/products/alt-text";

interface Img { path: string; order: number; alt_text: Record<Locale, string> }

interface Props {
  images: Img[];
  name: Record<Locale, string>;
  locale: Locale;
  imageLabel: string;
}

export function ProductGallery({ images, name, locale, imageLabel }: Props) {
  const [active, setActive] = useState(0);
  const base = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images`;
  if (images.length === 0) return null;
  const main = images[active] ?? images[0];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-border-subtle-dark)]">
        <Image
          src={`${base}/${main.path}`}
          alt={getImageAltText({ name, locale, order: main.order, imageLabel })}
          fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" unoptimized
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2">
          {images.map((img, i) => (
            <button key={img.path} type="button" onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 ${i === active ? "border-[var(--color-accent-cobalt)]" : "border-transparent"}`}
              aria-label={`Galeri ${i + 1}`}>
              <Image src={`${base}/${img.path}`} alt="" fill className="object-cover" sizes="64px" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: ProductSpecTable yaz**

```tsx
// components/public/products/ProductSpecTable.tsx
import type { Locale } from "@/i18n/routing";
import { getPresetLabel, type SpecPresetId } from "@/lib/admin/spec-presets";

interface Spec { preset_id: string; value: string }

export function ProductSpecTable({ specs, locale }: { specs: Spec[]; locale: Locale }) {
  if (specs.length === 0) return null;
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {specs.map((s, i) => (
          <tr key={i} className="border-b border-[var(--color-border-hairline)]">
            <th className="w-1/3 py-2 pr-3 text-left font-medium text-text-secondary">
              {getPresetLabel(s.preset_id as SpecPresetId, locale)}
            </th>
            <td className="py-2 text-text-primary">{s.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: ProductDetail yaz (güvenli JSON-LD inject — Task 2'deki helper'ı kullanır)**

```tsx
// components/public/products/ProductDetail.tsx
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ProductGallery } from "./ProductGallery";
import { ProductSpecTable } from "./ProductSpecTable";
import { env } from "@/lib/env";
import { toSafeLdJson } from "@/lib/products/json-ld";

interface Product {
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  images: Array<{ path: string; order: number; alt_text: Record<Locale, string> }>;
  specs: Array<{ preset_id: string; value: string }>;
}

interface Props {
  product: Product;
  locale: Locale;
  ctaLabel: string;
  imageLabel: string;
}

export function ProductDetail({ product, locale, ctaLabel, imageLabel }: Props) {
  const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com").replace(/\/$/, "");
  const imageBase = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description: product.description[locale] || undefined,
    image: product.images.map((i) => `${imageBase}/${i.path}`),
    sku: product.slug,
    brand: { "@type": "Brand", name: "Kıta Plastik" },
    url: `${siteUrl}/${locale}/products/${product.slug}`,
  };

  // JSON-LD: JSON.stringify içerik HTML context'ine girdiği için toSafeLdJson ile </script, <!-- ve U+2028/9 escape edilir
  return (
    <article className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <ProductGallery images={product.images} name={product.name} locale={locale} imageLabel={imageLabel} />
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">{product.name[locale]}</h1>
        {product.description[locale] && (
          <p className="mt-4 whitespace-pre-line text-text-secondary">{product.description[locale]}</p>
        )}
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-tertiary">Teknik Özellikler</h2>
          <ProductSpecTable specs={product.specs} locale={locale} />
        </div>
        <Link
          href={{ pathname: "/request-quote/standart", query: { product: product.slug } }}
          className="mt-8 inline-block rounded-sm bg-[var(--color-accent-red)] px-6 py-3 font-medium text-white hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      </div>
      <script
        type="application/ld+json"
        // toSafeLdJson tüm HTML-sensitive karakterleri \uXXXX'e çevirir; XSS-safe
        dangerouslySetInnerHTML={{ __html: toSafeLdJson(schema) }}
      />
    </article>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/public/products/ProductGallery.tsx components/public/products/ProductSpecTable.tsx components/public/products/ProductDetail.tsx
git commit -m "feat(public/products): add Gallery + SpecTable + Detail w/ safe Schema.org JSON-LD"
```

---

## Task 22: /[locale]/products/page.tsx — placeholder silinir

**Files:**
- Modify: `app/[locale]/products/page.tsx`

- [ ] **Step 1: Placeholder'ı gerçek grid ile değiştir**

```tsx
// app/[locale]/products/page.tsx — mevcut içeriği tamamen değiştir
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { ProductGrid, type PublicProduct } from "@/components/public/products/ProductGrid";
import { createServiceClient } from "@/lib/supabase/service";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.products.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/products`,
      languages: buildAlternates("/products", origin).languages,
    },
  };
}

async function loadLocalizedProducts(locale: Locale): Promise<PublicProduct[]> {
  const svc = createServiceClient();
  const nameKey = `name->>${locale}`;
  const { data, error } = await svc.from("products")
    .select("slug, sector_id, name, images, display_order")
    .eq("active", true)
    .not(nameKey, "is", null)
    .neq(nameKey, "")
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);

  const sectorIds = Array.from(new Set((data ?? []).map((p) => p.sector_id).filter(Boolean))) as string[];
  const sectorMap: Record<string, string> = {};
  if (sectorIds.length > 0) {
    const { data: sd } = await svc.from("sectors").select("id, name").in("id", sectorIds);
    for (const s of sd ?? []) {
      sectorMap[s.id] =
        (s.name as Record<string, string>)?.[locale] ??
        (s.name as Record<string, string>)?.tr ??
        s.id;
    }
  }

  return (data ?? []).map((p) => ({
    slug: p.slug,
    sector_label: p.sector_id ? sectorMap[p.sector_id] ?? null : null,
    name: p.name as Record<Locale, string>,
    images: (p.images as PublicProduct["images"]) ?? [],
  }));
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [tHero, tCommon, products] = await Promise.all([
    getTranslations({ locale, namespace: "pages.products.hero" }),
    getTranslations({ locale, namespace: "common" }),
    loadLocalizedProducts(locale),
  ]);
  const imageLabel = tCommon("productImageLabel");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{tHero("eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {tHero("title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{tHero("subtitle")}</p>
      </header>
      <div className="mt-12">
        <ProductGrid products={products} locale={locale} imageLabel={imageLabel} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build doğrula**

Run: `pnpm build 2>&1 | tail -20`
Expected: build başarılı, 4 locale'de `/products` derlenir

- [ ] **Step 3: Commit**

```bash
git add 'app/[locale]/products/page.tsx'
git commit -m "feat(public/products): replace placeholder with locale-filtered grid"
```

---

## Task 23: /[locale]/products/[slug]/page.tsx (detail)

**Files:**
- Create: `app/[locale]/products/[slug]/page.tsx`

- [ ] **Step 1: Detail sayfası yaz**

```tsx
// app/[locale]/products/[slug]/page.tsx
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { ProductDetail } from "@/components/public/products/ProductDetail";

interface PageProps { params: Promise<{ locale: Locale; slug: string }> }

async function loadProduct(locale: Locale, slug: string) {
  const svc = createServiceClient();
  const nameKey = `name->>${locale}`;
  const { data, error } = await svc.from("products")
    .select("slug, name, description, images, specs, active")
    .eq("slug", slug).eq("active", true)
    .not(nameKey, "is", null).neq(nameKey, "")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await loadProduct(locale, slug);
  if (!product) return { title: "Ürün bulunamadı" };
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const name = (product.name as Record<string, string>)[locale];
  const description = (product.description as Record<string, string>)?.[locale];
  return {
    title: `${name} | Kıta Plastik`,
    description: description?.slice(0, 160),
    alternates: {
      canonical: `${origin}/${locale}/products/${slug}`,
      languages: buildAlternates(`/products/${slug}`, origin).languages,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const product = await loadProduct(locale, slug);
  if (!product) notFound();

  const [tCta, tCommon] = await Promise.all([
    getTranslations({ locale, namespace: "common.cta" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <ProductDetail
        product={{
          slug: product.slug,
          name: product.name as Record<Locale, string>,
          description: (product.description as Record<Locale, string>) ?? { tr: "", en: "", ru: "", ar: "" },
          images: (product.images as any) ?? [],
          specs: (product.specs as any) ?? [],
        }}
        locale={locale}
        ctaLabel={tCta("requestQuote")}
        imageLabel={tCommon("productImageLabel")}
      />
    </section>
  );
}
```

- [ ] **Step 2: Build doğrula**

Run: `pnpm build 2>&1 | tail -20`
Expected: build başarılı; dinamik route derlenir.

- [ ] **Step 3: Commit**

```bash
git add 'app/[locale]/products/[slug]/page.tsx'
git commit -m "feat(public/products): add detail page w/ Schema.org + locale filter + 404 fallback"
```

---

## Task 24: ProductPicker — catalog autocomplete + empty state

**Files:**
- Modify: `components/rfq/ProductPicker.tsx`
- Modify: `components/rfq/StandartRfqForm.tsx`

- [ ] **Step 1: ProductPicker rewrite**

```tsx
// components/rfq/ProductPicker.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

export interface ItemRow {
  productSlug: string;
  productName: string;
  variant: string;
  qty: number;
}

interface Props {
  value: ItemRow[];
  onChange: (rows: ItemRow[]) => void;
  locale: Locale;
  maxItems?: number;
}

interface Suggestion { slug: string; nameLocalized: string }

function useSupabase() {
  const ref = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  if (!ref.current) ref.current = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return ref.current;
}

function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setV(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return v;
}

export function ProductPicker({ value, onChange, locale, maxItems = 20 }: Props) {
  const canAdd = value.length < maxItems;

  function update(i: number, patch: Partial<ItemRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { productSlug: "", productName: "", variant: "", qty: 100 }]);
  }

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <Row key={i} row={row} locale={locale}
          onChange={(patch) => update(i, patch)} onRemove={() => remove(i)} />
      ))}
      {canAdd && (
        <button type="button" onClick={add}
          className="text-sm font-medium text-[var(--color-accent-cobalt)] hover:underline">
          + Ürün Ekle
        </button>
      )}
    </div>
  );
}

function Row({ row, locale, onChange, onRemove }: {
  row: ItemRow; locale: Locale;
  onChange: (patch: Partial<ItemRow>) => void; onRemove: () => void;
}) {
  const [query, setQuery] = useState(row.productName);
  const debounced = useDebounced(query, 200);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [searched, setSearched] = useState(false);
  const supa = useSupabase();

  useEffect(() => {
    let cancelled = false;
    if (!debounced.trim()) { setSuggestions(null); setSearched(false); return; }
    (async () => {
      const nameKey = `name->>${locale}`;
      const { data } = await supa.from("products")
        .select(`slug, name`).eq("active", true)
        .not(nameKey, "is", null).neq(nameKey, "")
        .ilike(nameKey, `%${debounced.trim()}%`).limit(8);
      if (cancelled) return;
      setSuggestions((data ?? []).map((p) => ({
        slug: p.slug,
        nameLocalized: (p.name as Record<string, string>)[locale] ?? p.slug,
      })));
      setSearched(true);
    })();
    return () => { cancelled = true; };
  }, [debounced, locale, supa]);

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-2 py-1.5 text-sm text-text-primary",
    "focus:border-[var(--color-accent-blue)] focus:outline-none",
  );

  return (
    <div className="rounded-sm border border-[var(--color-border-subtle-dark)] p-3">
      <div className="relative">
        <input
          type="text" value={row.productName || query}
          onChange={(e) => { setQuery(e.target.value); onChange({ productName: e.target.value, productSlug: "" }); }}
          placeholder="Ürün adı ara…"
          className={inputClass} aria-label="Ürün ara" aria-autocomplete="list"
        />
        {suggestions && suggestions.length > 0 && (
          <ul role="listbox" className="absolute z-10 mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary shadow-md">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <button type="button"
                  onClick={() => { onChange({ productSlug: s.slug, productName: s.nameLocalized }); setQuery(s.nameLocalized); setSuggestions(null); }}
                  className="block w-full px-2 py-1 text-left text-sm hover:bg-bg-secondary/60">
                  {s.nameLocalized}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searched && suggestions && suggestions.length === 0 && (
          <p className="mt-2 text-sm text-text-secondary">
            Aradığınız ürün listede yok mu?{" "}
            <Link href="/request-quote/ozel-uretim" className="text-[var(--color-accent-cobalt)] hover:underline">
              Özel üretim talep formundan
            </Link>{" "}
            detaylı talep oluşturun.
          </p>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input type="text" value={row.variant} onChange={(e) => onChange({ variant: e.target.value })}
          placeholder="Varyant / renk / not" className={inputClass} aria-label="Varyant" />
        <input type="number" min={1} value={row.qty}
          onChange={(e) => onChange({ qty: Math.max(1, Number(e.target.value) || 0) })}
          placeholder="Miktar" className={inputClass} aria-label="Miktar" />
      </div>
      <button type="button" onClick={onRemove}
        className="mt-2 text-xs text-[var(--color-accent-red)] hover:underline">Sil</button>
    </div>
  );
}
```

- [ ] **Step 2: `StandartRfqForm.tsx`'de locale prop'unu ProductPicker'a geçir**

`components/rfq/StandartRfqForm.tsx` içinde mevcut `<ProductPicker value={items} onChange={setItems} />` çağrısını şu hale getir:

```tsx
<ProductPicker value={items} onChange={setItems} locale={locale} />
```

`locale` prop'u form zaten parent'tan alır (mevcut kodda kontrol et — prop veya `useLocale()` hook ile). Eğer yoksa, `import { useLocale } from "next-intl"` ekle ve `const locale = useLocale() as Locale;` tanımla.

Payload'da sadece `productSlug`, `variant`, `qty` gönderilmeli — `productName` sadece UI display için. `lib/validation/rfq.ts` schema'sında değişiklik yok (mevcut `productSlug` alanını kullanmaya devam eder).

- [ ] **Step 3: Typecheck + build**

Run: `pnpm typecheck && pnpm build 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/rfq/ProductPicker.tsx components/rfq/StandartRfqForm.tsx
git commit -m "feat(rfq): catalog autocomplete ProductPicker + empty-state özel üretim link"
```

---

## Task 25: Playwright programmatic admin login helper

**Files:**
- Create: `tests/e2e/helpers/admin-login.ts`

- [ ] **Step 1: Helper yaz**

```ts
// tests/e2e/helpers/admin-login.ts
import type { Page, BrowserContext } from "@playwright/test";

interface LoginArgs {
  page: Page;
  context: BrowserContext;
}

/**
 * Admin giriş akışı: ADMIN_EMAIL + ADMIN_PASSWORD env'leri varsa form doldurup
 * submit eder; /admin/inbox veya /admin/products'a redirect olana kadar bekler.
 * Gerçek Supabase creds yoksa test.skip kullan.
 */
export async function loginAsAdmin({ page }: LoginArgs): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL/ADMIN_PASSWORD gerekli");

  await page.goto("/admin/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL(/\/admin\/(inbox|products)/, { timeout: 10_000 }),
    page.click('button[type="submit"]'),
  ]);
}

export function hasAdminCreds(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers/admin-login.ts
git commit -m "test(e2e): add programmatic admin login helper"
```

---

## Task 26: E2E admin CRUD specs

**Files:**
- Create: `tests/e2e/admin-product-create.spec.ts`
- Create: `tests/e2e/admin-product-edit.spec.ts`
- Create: `tests/e2e/admin-product-clone.spec.ts`
- Create: `tests/e2e/admin-product-delete-restore.spec.ts`

- [ ] **Step 1: create spec**

```ts
// tests/e2e/admin-product-create.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "ADMIN_EMAIL/ADMIN_PASSWORD gerekli");

test("admin can create a product with TR-only content", async ({ page, context }) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products/new");
  await page.selectOption('select[id="sector"]', { index: 1 });
  await page.fill('input[id="name"]', `E2E Test Ürün ${Date.now()}`);
  await page.fill('textarea[id="description"]', "E2E açıklama");
  await page.click("text=+ Özellik Ekle");
  await page.click('role=option[name=/malzeme/i]');
  await page.fill('input[aria-label="Malzeme değeri"]', "PET");
  await page.click('button:has-text("Kaydet ve Yayınla")');
  await expect(page).toHaveURL(/\/admin\/products\?success=created/);
});
```

- [ ] **Step 2: edit spec — slug toggle + stability**

```ts
// tests/e2e/admin-product-edit.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "creds gerekli");

test("slug edit form'da default kilitli + toggle ile açılır + uyarı görünür", async ({ page, context }) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products");
  await page.click('text=Düzenle');
  const slugInput = page.locator('input[id="slug"]');
  await expect(slugInput).toHaveAttribute("readonly", "");
  await page.click('button:has-text("Slug\'ı düzenle")');
  await expect(slugInput).not.toHaveAttribute("readonly", "");
  await expect(page.locator('text=URL değişir')).toBeVisible();
});
```

- [ ] **Step 3: clone spec**

```ts
// tests/e2e/admin-product-clone.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "creds gerekli");

test("clone: yeni ürün edit mode'da açılır, metin+görsel kopyalanmıştır", async ({ page, context }) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products");
  const firstRow = page.locator('div').filter({ hasText: /Düzenle/ }).first();
  await firstRow.locator('text=Düzenle').click();
  await page.click('button:has-text("Bu ürüne benzer yeni ekle")');
  await expect(page).toHaveURL(/\/admin\/products\/[^/]+\/edit\?cloned=1/);
  // Slug -kopya suffix ile üretilmiş olmalı
  await expect(page.locator('input[id="slug"]')).toHaveValue(/-kopya(-\d+)?$/);
});
```

- [ ] **Step 4: delete-restore spec**

```ts
// tests/e2e/admin-product-delete-restore.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "creds gerekli");

test("soft delete → Silinmiş tab → restore → Yayında tab", async ({ page, context }) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products");
  const activeLabel = page.locator('button:has-text("Yayında")');
  const beforeText = await activeLabel.textContent();
  await page.locator('button[aria-label="Sil"]').first().click();
  await page.click('button:has-text("Evet, sil")');
  await page.click('button:has-text("Silinmiş")');
  await page.locator('text=Geri yükle').first().click();
  await page.click('button:has-text("Yayında")');
  const afterText = await activeLabel.textContent();
  expect(afterText).toBe(beforeText);
});
```

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/admin-product-create.spec.ts tests/e2e/admin-product-edit.spec.ts tests/e2e/admin-product-clone.spec.ts tests/e2e/admin-product-delete-restore.spec.ts
git commit -m "test(e2e): admin product create/edit/clone/delete-restore specs"
```

---

## Task 27: E2E public + RFQ specs

**Files:**
- Create: `tests/e2e/public-products-grid.spec.ts`
- Create: `tests/e2e/public-product-detail.spec.ts`
- Create: `tests/e2e/rfq-product-picker.spec.ts`

- [ ] **Step 1: grid spec**

```ts
// tests/e2e/public-products-grid.spec.ts
import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"),
);
test.skip(!hasSupabase, "gerçek Supabase gerekli");

const LOCALES = ["tr", "en", "ru", "ar"] as const;

for (const loc of LOCALES) {
  test(`/${loc}/products 200 döner ve grid veya boş state render eder`, async ({ page }) => {
    const res = await page.goto(`/${loc}/products`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
}
```

- [ ] **Step 2: detail spec — alt text + Schema.org**

```ts
// tests/e2e/public-product-detail.spec.ts
import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"),
);
test.skip(!hasSupabase, "gerçek Supabase gerekli");

test("ürün detay: Schema.org Product + alt text auto-fallback", async ({ page }) => {
  await page.goto("/tr/products");
  const firstCard = page.locator("a[href*='/products/']").first();
  const cardCount = await firstCard.count();
  if (cardCount === 0) test.skip(true, "canlıda ürün yok");
  await firstCard.click();

  const ldJson = await page.locator('script[type="application/ld+json"]').textContent();
  expect(ldJson).toContain('"@type":"Product"');

  const h1 = await page.locator("h1").textContent();
  if (h1) {
    const mainAlt = await page.locator("article img").first().getAttribute("alt");
    expect(mainAlt).toContain(h1.trim());
  }
});
```

- [ ] **Step 3: RFQ picker empty state spec**

```ts
// tests/e2e/rfq-product-picker.spec.ts
import { test, expect } from "@playwright/test";

test("standart RFQ ürün picker: aranan yok → özel üretim formuna link gösterir", async ({ page }) => {
  await page.goto("/tr/request-quote/standart");
  await page.click("text=+ Ürün Ekle");
  await page.fill('input[aria-label="Ürün ara"]', "bu-urun-kesin-yoktur-" + Date.now());
  await expect(page.locator("text=Özel üretim talep formundan")).toBeVisible();
  const link = page.locator('a:has-text("Özel üretim talep formundan")');
  await expect(link).toHaveAttribute("href", /\/request-quote\/ozel-uretim|\/teklif-iste\/ozel-uretim/);
});
```

- [ ] **Step 4: Local smoke (opsiyonel)**

Run (dev server ayrı terminalde): `pnpm exec playwright test tests/e2e/public-products-grid.spec.ts tests/e2e/rfq-product-picker.spec.ts --project=chromium --reporter=list`
Expected: admin-auth gerektirmeyen public specs geçer; yoksa test.skip (Supabase placeholder).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/public-products-grid.spec.ts tests/e2e/public-product-detail.spec.ts tests/e2e/rfq-product-picker.spec.ts
git commit -m "test(e2e): public grid + detail + RFQ picker empty-state specs"
```

---

## Task 28: Deploy + canlı smoke

**Files:** _(no file change — verification only)_

- [ ] **Step 1: Full local green doğrula**

Run: `pnpm typecheck && pnpm vitest run && pnpm lint && pnpm build`
Expected: hepsi yeşil. Build şu route'ları listelemeli:
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]/edit`
- `/[locale]/products` (4 locale)
- `/[locale]/products/[slug]` (dynamic)

- [ ] **Step 2: Push**

```bash
git push origin main
```

Beklenen: GitHub Actions CI yeşil → `workflow_run` → Coolify auto-deploy tetiklenir → ~2-3 dakikada canlı.

- [ ] **Step 3: Canlı smoke — admin (gerçek creds ile)**

1. `https://kitaplastik.com/admin/login` → giriş yap
2. Nav'da **Ürünler** linki görünür
3. `/admin/products` → boş liste (veya mevcut seed) + **+ Yeni Ürün Ekle**
4. Yeni Ürün: sektör seç, TR ad "Smoke Test 1", TR açıklama, 1 spec (Malzeme=PET), 1 görsel upload → Kaydet
5. Liste'de görünür, `/tr/products`'ta da görünür, detay açılır, Schema.org Product LD-JSON kaynak kodunda var (View Source → `application/ld+json`)
6. Düzenle → EN tab, EN ad/açıklama doldur, Kaydet → `/en/products`'ta artık görünür; `/ru/products` + `/ar/products`'ta hâlâ görünmez ("boşsa gösterme")
7. "Bu ürüne benzer yeni ekle" → yeni edit mode açılır, görseller dolu, slug `smoke-test-1-kopya`
8. Düzenle → "Slug'ı düzenle" toggle → uyarı görünür → iptal veya değiştir + kaydet
9. Sil → Silinmiş tab'a geçer → Yayında tab'dan gizlenir → Geri yükle → Yayında'ya döner
10. `/tr/request-quote/standart` → "+ Ürün Ekle" → "smoke" yaz → autocomplete sonucu → seç
11. Empty state test: `/tr/request-quote/standart` → "+ Ürün Ekle" → olmayan ürün yaz → "Özel üretim talep formundan" linki göster

- [ ] **Step 4: Canlı smoke — public 4 locale**

- `/tr/products`, `/en/products`, `/ru/products`, `/ar/products` (AR RTL doğrula)
- Her locale'de "boşsa gösterme" çalışıyor (EN sadece dolu ürünler, vs.)
- Detay sayfalarında Schema.org Product JSON-LD var, alt text locale'e özgü
- "Teklif İste" butonu standart RFQ formuna ürün pre-select ile yönlendiriyor

- [ ] **Step 5: (Opsiyonel) Temizlik**

Smoke test ürününü admin panelinden sil (Silinmiş tab'ına alır). İstersen Supabase Studio → `products` tablosu → `DELETE WHERE slug LIKE 'smoke-test-%'` ile hard-delete, + Storage `product-images/smoke-test-*` path'lerini sil.

- [ ] **Step 6: RESUME güncelle + commit**

`docs/superpowers/RESUME.md`'ye ekle:

```markdown
## 2026-04-21 — Plan 4b tamamlandı ✅

Plan 4b (Admin Products CRUD + Public ürün sayfaları) canlıda çalışıyor.

- /admin/products liste + tab (Yayında/Silinmiş) + arama
- Yeni/Düzenle formu: 4 dil tab (TR zorunlu), 10 preset spec (unique), görsel upload (max 5×10MB, up/down reorder), SlugField lock+toggle
- Server actions: create/update/softDelete/restore/clone (Storage.copy + rollback)
- Public /[locale]/products grid (locale filter "boşsa gösterme") + /products/[slug] detay (Schema.org Product JSON-LD, XSS-safe encode)
- RFQ ProductPicker: katalog autocomplete + empty state → özel üretim formu
- Alt text runtime fallback: name[locale] + common.productImageLabel (4 dilde)
- E2E: programmatic login helper + 7 spec (admin CRUD + clone + public + picker)

Kalan: Plan 4c adayları — görsel compress, slug 301 redirect history, drag-drop reorder, variants, cron cleanup, alt text manual override.
```

```bash
git add docs/superpowers/RESUME.md
git commit -m "docs(resume): Plan 4b tamamlandı — admin products CRUD canlı"
git push
```

---

## Notlar — Execution sırası & paralellik

- **Sıralı zorunlu:**
  - Task 1 (alt-text + i18n key) → Task 20, 21, 22, 23 (public render) bağımlı.
  - Task 2 (json-ld helper) → Task 21 (ProductDetail) bağımlı.
  - Task 3, 4 (slugify, uniqueSlug) → Task 7 (createProduct) bağımlı.
  - Task 5 (spec-presets) → Task 6 (schema), 12 (SpecBuilder), 21 (ProductSpecTable) bağımlı.
  - Task 6 (schema) → Task 7, 8 (actions) bağımlı.
  - Task 7-10 (tüm server actions) sıralı veya sırasız ama 11+'dan önce hazır olmalı.
  - Task 11-17 (admin components) → Task 18, 19 (admin pages) bağımlı.
  - Task 15 (ProductForm) → Task 11, 12, 13, 14'ü compose eder.
  - Task 20, 21 (public components) → Task 22, 23 (public pages) bağımlı.
  - Task 24 (ProductPicker) → Task 27 Step 3 (RFQ picker E2E) bağımlı.
  - Task 28 en son — tüm önceki task'lar bitince.

- **Paralel adaylar (bağımsız, subagent dispatch ile paralel çalıştırılabilir):**
  - Task 1, 2, 3, 4, 5 (foundations) — tümü bağımsız
  - Task 11, 12, 13, 14 (admin component'leri, form haricinde)
  - Task 20, 21 (public components)
  - Task 26 ve 27 (E2E spec dosyaları)

- **Subagent-driven-development yönlendirme:**
  - Mekanik task (1, 3, 14, 16, 25): batch + self-review
  - Medium task (10, 11, 13, 15, 17, 18, 19, 20, 22, 23, 24, 26, 27): tek implementer + combined reviewer
  - Logic-heavy task (2, 5, 6, 7, 8, 9, 10, 12, 21): TDD + tam 3-stage review (implementer + spec reviewer + quality reviewer)
