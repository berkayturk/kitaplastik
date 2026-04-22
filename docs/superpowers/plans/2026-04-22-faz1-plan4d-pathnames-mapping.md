# Plan 4d — Per-Locale Native URL Slug'ları Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site'nin her dilindeki URL'ler o dilin kendi native slug'ını göstersin (TR `/urunler`, RU `/produktsiya`, AR `/al-muntajat`); eski EN-canonical URL'ler 308 ile yönlendirilsin; SEO + UX tutarlılığı sağlansın.

**Architecture:** next-intl v3 `pathnames` config'i ile canonical route key'leri (kod tarafında sabit, örn. `/products`) her locale için native path'e map'lenir. Runtime `getPathname()` helper'ı sitemap + alternates için kullanılır. `next.config.ts` redirect matrisi legacy URL'leri yeni native canonical'a 308 yönlendirir. Internal `<Link>` çoğunluğu canonical key kullandığı için değişmez; dynamic pattern'lar (3 yer) type-safe obj syntax'a migrate edilir.

**Tech Stack:** Next.js 15.5.15, React 19, TypeScript 5.9.3, next-intl 3.26.5, Vitest, Playwright, Tailwind 4.

---

## File Map

| File | Role |
|---|---|
| `i18n/routing.ts` | `pathnames` config — 10 canonical → native per-locale mapping |
| `i18n/navigation.ts` | `createNavigation(routing)` — `Link`, `getPathname` type-safe (otomatik) |
| `lib/utils/slugify.ts` | `slugify()` + `slugifyDraft()` — RU + AR transliteration map, `locale?` option |
| `tests/unit/lib/utils/slugify.test.ts` | RU + AR + TR sample assertions |
| `tests/unit/i18n/pathnames.test.ts` | `getPathname()` per-locale native URL assertions |
| `lib/seo/routes.ts` | `buildAlternates()` `getPathname()` kullanır |
| `tests/unit/lib/seo/routes.test.ts` | `buildAlternates()` per-locale URL testi |
| `app/sitemap.ts` | Kod değişmez — `buildAlternates()` sayesinde otomatik native URL üretir |
| `tests/unit/app/sitemap.test.ts` | 40 URL native slug assertion |
| `next.config.ts` | Redirect matrisi — mevcut 12 silindi/güncellendi + 30 yeni legacy EN→native |
| `components/home/SectorGrid.tsx` | `canonicalSlug` refactor + type-safe `<Link href>` |
| `app/[locale]/sectors/page.tsx` | Aynı — `canonicalSlug` pattern (sectors liste page) |
| `components/public/products/ProductCard.tsx` | Dynamic `<Link>` type-safe obj syntax |
| `tests/e2e/pathname-mapping.spec.ts` | **Yeni** — canonical + legacy redirect + sitemap smoke |
| `tests/e2e/url-redirects.spec.ts` | **Mevcut** — Plan 4a pattern'ları güncellenir (TR legacy → native canonical) |
| `tests/e2e/catalog.spec.ts`, `tests/e2e/contact.spec.ts`, `tests/e2e/smoke.spec.ts`, vs. | Hardcoded URL path'leri native canonical'a update |

---

## Task 1: slugify helper — RU + AR transliteration

**Files:**
- Modify: `lib/utils/slugify.ts`
- Create: `tests/unit/lib/utils/slugify.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/lib/utils/slugify.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { slugify, slugifyDraft } from "@/lib/utils/slugify";

describe("slugify — TR regression", () => {
  it("handles Turkish characters", () => {
    expect(slugify("Ürünler")).toBe("urunler");
    expect(slugify("Cam Yıkama")).toBe("cam-yikama");
    expect(slugify("Şişe Kapakları")).toBe("sise-kapaklari");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("  test  ")).toBe("test");
    expect(slugify("---abc---")).toBe("abc");
  });

  it("returns empty for empty input", () => {
    expect(slugify("")).toBe("");
  });
});

describe("slugify — RU Cyrillic (BGN/PCGN)", () => {
  it("transliterates single words", () => {
    expect(slugify("Продукция")).toBe("produktsiya");
    expect(slugify("Контакты")).toBe("kontakty");
    expect(slugify("Отрасли")).toBe("otrasli");
  });

  it("transliterates multi-word phrases", () => {
    expect(slugify("Мойка бутылок")).toBe("moyka-butylok");
    expect(slugify("О нас")).toBe("o-nas");
  });

  it("handles digraphs (ch, sh, zh, ya, yu, yo)", () => {
    expect(slugify("Щётка")).toBe("shchyotka");
    expect(slugify("Жюри")).toBe("zhyuri");
  });
});

describe("slugify — AR script (consonant-only)", () => {
  it("transliterates common nouns", () => {
    expect(slugify("المنتجات")).toBe("almntjat");
    expect(slugify("القطاعات")).toBe("alqtaat");
  });

  it("skips ayn and hamza", () => {
    expect(slugify("العربية")).toBe("alrbyh");
  });
});

describe("slugify — locale option", () => {
  it("uses TR map when locale=tr", () => {
    expect(slugify("Ürünler", { locale: "tr" })).toBe("urunler");
  });

  it("uses RU map when locale=ru", () => {
    expect(slugify("Продукция", { locale: "ru" })).toBe("produktsiya");
  });

  it("uses AR map when locale=ar", () => {
    expect(slugify("المنتجات", { locale: "ar" })).toBe("almntjat");
  });

  it("uses combined map by default (mixed scripts)", () => {
    expect(slugify("Продукция 2024")).toBe("produktsiya-2024");
    expect(slugify("Ürünler & المنتجات")).toBe("urunler-almntjat");
  });
});

describe("slugifyDraft — preserves trailing dashes", () => {
  it("keeps typing-in-progress dashes", () => {
    expect(slugifyDraft("pet-")).toBe("pet-");
    expect(slugifyDraft("pet-bottle-")).toBe("pet-bottle-");
  });

  it("transliterates RU in draft too", () => {
    expect(slugifyDraft("Продукция-")).toBe("produktsiya-");
  });
});
```

- [ ] **Step 2: Run test — expect RED**

```bash
pnpm test tests/unit/lib/utils/slugify.test.ts -- --run
```

Expected: FAIL (existing slugify only has TR map, no Cyrillic/Arabic/locale option).

- [ ] **Step 3: Replace `lib/utils/slugify.ts`**

```typescript
import type { Locale } from "@/i18n/routing";

const TR_MAP: Record<string, string> = {
  ı: "i",
  I: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

// BGN/PCGN romanization (Yandex + Google RU standard)
const RU_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e",
  ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k",
  л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
  А: "a", Б: "b", В: "v", Г: "g", Д: "d", Е: "e",
  Ё: "yo", Ж: "zh", З: "z", И: "i", Й: "y", К: "k",
  Л: "l", М: "m", Н: "n", О: "o", П: "p", Р: "r",
  С: "s", Т: "t", У: "u", Ф: "f", Х: "kh", Ц: "ts",
  Ч: "ch", Ш: "sh", Щ: "shch", Ъ: "", Ы: "y", Ь: "",
  Э: "e", Ю: "yu", Я: "ya",
};

// Arabic consonant-only transliteration (vowels absent in script)
const AR_MAP: Record<string, string> = {
  ا: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h",
  خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z", س: "s",
  ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "",
  غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m",
  ن: "n", ه: "h", و: "w", ي: "y",
  ء: "", ة: "a", ى: "a", آ: "a", أ: "a", إ: "i",
  ؤ: "w", ئ: "y",
};

const COMBINED_MAP: Record<string, string> = { ...TR_MAP, ...RU_MAP, ...AR_MAP };

function selectMap(locale?: Locale): Record<string, string> {
  switch (locale) {
    case "tr":
      return TR_MAP;
    case "ru":
      return RU_MAP;
    case "ar":
      return AR_MAP;
    default:
      return COMBINED_MAP;
  }
}

function toAscii(input: string, map: Record<string, string>): string {
  return Array.from(input)
    .map((ch) => map[ch] ?? ch)
    .join("");
}

export interface SlugifyOptions {
  locale?: Locale;
}

export function slugify(input: string, options?: SlugifyOptions): string {
  if (!input) return "";
  const map = selectMap(options?.locale);
  return toAscii(input, map)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Permissive variant for in-progress editing: preserves dashes (incl. trailing),
// so users can type "pet-" without the dash being stripped mid-keystroke.
// Apply slugify() on blur/submit for the final cleanup.
export function slugifyDraft(input: string, options?: SlugifyOptions): string {
  if (!input) return "";
  const map = selectMap(options?.locale);
  return toAscii(input, map)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}
```

- [ ] **Step 4: Run tests — expect GREEN**

```bash
pnpm test tests/unit/lib/utils/slugify.test.ts -- --run
```

Expected: PASS (all 17 cases).

- [ ] **Step 5: Run full unit test suite — check regression**

```bash
pnpm test -- --run
```

Expected: all previous tests still pass (Plan 4b ürün slug tests still use `slugify()` without locale — falls through to COMBINED_MAP which includes TR_MAP).

- [ ] **Step 6: Commit**

```bash
git add lib/utils/slugify.ts tests/unit/lib/utils/slugify.test.ts
git commit -m "feat(slugify): add RU + AR transliteration + locale option"
```

---

## Task 2: next-intl pathnames config

**Files:**
- Modify: `i18n/routing.ts`
- Create: `tests/unit/i18n/pathnames.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/i18n/pathnames.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getPathname } from "@/i18n/navigation";

describe("next-intl pathnames per-locale mapping", () => {
  it("home /", () => {
    expect(getPathname({ href: "/", locale: "tr" })).toBe("/");
    expect(getPathname({ href: "/", locale: "en" })).toBe("/");
    expect(getPathname({ href: "/", locale: "ru" })).toBe("/");
    expect(getPathname({ href: "/", locale: "ar" })).toBe("/");
  });

  it("/about", () => {
    expect(getPathname({ href: "/about", locale: "tr" })).toBe("/hakkimizda");
    expect(getPathname({ href: "/about", locale: "en" })).toBe("/about");
    expect(getPathname({ href: "/about", locale: "ru" })).toBe("/o-nas");
    expect(getPathname({ href: "/about", locale: "ar" })).toBe("/man-nahnu");
  });

  it("/contact", () => {
    expect(getPathname({ href: "/contact", locale: "tr" })).toBe("/iletisim");
    expect(getPathname({ href: "/contact", locale: "en" })).toBe("/contact");
    expect(getPathname({ href: "/contact", locale: "ru" })).toBe("/kontakty");
    expect(getPathname({ href: "/contact", locale: "ar" })).toBe("/ittisal");
  });

  it("/products", () => {
    expect(getPathname({ href: "/products", locale: "tr" })).toBe("/urunler");
    expect(getPathname({ href: "/products", locale: "en" })).toBe("/products");
    expect(getPathname({ href: "/products", locale: "ru" })).toBe("/produktsiya");
    expect(getPathname({ href: "/products", locale: "ar" })).toBe("/al-muntajat");
  });

  it("/products/[slug] dynamic", () => {
    expect(
      getPathname({
        href: { pathname: "/products/[slug]", params: { slug: "test-item" } },
        locale: "tr",
      }),
    ).toBe("/urunler/test-item");
    expect(
      getPathname({
        href: { pathname: "/products/[slug]", params: { slug: "test-item" } },
        locale: "ar",
      }),
    ).toBe("/al-muntajat/test-item");
  });

  it("/references", () => {
    expect(getPathname({ href: "/references", locale: "tr" })).toBe("/referanslar");
    expect(getPathname({ href: "/references", locale: "en" })).toBe("/references");
    expect(getPathname({ href: "/references", locale: "ru" })).toBe("/otzyvy");
    expect(getPathname({ href: "/references", locale: "ar" })).toBe("/maraji");
  });

  it("/request-quote (catalog semantics)", () => {
    expect(getPathname({ href: "/request-quote", locale: "tr" })).toBe("/katalog");
    expect(getPathname({ href: "/request-quote", locale: "en" })).toBe("/catalog");
    expect(getPathname({ href: "/request-quote", locale: "ru" })).toBe("/katalog");
    expect(getPathname({ href: "/request-quote", locale: "ar" })).toBe("/al-katalog");
  });

  it("/sectors", () => {
    expect(getPathname({ href: "/sectors", locale: "tr" })).toBe("/sektorler");
    expect(getPathname({ href: "/sectors", locale: "en" })).toBe("/sectors");
    expect(getPathname({ href: "/sectors", locale: "ru" })).toBe("/otrasli");
    expect(getPathname({ href: "/sectors", locale: "ar" })).toBe("/al-qitaat");
  });

  it("/sectors/bottle-washing", () => {
    expect(getPathname({ href: "/sectors/bottle-washing", locale: "tr" })).toBe(
      "/sektorler/cam-yikama",
    );
    expect(getPathname({ href: "/sectors/bottle-washing", locale: "ru" })).toBe(
      "/otrasli/moyka-butylok",
    );
    expect(getPathname({ href: "/sectors/bottle-washing", locale: "ar" })).toBe(
      "/al-qitaat/ghasil-zujajat",
    );
  });

  it("/sectors/caps", () => {
    expect(getPathname({ href: "/sectors/caps", locale: "tr" })).toBe("/sektorler/kapak");
    expect(getPathname({ href: "/sectors/caps", locale: "ar" })).toBe("/al-qitaat/al-aghtiya");
  });

  it("/sectors/textile", () => {
    expect(getPathname({ href: "/sectors/textile", locale: "tr" })).toBe("/sektorler/tekstil");
    expect(getPathname({ href: "/sectors/textile", locale: "ar" })).toBe(
      "/al-qitaat/al-mansujat",
    );
  });
});
```

- [ ] **Step 2: Run test — expect RED**

```bash
pnpm test tests/unit/i18n/pathnames.test.ts -- --run
```

Expected: FAIL — `getPathname()` returns canonical key untouched (no pathnames config yet).

- [ ] **Step 3: Replace `i18n/routing.ts`**

```typescript
import { defineRouting } from "next-intl/routing";

export const locales = ["tr", "en", "ru", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "tr";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/about": {
      tr: "/hakkimizda",
      en: "/about",
      ru: "/o-nas",
      ar: "/man-nahnu",
    },
    "/contact": {
      tr: "/iletisim",
      en: "/contact",
      ru: "/kontakty",
      ar: "/ittisal",
    },
    "/products": {
      tr: "/urunler",
      en: "/products",
      ru: "/produktsiya",
      ar: "/al-muntajat",
    },
    "/products/[slug]": {
      tr: "/urunler/[slug]",
      en: "/products/[slug]",
      ru: "/produktsiya/[slug]",
      ar: "/al-muntajat/[slug]",
    },
    "/references": {
      tr: "/referanslar",
      en: "/references",
      ru: "/otzyvy",
      ar: "/maraji",
    },
    "/request-quote": {
      tr: "/katalog",
      en: "/catalog",
      ru: "/katalog",
      ar: "/al-katalog",
    },
    "/sectors": {
      tr: "/sektorler",
      en: "/sectors",
      ru: "/otrasli",
      ar: "/al-qitaat",
    },
    "/sectors/bottle-washing": {
      tr: "/sektorler/cam-yikama",
      en: "/sectors/bottle-washing",
      ru: "/otrasli/moyka-butylok",
      ar: "/al-qitaat/ghasil-zujajat",
    },
    "/sectors/caps": {
      tr: "/sektorler/kapak",
      en: "/sectors/caps",
      ru: "/otrasli/kryshki",
      ar: "/al-qitaat/al-aghtiya",
    },
    "/sectors/textile": {
      tr: "/sektorler/tekstil",
      en: "/sectors/textile",
      ru: "/otrasli/tekstil",
      ar: "/al-qitaat/al-mansujat",
    },
  },
});
```

- [ ] **Step 4: Run test — expect GREEN**

```bash
pnpm test tests/unit/i18n/pathnames.test.ts -- --run
```

Expected: PASS.

- [ ] **Step 5: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: clean (next-intl type inference should validate pathnames config; `getPathname` signature still valid).

Note: `i18n/navigation.ts` does not change — `createNavigation(routing)` automatically picks up pathnames.

- [ ] **Step 6: Commit**

```bash
git add i18n/routing.ts tests/unit/i18n/pathnames.test.ts
git commit -m "feat(i18n): add per-locale pathnames mapping"
```

---

## Task 3: lib/seo/routes.ts — buildAlternates native URLs

**Files:**
- Modify: `lib/seo/routes.ts`
- Create: `tests/unit/lib/seo/routes.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/lib/seo/routes.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildAlternates, PUBLIC_ROUTES } from "@/lib/seo/routes";

const ORIGIN = "https://kitaplastik.com";

describe("buildAlternates — per-locale native URLs", () => {
  it("/products", () => {
    const alt = buildAlternates("/products", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/urunler");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en/products");
    expect(alt.languages.ru).toBe("https://kitaplastik.com/ru/produktsiya");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-muntajat");
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr/urunler");
  });

  it("/about", () => {
    const alt = buildAlternates("/about", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/hakkimizda");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/man-nahnu");
  });

  it("/request-quote with catalog semantics", () => {
    const alt = buildAlternates("/request-quote", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/katalog");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en/catalog");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar/al-katalog");
  });

  it("/ (home)", () => {
    const alt = buildAlternates("/", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr");
    expect(alt.languages.en).toBe("https://kitaplastik.com/en");
    expect(alt.languages.ru).toBe("https://kitaplastik.com/ru");
    expect(alt.languages.ar).toBe("https://kitaplastik.com/ar");
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr");
  });

  it("/sectors/bottle-washing nested", () => {
    const alt = buildAlternates("/sectors/bottle-washing", ORIGIN);
    expect(alt.languages.tr).toBe("https://kitaplastik.com/tr/sektorler/cam-yikama");
    expect(alt.languages.ar).toBe(
      "https://kitaplastik.com/ar/al-qitaat/ghasil-zujajat",
    );
  });

  it("PUBLIC_ROUTES contains all 10 canonical keys", () => {
    expect(PUBLIC_ROUTES).toHaveLength(10);
    expect(PUBLIC_ROUTES).toContain("/");
    expect(PUBLIC_ROUTES).toContain("/request-quote");
    expect(PUBLIC_ROUTES).toContain("/sectors/bottle-washing");
  });
});
```

- [ ] **Step 2: Run test — expect RED**

```bash
pnpm test tests/unit/lib/seo/routes.test.ts -- --run
```

Expected: FAIL — current `buildAlternates()` uses raw canonical key, not per-locale native path.

- [ ] **Step 3: Replace `lib/seo/routes.ts`**

```typescript
import { locales, defaultLocale, type Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";

export const PUBLIC_ROUTES = [
  "/",
  "/sectors",
  "/sectors/bottle-washing",
  "/sectors/caps",
  "/sectors/textile",
  "/products",
  "/about",
  "/contact",
  "/references",
  "/request-quote",
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export interface Alternates {
  languages: Record<Locale, string>;
  "x-default": string;
}

function buildLocaleUrl(route: PublicRoute, locale: Locale, origin: string): string {
  const pathname = getPathname({ href: route, locale });
  if (pathname === "/") return `${origin}/${locale}`;
  return `${origin}/${locale}${pathname}`;
}

export function buildAlternates(route: PublicRoute, origin: string): Alternates {
  const languages = locales.reduce<Record<Locale, string>>(
    (acc, locale) => {
      acc[locale] = buildLocaleUrl(route, locale, origin);
      return acc;
    },
    {} as Record<Locale, string>,
  );
  return {
    languages,
    "x-default": languages[defaultLocale],
  };
}
```

- [ ] **Step 4: Run test — expect GREEN**

```bash
pnpm test tests/unit/lib/seo/routes.test.ts -- --run
```

Expected: PASS.

- [ ] **Step 5: Typecheck + full tests**

```bash
pnpm exec tsc --noEmit && pnpm test -- --run
```

Expected: clean + all previous tests still pass. If `buildAlternates` callers in `app/**/page.tsx` pass non-canonical keys, fix them.

- [ ] **Step 6: Commit**

```bash
git add lib/seo/routes.ts tests/unit/lib/seo/routes.test.ts
git commit -m "feat(seo): buildAlternates uses getPathname for per-locale native URLs"
```

---

## Task 4: Sitemap snapshot test

**Files:**
- Create: `tests/unit/app/sitemap.test.ts`
- Modify: `app/sitemap.ts` (only if test reveals a gap)

- [ ] **Step 1: Write assertion test**

Create `tests/unit/app/sitemap.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap.ts — native URL generation", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("generates 40 URLs (10 routes × 4 locales)", () => {
    expect(entries).toHaveLength(40);
  });

  it("includes TR native slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/tr/urunler");
    expect(urls).toContain("https://kitaplastik.com/tr/hakkimizda");
    expect(urls).toContain("https://kitaplastik.com/tr/iletisim");
    expect(urls).toContain("https://kitaplastik.com/tr/katalog");
    expect(urls).toContain("https://kitaplastik.com/tr/sektorler/cam-yikama");
  });

  it("includes RU native slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/ru/produktsiya");
    expect(urls).toContain("https://kitaplastik.com/ru/kontakty");
    expect(urls).toContain("https://kitaplastik.com/ru/o-nas");
    expect(urls).toContain("https://kitaplastik.com/ru/katalog");
    expect(urls).toContain("https://kitaplastik.com/ru/otrasli/moyka-butylok");
  });

  it("includes AR native slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/ar/al-muntajat");
    expect(urls).toContain("https://kitaplastik.com/ar/man-nahnu");
    expect(urls).toContain("https://kitaplastik.com/ar/ittisal");
    expect(urls).toContain("https://kitaplastik.com/ar/al-katalog");
    expect(urls).toContain("https://kitaplastik.com/ar/al-qitaat/ghasil-zujajat");
  });

  it("keeps EN canonical slugs", () => {
    expect(urls).toContain("https://kitaplastik.com/en/products");
    expect(urls).toContain("https://kitaplastik.com/en/about");
    expect(urls).toContain("https://kitaplastik.com/en/catalog");
    expect(urls).toContain("https://kitaplastik.com/en/sectors/bottle-washing");
  });

  it("root URLs have no trailing slash", () => {
    expect(urls).toContain("https://kitaplastik.com/tr");
    expect(urls).toContain("https://kitaplastik.com/en");
    expect(urls).toContain("https://kitaplastik.com/ru");
    expect(urls).toContain("https://kitaplastik.com/ar");
  });

  it("each entry has alternates.languages with 4 locales", () => {
    for (const entry of entries) {
      expect(entry.alternates?.languages).toBeDefined();
      const langs = entry.alternates?.languages as Record<string, string>;
      expect(Object.keys(langs)).toHaveLength(4);
    }
  });
});
```

- [ ] **Step 2: Run test — expect PASS (no sitemap changes needed)**

```bash
pnpm test tests/unit/app/sitemap.test.ts -- --run
```

Expected: PASS. `app/sitemap.ts` already uses `buildAlternates()` — after Task 3, native URLs flow through automatically.

If FAIL: inspect `app/sitemap.ts`; likely need no changes but double-check env fallback (`env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com"`). If env is unset in test, fallback applies.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/app/sitemap.test.ts
git commit -m "test(sitemap): assert native slug coverage per locale"
```

---

## Task 5: Internal Link audit + migration

**Files:**
- Modify: `components/home/SectorGrid.tsx`
- Modify: `app/[locale]/sectors/page.tsx`
- Modify: `components/public/products/ProductCard.tsx`

- [ ] **Step 1: Audit dynamic `<Link>` patterns**

```bash
grep -rn 'href={`' app/ components/ --include="*.tsx"
```

Expected output (reference, lines may shift):
- `components/home/SectorGrid.tsx:47` — `href={`/sectors/${sector.slug}`}` (sector.slug currently TR — BUG)
- `app/[locale]/sectors/page.tsx:51` — `href={`/sectors/${sector.slug}`}` (likely same pattern)
- `components/public/products/ProductCard.tsx:29` — `href={`/products/${product.slug}`}` (dynamic)
- Others (`tel:`, `mailto:`, `/${locale}${pathTail}` locale switcher, admin `/admin/products/${id}/edit`) — out of scope (external protocols, admin locale-less, or already a plain `<a>`).

- [ ] **Step 2: Refactor `components/home/SectorGrid.tsx`**

Replace the `SECTORS` definition and `<Link>` to use canonical path map:

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "../layout/Container";
import { Card, CardEyebrow, CardTitle, CardBody, CardFooter } from "@/components/ui";

type SectorCanonicalPath =
  | "/sectors/bottle-washing"
  | "/sectors/caps"
  | "/sectors/textile";

interface SectorDef {
  href: SectorCanonicalPath;
  nsKey: "camYikama" | "kapak" | "tekstil";
  number: string;
  spec: string;
}

const SECTORS: readonly SectorDef[] = [
  { href: "/sectors/bottle-washing", nsKey: "camYikama", number: "01", spec: "Ø 80–320 mm · 12–480 g" },
  { href: "/sectors/caps", nsKey: "kapak", number: "02", spec: "26–83 mm · HDPE / PP / PET" },
  {
    href: "/sectors/textile",
    nsKey: "tekstil",
    number: "03",
    spec: "POM · PA6 · abrasif aşınmaya dayanıklı",
  },
];

export function SectorGrid() {
  const t = useTranslations("home.sectors");
  const tCta = useTranslations("common.cta");

  return (
    <section className="py-24 md:py-32" aria-label={t("eyebrow")}>
      <Container>
        <header className="max-w-2xl">
          <p className="eyebrow">
            {t("eyebrow")} · <span className="font-mono opacity-60">01 — 03</span>
          </p>
          <h2
            className="font-display mt-4 text-[36px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[44px]"
            style={{ fontOpticalSizing: "auto" }}
          >
            {t("title")}
          </h2>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {SECTORS.map((sector) => (
            <Link
              key={sector.href}
              href={sector.href}
              className="group block focus-visible:outline-none"
            >
              <Card interactive className="h-full">
                <CardEyebrow>
                  <span className="text-[var(--color-accent-cobalt)]">Sektör</span>
                  <span className="mx-1 opacity-50">/</span>
                  <span className="font-mono">{sector.number}</span>
                </CardEyebrow>
                <CardTitle>{t(`${sector.nsKey}.title`)}</CardTitle>
                <CardBody>{t(`${sector.nsKey}.description`)}</CardBody>
                <CardFooter>
                  <span className="font-mono text-[12px] tracking-[0.02em] text-[var(--color-text-tertiary)]">
                    {sector.spec}
                  </span>
                  <span className="ms-auto text-[14px] font-medium text-[var(--color-accent-cobalt)] transition-transform duration-200 ease-out group-hover:translate-x-1">
                    {tCta("learnMore")} →
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Refactor `app/[locale]/sectors/page.tsx`**

Replace the entire file content with:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sectors.hub.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/sectors`,
      languages: buildAlternates("/sectors", origin).languages,
    },
  };
}

type SectorCanonicalPath =
  | "/sectors/bottle-washing"
  | "/sectors/caps"
  | "/sectors/textile";

interface SectorDef {
  href: SectorCanonicalPath;
  nsKey: "camYikama" | "kapak" | "tekstil";
}

const SECTORS: readonly SectorDef[] = [
  { href: "/sectors/bottle-washing", nsKey: "camYikama" },
  { href: "/sectors/caps", nsKey: "kapak" },
  { href: "/sectors/textile", nsKey: "tekstil" },
];

export default async function SectorsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sectors.hub");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="text-text-primary mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-text-secondary mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {SECTORS.map((sector) => (
          <Link
            key={sector.href}
            href={sector.href}
            className="group flex flex-col gap-3 rounded-lg border border-[var(--color-border-subtle-dark)] p-6 transition hover:border-[var(--color-accent-red)]"
          >
            <h2 className="text-text-primary text-xl font-semibold">
              {t(`${sector.nsKey}.title`)}
            </h2>
            <p className="text-text-secondary">{t(`${sector.nsKey}.description`)}</p>
            <span
              aria-hidden="true"
              className="text-text-secondary group-hover:text-text-primary mt-auto pt-2 text-xs"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

Change summary: `SECTORS` entries now use typed canonical `href` (`/sectors/bottle-washing`) instead of raw slug (`cam-yikama`); `<Link href={sector.href}>` uses the typed canonical key directly, letting next-intl resolve the per-locale native URL automatically.

- [ ] **Step 4: Refactor `components/public/products/ProductCard.tsx`**

Minimal edit on line 29 only — replace the dynamic `href` template literal with type-safe object syntax:

```tsx
// Before (line 29):
      href={`/products/${product.slug}`}

// After (line 29):
      href={{ pathname: "/products/[slug]", params: { slug: product.slug } }}
```

No other lines change. The `<Link>` component type inference picks up the `pathnames['/products/[slug]']` mapping automatically from `i18n/routing.ts`.

- [ ] **Step 5: Typecheck + build**

```bash
pnpm exec tsc --noEmit && pnpm build
```

Expected: clean. If next-intl complains about `href` string literals not matching a pathnames key, investigate — likely a typo in canonical key.

- [ ] **Step 6: Run unit tests**

```bash
pnpm test -- --run
```

Expected: all pass (no component unit test touches these Link patterns directly, but ReferencesStrip and others may snapshot — fix if broken).

- [ ] **Step 7: Commit**

```bash
git add components/home/SectorGrid.tsx app/[locale]/sectors/page.tsx components/public/products/ProductCard.tsx
git commit -m "refactor(links): canonical pathname keys for type-safe i18n Link"
```

---

## Task 6: next.config.ts redirect matrix

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace `redirects()` method**

Open `next.config.ts` and replace the `async redirects()` method (lines ~46-119) with:

```typescript
async redirects() {
  return [
    // Plan 3 legacy TR deep links → new TR canonical (catalog) 1-hop
    {
      source: "/tr/teklif-iste",
      destination: "/tr/katalog",
      permanent: true,
    },
    {
      source: "/tr/teklif-iste/:rest*",
      destination: "/tr/katalog",
      permanent: true,
    },
    // Plan 4a legacy EN-canonical → new per-locale native (TR)
    { source: "/tr/products", destination: "/tr/urunler", permanent: true },
    { source: "/tr/products/:slug", destination: "/tr/urunler/:slug", permanent: true },
    { source: "/tr/about", destination: "/tr/hakkimizda", permanent: true },
    { source: "/tr/contact", destination: "/tr/iletisim", permanent: true },
    { source: "/tr/references", destination: "/tr/referanslar", permanent: true },
    { source: "/tr/request-quote", destination: "/tr/katalog", permanent: true },
    {
      source: "/tr/request-quote/:sub(custom|standard)",
      destination: "/tr/katalog",
      permanent: true,
    },
    {
      source: "/tr/sectors/bottle-washing",
      destination: "/tr/sektorler/cam-yikama",
      permanent: true,
    },
    { source: "/tr/sectors/caps", destination: "/tr/sektorler/kapak", permanent: true },
    { source: "/tr/sectors/textile", destination: "/tr/sektorler/tekstil", permanent: true },
    { source: "/tr/sectors", destination: "/tr/sektorler", permanent: true },

    // Plan 4a legacy EN-canonical → new per-locale native (RU)
    { source: "/ru/products", destination: "/ru/produktsiya", permanent: true },
    { source: "/ru/products/:slug", destination: "/ru/produktsiya/:slug", permanent: true },
    { source: "/ru/about", destination: "/ru/o-nas", permanent: true },
    { source: "/ru/contact", destination: "/ru/kontakty", permanent: true },
    { source: "/ru/references", destination: "/ru/otzyvy", permanent: true },
    { source: "/ru/request-quote", destination: "/ru/katalog", permanent: true },
    {
      source: "/ru/request-quote/:sub(custom|standard)",
      destination: "/ru/katalog",
      permanent: true,
    },
    {
      source: "/ru/sectors/bottle-washing",
      destination: "/ru/otrasli/moyka-butylok",
      permanent: true,
    },
    { source: "/ru/sectors/caps", destination: "/ru/otrasli/kryshki", permanent: true },
    { source: "/ru/sectors/textile", destination: "/ru/otrasli/tekstil", permanent: true },
    { source: "/ru/sectors", destination: "/ru/otrasli", permanent: true },

    // Plan 4a legacy EN-canonical → new per-locale native (AR)
    { source: "/ar/products", destination: "/ar/al-muntajat", permanent: true },
    { source: "/ar/products/:slug", destination: "/ar/al-muntajat/:slug", permanent: true },
    { source: "/ar/about", destination: "/ar/man-nahnu", permanent: true },
    { source: "/ar/contact", destination: "/ar/ittisal", permanent: true },
    { source: "/ar/references", destination: "/ar/maraji", permanent: true },
    { source: "/ar/request-quote", destination: "/ar/al-katalog", permanent: true },
    {
      source: "/ar/request-quote/:sub(custom|standard)",
      destination: "/ar/al-katalog",
      permanent: true,
    },
    {
      source: "/ar/sectors/bottle-washing",
      destination: "/ar/al-qitaat/ghasil-zujajat",
      permanent: true,
    },
    {
      source: "/ar/sectors/caps",
      destination: "/ar/al-qitaat/al-aghtiya",
      permanent: true,
    },
    {
      source: "/ar/sectors/textile",
      destination: "/ar/al-qitaat/al-mansujat",
      permanent: true,
    },
    { source: "/ar/sectors", destination: "/ar/al-qitaat", permanent: true },

    // Admin (preserved from Plan 4a)
    {
      source: "/admin/ayarlar/bildirimler",
      destination: "/admin/settings/notifications",
      permanent: true,
    },
  ];
},
```

Note: EN locale has no redirect — its canonical slugs are identical to the codebase canonical keys, so no change needed.

Note: Old redirects `/tr/urunler → /tr/products`, `/tr/hakkimizda → /tr/about`, etc. (Plan 3 TR native → Plan 4a EN) are **removed**. After Plan 4d, `/tr/urunler` is the canonical URL served directly by next-intl — no redirect needed.

- [ ] **Step 2: Build sanity**

```bash
pnpm build
```

Expected: clean. Next.js validates redirect rules at build time.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(redirects): legacy EN-canonical → per-locale native matrix"
```

---

## Task 7: E2E pathname-mapping.spec.ts

**Files:**
- Create: `tests/e2e/pathname-mapping.spec.ts`

- [ ] **Step 1: Write E2E spec**

Create `tests/e2e/pathname-mapping.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Pathname mapping — canonical URLs", () => {
  test("TR canonical URLs return 200", async ({ page }) => {
    const routes = [
      "/tr",
      "/tr/urunler",
      "/tr/hakkimizda",
      "/tr/iletisim",
      "/tr/referanslar",
      "/tr/katalog",
      "/tr/sektorler",
      "/tr/sektorler/cam-yikama",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });

  test("EN canonical URLs return 200", async ({ page }) => {
    const routes = [
      "/en",
      "/en/products",
      "/en/about",
      "/en/contact",
      "/en/references",
      "/en/catalog",
      "/en/sectors",
      "/en/sectors/bottle-washing",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });

  test("RU canonical URLs return 200", async ({ page }) => {
    const routes = [
      "/ru",
      "/ru/produktsiya",
      "/ru/o-nas",
      "/ru/kontakty",
      "/ru/otzyvy",
      "/ru/katalog",
      "/ru/otrasli",
      "/ru/otrasli/moyka-butylok",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });

  test("AR canonical URLs return 200", async ({ page }) => {
    const routes = [
      "/ar",
      "/ar/al-muntajat",
      "/ar/man-nahnu",
      "/ar/ittisal",
      "/ar/maraji",
      "/ar/al-katalog",
      "/ar/al-qitaat",
      "/ar/al-qitaat/ghasil-zujajat",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });
});

test.describe("Pathname mapping — legacy redirects", () => {
  test("TR legacy EN-canonical → native (308)", async ({ page }) => {
    const pairs: Array<[string, string]> = [
      ["/tr/products", "/tr/urunler"],
      ["/tr/about", "/tr/hakkimizda"],
      ["/tr/contact", "/tr/iletisim"],
      ["/tr/references", "/tr/referanslar"],
      ["/tr/request-quote", "/tr/katalog"],
      ["/tr/sectors", "/tr/sektorler"],
      ["/tr/sectors/bottle-washing", "/tr/sektorler/cam-yikama"],
      ["/tr/sectors/caps", "/tr/sektorler/kapak"],
      ["/tr/sectors/textile", "/tr/sektorler/tekstil"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("RU legacy EN-canonical → native (308)", async ({ page }) => {
    const pairs: Array<[string, string]> = [
      ["/ru/products", "/ru/produktsiya"],
      ["/ru/about", "/ru/o-nas"],
      ["/ru/contact", "/ru/kontakty"],
      ["/ru/request-quote", "/ru/katalog"],
      ["/ru/sectors/bottle-washing", "/ru/otrasli/moyka-butylok"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("AR legacy EN-canonical → native (308)", async ({ page }) => {
    const pairs: Array<[string, string]> = [
      ["/ar/products", "/ar/al-muntajat"],
      ["/ar/about", "/ar/man-nahnu"],
      ["/ar/contact", "/ar/ittisal"],
      ["/ar/request-quote", "/ar/al-katalog"],
      ["/ar/sectors/bottle-washing", "/ar/al-qitaat/ghasil-zujajat"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("Plan 3 TR legacy → new canonical 1-hop", async ({ page }) => {
    const pairs: Array<[string, string]> = [
      ["/tr/teklif-iste", "/tr/katalog"],
      ["/tr/teklif-iste/ozel-uretim", "/tr/katalog"],
      ["/tr/teklif-iste/standart", "/tr/katalog"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });
});

test.describe("Pathname mapping — sitemap", () => {
  test("sitemap.xml contains native slugs", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("/tr/urunler");
    expect(body).toContain("/tr/katalog");
    expect(body).toContain("/ru/produktsiya");
    expect(body).toContain("/ar/al-muntajat");
    expect(body).toContain("/ar/al-qitaat/ghasil-zujajat");
    expect(body).toContain("/en/products");
    expect(body).toContain("/en/catalog");
  });
});
```

- [ ] **Step 2: Run E2E**

```bash
pnpm test:e2e tests/e2e/pathname-mapping.spec.ts
```

Expected: all PASS. If any redirect returns 307 instead of 308, the test still passes (URL assertion only). If a canonical URL 404s, check `i18n/routing.ts` pathnames config for typo.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/pathname-mapping.spec.ts
git commit -m "test(e2e): pathname mapping canonical + legacy redirect coverage"
```

---

## Task 8: Regression E2E update

**Files:**
- Modify: `tests/e2e/url-redirects.spec.ts` (Plan 4a tests now reversed)
- Modify: `tests/e2e/contact.spec.ts`
- Modify: `tests/e2e/catalog.spec.ts` (if exists)
- Modify: `tests/e2e/smoke.spec.ts`, `tests/e2e/pages-smoke.spec.ts`
- Modify: `tests/e2e/public-products-grid.spec.ts`, `tests/e2e/public-product-detail.spec.ts`
- Modify: `tests/e2e/references.spec.ts`
- Modify: `tests/e2e/i18n.spec.ts`

- [ ] **Step 1: Audit hardcoded URL paths**

```bash
grep -rn "'/tr/\|\"/tr/\|'/en/\|\"/en/\|'/ru/\|\"/ru/\|'/ar/\|\"/ar/" tests/e2e/ --include="*.ts" | grep -v "pathname-mapping" | head -80
```

Review each occurrence. Classify:
- **EN canonical path** (e.g., `/tr/products`) — update to TR native `/tr/urunler`
- **Plan 3 legacy TR path** (e.g., `/tr/urunler` already) — likely correct, no change
- **Locale-agnostic** (`/tr/` prefix) — leave as-is

- [ ] **Step 2: Update `tests/e2e/url-redirects.spec.ts`**

Plan 4a's TR-native → EN-canonical pairs are now reversed. Replace the spec's body (its contents test the pre-Plan-4d direction) with either:

(a) **Delete it** — `pathname-mapping.spec.ts` fully replaces its coverage. Simplest.

```bash
rm tests/e2e/url-redirects.spec.ts
```

(b) **Rewrite** — if retaining history, rewrite to assert the new direction (legacy → native). Duplicates pathname-mapping.spec.ts coverage — redundant.

**Choose (a) — delete.** Coverage handled by pathname-mapping.spec.ts.

- [ ] **Step 3: Update remaining specs — systematic fix**

For each `tests/e2e/*.spec.ts` file matching legacy EN-canonical paths, apply these substitutions (only when the locale is `tr`, `ru`, or `ar` — EN stays):

| Pattern | Replace (TR) | Replace (RU) | Replace (AR) |
|---|---|---|---|
| `/XX/products` | `/tr/urunler` | `/ru/produktsiya` | `/ar/al-muntajat` |
| `/XX/about` | `/tr/hakkimizda` | `/ru/o-nas` | `/ar/man-nahnu` |
| `/XX/contact` | `/tr/iletisim` | `/ru/kontakty` | `/ar/ittisal` |
| `/XX/references` | `/tr/referanslar` | `/ru/otzyvy` | `/ar/maraji` |
| `/XX/request-quote` | `/tr/katalog` | `/ru/katalog` | `/ar/al-katalog` |
| `/XX/sectors` | `/tr/sektorler` | `/ru/otrasli` | `/ar/al-qitaat` |
| `/XX/sectors/bottle-washing` | `/tr/sektorler/cam-yikama` | `/ru/otrasli/moyka-butylok` | `/ar/al-qitaat/ghasil-zujajat` |
| `/XX/sectors/caps` | `/tr/sektorler/kapak` | `/ru/otrasli/kryshki` | `/ar/al-qitaat/al-aghtiya` |
| `/XX/sectors/textile` | `/tr/sektorler/tekstil` | `/ru/otrasli/tekstil` | `/ar/al-qitaat/al-mansujat` |

Product detail dynamic `[slug]`: path prefix changes but slug stays. `/tr/products/my-slug` → `/tr/urunler/my-slug`.

- [ ] **Step 4: Run E2E full suite**

```bash
pnpm test:e2e
```

Expected: all PASS, including the new `pathname-mapping.spec.ts`. Fix any failing assertions inline (likely missed hardcoded URL).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): migrate hardcoded paths to per-locale native canonical"
```

---

## Task 9: Full verify + push + deploy + canlı smoke

**Files:**
- None (verification + deploy)

- [ ] **Step 1: Full local verification**

```bash
pnpm verify
```

Expected: all checks PASS (typecheck + lint + format + unit + build + E2E). If any fail, fix before proceeding.

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

Expected: push succeeds. GitHub Actions CI triggers automatically.

- [ ] **Step 3: Wait for CI + Coolify auto-deploy**

Monitor:

```bash
gh run watch
```

Expected: CI green → Coolify webhook fires → ~7-9 minutes total.

If CI fails, read logs, fix, recommit, re-push.

- [ ] **Step 4: Canlı smoke — TR canonical URLs**

```bash
for p in urunler hakkimizda iletisim referanslar katalog sektorler sektorler/cam-yikama sektorler/kapak sektorler/tekstil; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://kitaplastik.com/tr/$p")
  echo "/tr/$p → $code"
done
```

Expected: all `200`.

- [ ] **Step 5: Canlı smoke — RU + AR + EN canonical URLs**

```bash
# RU
for p in produktsiya o-nas kontakty otzyvy katalog otrasli otrasli/moyka-butylok; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://kitaplastik.com/ru/$p")
  echo "/ru/$p → $code"
done

# AR
for p in al-muntajat man-nahnu ittisal maraji al-katalog al-qitaat al-qitaat/ghasil-zujajat; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://kitaplastik.com/ar/$p")
  echo "/ar/$p → $code"
done

# EN (unchanged)
for p in products about contact references catalog sectors sectors/bottle-washing; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://kitaplastik.com/en/$p")
  echo "/en/$p → $code"
done
```

Expected: all `200`.

- [ ] **Step 6: Canlı smoke — legacy redirect 308**

```bash
# TR legacy EN-canonical → native
for pair in "products:urunler" "about:hakkimizda" "contact:iletisim" "request-quote:katalog" "sectors:sektorler"; do
  from="${pair%:*}"; to="${pair#*:}"
  result=$(curl -sIL "https://kitaplastik.com/tr/$from" | grep -i '^location:\|^HTTP' | tail -2 | tr '\n' ' ')
  echo "/tr/$from → $result"
done

# Plan 3 legacy direct → katalog
curl -sIL "https://kitaplastik.com/tr/teklif-iste" | grep -iE '^(location|HTTP)'
curl -sIL "https://kitaplastik.com/tr/teklif-iste/ozel-uretim" | grep -iE '^(location|HTTP)'
```

Expected: 308 with Location header → final URL contains the native canonical.

- [ ] **Step 7: Canlı smoke — sitemap**

```bash
curl -s "https://kitaplastik.com/sitemap.xml" | grep -oE '<loc>[^<]+</loc>' | sort -u
```

Expected: 40 URLs total; grep for native slugs:

```bash
curl -s "https://kitaplastik.com/sitemap.xml" | grep -E "tr/urunler|ru/produktsiya|ar/al-muntajat|en/products"
```

Expected: all four native variants present.

- [ ] **Step 8: Browser walk-through (manual user check)**

Visit each:
- https://kitaplastik.com/tr — navigate to Ürünler (click Products in header) → URL should be `/tr/urunler`
- https://kitaplastik.com/tr → Katalog İndir button → URL `/tr/katalog`
- https://kitaplastik.com/tr → Sektörler → click a sector card → URL `/tr/sektorler/cam-yikama` (not `/sectors/cam-yikama`)
- LocaleSwitcher TR → EN from `/tr/urunler` → lands on `/en/products`
- LocaleSwitcher TR → AR from `/tr/hakkimizda` → lands on `/ar/man-nahnu`
- Catalog form submit on `/tr/katalog` → email arrives with PDF link (regression)

Report any visible bug for inline fix.

- [ ] **Step 9: Google Search Console (optional, one-shot)**

Open Search Console → Sitemaps → Resubmit `https://kitaplastik.com/sitemap.xml`. Google will re-crawl within 24-72 hours.

- [ ] **Step 10: Memory + RESUME update**

Memory file update:

```bash
# Edit /Users/bt/.claude/projects/-Users-bt-claude-kitaplastik/memory/project_kitaplastik.md
# Append/update: Plan 4d ✅ canlıda (2026-04-22 extended session)
```

RESUME.md update: add new `## 2026-04-22 (devam 3) — Plan 4d pathnames canlıda` entry with final commit summary, canlı smoke results, deferred follow-ups.

- [ ] **Step 11: Final commit (resume + memory)**

```bash
git add docs/superpowers/RESUME.md
git commit -m "docs(resume): Plan 4d pathnames canlıda + session close"
git push origin main
```

Expected: push succeeds, CI passes (no code impact), no redeploy needed (docs only).

---

## Acceptance Criteria

Plan 4d "bitti" denebilmesi için hepsi geçmeli:

- [ ] `i18n/routing.ts` pathnames config eklendi, typecheck temiz
- [ ] `lib/utils/slugify.ts` RU + AR + locale option, tests yeşil
- [ ] `lib/seo/routes.ts` + sitemap per-locale native URL üretir
- [ ] `next.config.ts` redirect matrisi ~33 rule, EN locale hariç
- [ ] SectorGrid + sectors/page.tsx + ProductCard canonical key kullanır (type-safe)
- [ ] Unit testler (mevcut + yeni slugify/pathnames/routes/sitemap) yeşil
- [ ] E2E `pathname-mapping.spec.ts` + regression spec'ler yeşil
- [ ] `pnpm verify` full pipeline lokalde yeşil
- [ ] Canlı smoke: 4 locale × 7-8 canonical URL 200, TR/RU/AR legacy redirect 308, Plan 3 teklif-iste → katalog 1-hop
- [ ] `sitemap.xml` live'da native slug'lar mevcut
- [ ] LocaleSwitcher 4 locale arasında doğru native URL transition yapar
- [ ] Catalog request form submit regression yok
- [ ] Admin login + products CRUD regression yok
- [ ] RESUME.md + memory güncel

---

## Dependency Map

```
T1 (slugify) ────────┐
                      ├──> T9 (ship)
T2 (pathnames) ──┬────┤
                 ├────┤
T3 (seo/routes)──┤    │
                 ├────┤
T4 (sitemap) ────┤    │
                 │    │
T5 (Links) ──────┤    │
                 │    │
T6 (redirects) ──┤    │
                 │    │
T7 (E2E new) ────┤    │
                 │    │
T8 (E2E reg.) ───┘    │
                      │
                      └── Coolify deploy
```

**Parallelizable:** T1 standalone (no pathnames dep). T2 requires nothing. T3 depends on T2 (`getPathname`). T4 depends on T3 (sitemap uses buildAlternates). T5 standalone (type-safe Link benefits from T2 but works regardless). T6 standalone. T7 requires T2+T3+T4+T5+T6 deployed locally. T8 requires T7 patterns. T9 final.

**Serial (recommended for subagent-driven):** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9.
