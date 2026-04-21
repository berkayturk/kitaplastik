# Plan 4a — URL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public URL segmentlerini Türkçe'den İngilizce'ye geçir (`/urunler` → `/products`, `/sektorler` → `/sectors`, vs.), 301 redirect ile SEO koru, admin path uyumsuzluğunu (`/admin/ayarlar/bildirimler` → `/admin/settings/notifications`) düzelt.

**Architecture:** `lib/seo/routes.ts` merkezi PUBLIC_ROUTES array'i + `app/[locale]/*` klasör rename'leri (git mv) + internal link grep+fix + `next.config.ts` `redirects()` fonksiyonu. Test-first E2E redirect spec. Single branch `feat/plan4a-url-migration`, atomic PR.

**Tech Stack:** Next.js 15.5.15, next-intl 3.26.5, TypeScript 5.9.3, Playwright, pnpm 9, Node 22.

**Spec:** `docs/superpowers/specs/2026-04-21-plan4a-url-migration-design.md`

---

## TL;DR (plain Türkçe)

Bu plan 13 task. Özet:
1-3: Feature branch + failing E2E redirect spec (TDD red phase)
4-6: `lib/seo/routes.ts` güncelle (tek yerde değişim → sitemap + hreflang otomatik), unit test güncelle
7-9: 12 klasörü `git mv` ile rename et, internal `Link href=`'leri grep ile güncelle, `next.config.ts` redirects() ekle
10-11: typecheck + build + unit test + E2E hepsi yeşil
12: Commit + push + CI
13: Merge main + Coolify redeploy + canlı smoke + Google Search Console sitemap submit

---

## Rename Haritası (referans)

```
Public (11, her locale):
/urunler                          →  /products
/sektorler                        →  /sectors
/sektorler/cam-yikama             →  /sectors/bottle-washing
/sektorler/kapak                  →  /sectors/caps
/sektorler/tekstil                →  /sectors/textile
/hakkimizda                       →  /about
/iletisim                         →  /contact
/referanslar                      →  /references
/teklif-iste                      →  /request-quote
/teklif-iste/ozel-uretim          →  /request-quote/custom
/teklif-iste/standart             →  /request-quote/standard

Admin (1, locale-free):
/admin/ayarlar/bildirimler        →  /admin/settings/notifications
```

---

### Task 1: Feature branch + baseline doğrulama

**Files:**
- Ref: git tree

- [ ] **Step 1: Main'den yeni branch aç**

```bash
git checkout main
git pull origin main
git checkout -b feat/plan4a-url-migration
```

- [ ] **Step 2: Baseline test — şu an testler yeşil mi?**

Run:
```bash
pnpm typecheck
pnpm test
```

Expected: typecheck clean, 73 unit test pass. (E2E baseline'ı Task 11'de, servera ihtiyacı var.)

- [ ] **Step 3: Eski PUBLIC_ROUTES içeriğini doğrula**

Run: `cat lib/seo/routes.ts | head -20`
Expected: `PUBLIC_ROUTES` array'i 12 Türkçe path içeriyor (örn. `/urunler`, `/sektorler`, `/teklif-iste/standart`).

---

### Task 2: E2E redirect spec yaz (RED — failing)

**Files:**
- Create: `tests/e2e/url-redirects.spec.ts`

- [ ] **Step 1: Yeni E2E spec yaz**

```typescript
// tests/e2e/url-redirects.spec.ts
import { test, expect } from "@playwright/test";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

const REDIRECTS: Array<[string, string]> = [
  ["/urunler", "/products"],
  ["/sektorler", "/sectors"],
  ["/sektorler/cam-yikama", "/sectors/bottle-washing"],
  ["/sektorler/kapak", "/sectors/caps"],
  ["/sektorler/tekstil", "/sectors/textile"],
  ["/hakkimizda", "/about"],
  ["/iletisim", "/contact"],
  ["/referanslar", "/references"],
  ["/teklif-iste", "/request-quote"],
  ["/teklif-iste/ozel-uretim", "/request-quote/custom"],
  ["/teklif-iste/standart", "/request-quote/standard"],
];

test.describe("Plan 4a: public URL 301 redirects", () => {
  for (const locale of LOCALES) {
    for (const [oldPath, newPath] of REDIRECTS) {
      const oldUrl = `/${locale}${oldPath}`;
      const newUrl = `/${locale}${newPath}`;

      test(`${oldUrl} → ${newUrl}`, async ({ page }) => {
        const response = await page.goto(oldUrl, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status()).toBe(200);
        expect(page.url()).toContain(newUrl);
      });
    }
  }
});

test("admin: /admin/ayarlar/bildirimler → /admin/settings/notifications", async ({
  page,
}) => {
  const response = await page.goto("/admin/ayarlar/bildirimler", {
    waitUntil: "domcontentloaded",
  });
  // Admin login gate yakaladığından 200 or redirect to /admin/login — her iki durumda da path /admin/settings/notifications'ı geçmiş olmalı
  expect(response?.url()).toMatch(
    /\/admin\/(settings\/notifications|login)/,
  );
});
```

- [ ] **Step 2: Spec'i çalıştır, fail olduğunu doğrula**

Run:
```bash
pnpm dev &
sleep 5
pnpm playwright test tests/e2e/url-redirects.spec.ts --reporter=list
```

Expected: 44 + 1 = 45 test fail (çünkü eski path hâlâ 200 döner, redirect yok).

- [ ] **Step 3: Dev server'ı kapat**

Run: `pkill -f 'next dev' || true`

---

### Task 3: `lib/seo/routes.ts` — PUBLIC_ROUTES'u İngilizce'ye güncelle

**Files:**
- Modify: `lib/seo/routes.ts`

- [ ] **Step 1: PUBLIC_ROUTES array'ini yeni path'lerle değiştir**

`lib/seo/routes.ts` içinde satır 3-16 değişecek:

```typescript
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
  "/request-quote/custom",
  "/request-quote/standard",
] as const;
```

- [ ] **Step 2: Build check (kırılır — sayfalar mevcut klasör isimleriyle eşleşmiyor)**

Run: `pnpm typecheck`
Expected: typecheck pass (PUBLIC_ROUTES sadece string literal değil tür). Build kırılır Task 7'ye kadar.

- [ ] **Step 3: Commit**

```bash
git add lib/seo/routes.ts
git commit -m "refactor(routes): rename public routes to English slugs (lib/seo/routes.ts)"
```

---

### Task 4: Unit test — `tests/unit/seo/routes.test.ts` güncelle

**Files:**
- Modify: `tests/unit/seo/routes.test.ts`

- [ ] **Step 1: Test dosyasını oku, hangi assertion'lar eski path içeriyor tespit et**

Run: `cat tests/unit/seo/routes.test.ts`

- [ ] **Step 2: Test'lerdeki eski path referanslarını yenileriyle değiştir**

Her `urunler` → `products`, her `sektorler` → `sectors`, her `cam-yikama` → `bottle-washing`, her `hakkimizda` → `about`, her `iletisim` → `contact`, her `referanslar` → `references`, her `teklif-iste/ozel-uretim` → `request-quote/custom`, her `teklif-iste/standart` → `request-quote/standard`, her `teklif-iste` → `request-quote`, her `kapak` → `caps`, her `tekstil` → `textile`.

- [ ] **Step 3: Test'i çalıştır, yeşil mi doğrula**

Run: `pnpm vitest run tests/unit/seo/routes.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/seo/routes.test.ts
git commit -m "test(seo): update PUBLIC_ROUTES unit tests for English slugs"
```

---

### Task 5: `app/sitemap.ts` — doğrula (değişmesi gerekmez)

**Files:**
- Verify: `app/sitemap.ts`

- [ ] **Step 1: sitemap.ts'yi oku, PUBLIC_ROUTES'tan üretildiğini doğrula**

`app/sitemap.ts` zaten `PUBLIC_ROUTES.flatMap(...)` pattern kullanıyor — Task 3 sonrası otomatik yeni URL'leri üretecek.

- [ ] **Step 2: Manuel test — sitemap output'unu dev'de üret ve ilk 5 URL'i incele**

Bu adım Task 11'de dev server ayağa kalkınca yapılacak. Şu an skip, next task.

---

### Task 6: Referanslı unit testleri güncelle

**Files:**
- Modify: `tests/unit/components/ReferencesStrip.test.tsx`

- [ ] **Step 1: Dosyada eski path referanslarını bul**

Run: `grep -nE "(urunler|sektorler|hakkimizda|iletisim|referanslar|teklif-iste)" tests/unit/components/ReferencesStrip.test.tsx`

- [ ] **Step 2: Eski path'leri İngilizce karşılığıyla değiştir**

Her eski segment'i rename haritasındaki yenisiyle değiştir.

- [ ] **Step 3: Test'i çalıştır**

Run: `pnpm vitest run tests/unit/components/ReferencesStrip.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/components/ReferencesStrip.test.tsx
git commit -m "test(references): update ReferencesStrip test for English slugs"
```

---

### Task 7: 12 klasörü `git mv` ile rename et

**Files:**
- Rename: 12 klasör (11 public + 1 admin)

- [ ] **Step 1: Public klasör rename'leri (11 adet)**

Run:
```bash
git mv app/\[locale\]/urunler app/\[locale\]/products
git mv app/\[locale\]/sektorler/cam-yikama app/\[locale\]/sectors-tmp/bottle-washing
git mv app/\[locale\]/sektorler/kapak app/\[locale\]/sectors-tmp/caps
git mv app/\[locale\]/sektorler/tekstil app/\[locale\]/sectors-tmp/textile
# sektorler/page.tsx dosyasını ayrı taşı çünkü alt klasörleri farklı sırayla taşıdık
git mv app/\[locale\]/sektorler/page.tsx app/\[locale\]/sectors-tmp/page.tsx
rmdir app/\[locale\]/sektorler
mv app/\[locale\]/sectors-tmp app/\[locale\]/sectors
git add -A
git mv app/\[locale\]/hakkimizda app/\[locale\]/about
git mv app/\[locale\]/iletisim app/\[locale\]/contact
git mv app/\[locale\]/referanslar app/\[locale\]/references
git mv app/\[locale\]/teklif-iste/ozel-uretim app/\[locale\]/request-quote-tmp/custom
git mv app/\[locale\]/teklif-iste/standart app/\[locale\]/request-quote-tmp/standard
git mv app/\[locale\]/teklif-iste/page.tsx app/\[locale\]/request-quote-tmp/page.tsx
rmdir app/\[locale\]/teklif-iste
mv app/\[locale\]/request-quote-tmp app/\[locale\]/request-quote
git add -A
```

Alternatif basit yaklaşım (parent rename sonrası alt rename): önce `git mv parent new-parent`, sonra alt klasörleri git mv ile rename et.

Eğer path rename'leri tek seferde `git mv` ile yapmak sorun çıkarırsa, plain `mv` + `git add -A` + `git commit` kombinasyonu da kabul (git history'yi rename detect eder).

- [ ] **Step 2: Admin klasörü rename**

Run:
```bash
mkdir -p app/admin/settings
git mv app/admin/ayarlar/bildirimler app/admin/settings/notifications
rmdir app/admin/ayarlar
git add -A
```

- [ ] **Step 3: Rename doğrula**

Run: `ls app/\[locale\]/ && echo "---" && ls app/admin/`
Expected:
```
products sectors about contact references request-quote layout.tsx not-found.tsx page.tsx
---
auth inbox layout.tsx login page.tsx settings
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(routes): rename public and admin folders to English slugs (git mv)"
```

---

### Task 8: Internal `<Link href="...">` referanslarını güncelle

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/Footer.tsx`
- Modify: `components/layout/LocaleSwitcher.tsx`
- Modify: `components/home/Hero.tsx`
- Modify: `components/home/SectorGrid.tsx`
- Modify: `components/home/ReferencesStrip.tsx`
- Modify: `app/[locale]/request-quote/page.tsx` (eski teklif-iste/page.tsx)
- Modify: `app/[locale]/request-quote/standard/page.tsx` (eski teklif-iste/standart/page.tsx)
- Modify: `app/[locale]/request-quote/custom/page.tsx` (eski teklif-iste/ozel-uretim/page.tsx)

- [ ] **Step 1: Bütün kodda eski path referanslarını listele**

Run:
```bash
grep -rnE "\"/(urunler|sektorler|hakkimizda|iletisim|referanslar|teklif-iste)" --include="*.ts" --include="*.tsx" --include="*.json" app/ components/ lib/ messages/
```

- [ ] **Step 2: Her dosyada path'leri rename haritasına göre değiştir**

Dikkatli olman gereken substring çakışmaları:
- `/sektorler/cam-yikama` → `/sectors/bottle-washing` (önce alt path'i değiştir, sonra parent)
- `/sektorler/kapak` → `/sectors/caps`
- `/sektorler/tekstil` → `/sectors/textile`
- `/sektorler` → `/sectors` (alt path'ler değiştikten sonra)
- `/teklif-iste/ozel-uretim` → `/request-quote/custom`
- `/teklif-iste/standart` → `/request-quote/standard`
- `/teklif-iste` → `/request-quote`
- Tek-seviyeli: `/urunler` → `/products`, `/hakkimizda` → `/about`, `/iletisim` → `/contact`, `/referanslar` → `/references`

Search-and-replace her dosya için per-pattern. Örnek Header.tsx için sed kullanılabilir (dikkat: macOS sed in-place `-i ""`):

```bash
# Her path için ayrı replace
sed -i "" 's|/teklif-iste/ozel-uretim|/request-quote/custom|g' components/layout/Header.tsx
sed -i "" 's|/teklif-iste/standart|/request-quote/standard|g' components/layout/Header.tsx
sed -i "" 's|/teklif-iste|/request-quote|g' components/layout/Header.tsx
sed -i "" 's|/sektorler/cam-yikama|/sectors/bottle-washing|g' components/layout/Header.tsx
sed -i "" 's|/sektorler/kapak|/sectors/caps|g' components/layout/Header.tsx
sed -i "" 's|/sektorler/tekstil|/sectors/textile|g' components/layout/Header.tsx
sed -i "" 's|/sektorler|/sectors|g' components/layout/Header.tsx
sed -i "" 's|/urunler|/products|g' components/layout/Header.tsx
sed -i "" 's|/hakkimizda|/about|g' components/layout/Header.tsx
sed -i "" 's|/iletisim|/contact|g' components/layout/Header.tsx
sed -i "" 's|/referanslar|/references|g' components/layout/Header.tsx
```

Aynı sed blok her dosyada çalıştırılacak. Veya tek komut loop:

```bash
for f in components/layout/Header.tsx components/layout/Footer.tsx components/layout/LocaleSwitcher.tsx components/home/Hero.tsx components/home/SectorGrid.tsx components/home/ReferencesStrip.tsx app/\[locale\]/request-quote/page.tsx app/\[locale\]/request-quote/standard/page.tsx app/\[locale\]/request-quote/custom/page.tsx; do
  sed -i "" -e 's|/teklif-iste/ozel-uretim|/request-quote/custom|g' \
            -e 's|/teklif-iste/standart|/request-quote/standard|g' \
            -e 's|/teklif-iste|/request-quote|g' \
            -e 's|/sektorler/cam-yikama|/sectors/bottle-washing|g' \
            -e 's|/sektorler/kapak|/sectors/caps|g' \
            -e 's|/sektorler/tekstil|/sectors/textile|g' \
            -e 's|/sektorler|/sectors|g' \
            -e 's|/urunler|/products|g' \
            -e 's|/hakkimizda|/about|g' \
            -e 's|/iletisim|/contact|g' \
            -e 's|/referanslar|/references|g' "$f"
done
```

- [ ] **Step 3: Admin path için de güncelle**

```bash
grep -rn "/admin/ayarlar/bildirimler" --include="*.ts" --include="*.tsx" app/ components/ lib/ messages/
```
Bulunan dosyalarda `/admin/ayarlar/bildirimler` → `/admin/settings/notifications` replace et.

- [ ] **Step 4: Son tarama — eski path kalmış mı?**

Run:
```bash
grep -rnE "/(urunler|sektorler|hakkimizda|iletisim|referanslar|teklif-iste)\"|/(urunler|sektorler|hakkimizda|iletisim|referanslar|teklif-iste)[\"/]" --include="*.ts" --include="*.tsx" app/ components/ lib/ messages/
```
Expected: 0 satır (test dosyaları E2E Task 9'da güncellenecek).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(links): update internal Link href references to English slugs"
```

---

### Task 9: `next.config.ts` redirects() ekle

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: `redirects()` fonksiyonunu `nextConfig` object'ine ekle**

`next.config.ts` satır 6-20 arasındaki `nextConfig` nesnesine `async redirects()` property'si ekle:

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      // Public route'lar — locale-prefixed (tr|en|ru|ar)
      {
        source: "/:locale(tr|en|ru|ar)/urunler",
        destination: "/:locale/products",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/urunler/:rest*",
        destination: "/:locale/products/:rest*",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler/cam-yikama",
        destination: "/:locale/sectors/bottle-washing",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler/kapak",
        destination: "/:locale/sectors/caps",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler/tekstil",
        destination: "/:locale/sectors/textile",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/sektorler",
        destination: "/:locale/sectors",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/hakkimizda",
        destination: "/:locale/about",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/iletisim",
        destination: "/:locale/contact",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/referanslar",
        destination: "/:locale/references",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/teklif-iste/ozel-uretim",
        destination: "/:locale/request-quote/custom",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/teklif-iste/standart",
        destination: "/:locale/request-quote/standard",
        permanent: true,
      },
      {
        source: "/:locale(tr|en|ru|ar)/teklif-iste",
        destination: "/:locale/request-quote",
        permanent: true,
      },
      // Admin route
      {
        source: "/admin/ayarlar/bildirimler",
        destination: "/admin/settings/notifications",
        permanent: true,
      },
    ];
  },
};
```

- [ ] **Step 2: Dev server'da manuel doğrula**

Run: `pnpm dev &` (bekle 3 saniye) sonra:
```bash
curl -I http://localhost:3000/tr/urunler
```
Expected: `HTTP/1.1 308 Permanent Redirect` veya `301`, `Location: /tr/products`.

Kapat: `pkill -f 'next dev'`

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(redirects): add 301 redirects from Turkish to English slugs (next.config.ts)"
```

---

### Task 10: Mevcut E2E spec'leri güncelle

**Files:**
- Modify: `tests/e2e/contact.spec.ts`
- Modify: `tests/e2e/rfq-custom.spec.ts`
- Modify: `tests/e2e/rfq-standart.spec.ts`
- Modify: `tests/e2e/references.spec.ts`
- Modify: `tests/e2e/pages-smoke.spec.ts`
- Modify: `tests/e2e/i18n.spec.ts` (muhtemelen path'ler içeriyor)
- Modify: `tests/e2e/smoke.spec.ts` (muhtemelen path'ler içeriyor)
- Modify: `tests/e2e/not-found.spec.ts` (muhtemelen)
- Modify: `tests/e2e/admin.spec.ts` (admin path kontrolü varsa)

- [ ] **Step 1: E2E spec'lerde eski path referansları**

Run:
```bash
grep -rnE "\"/(urunler|sektorler|hakkimizda|iletisim|referanslar|teklif-iste)" tests/e2e/
grep -rn "/admin/ayarlar/bildirimler" tests/e2e/
```

- [ ] **Step 2: Task 8'deki sed bloğunu E2E spec'lerine de uygula**

```bash
for f in tests/e2e/*.spec.ts; do
  sed -i "" -e 's|/teklif-iste/ozel-uretim|/request-quote/custom|g' \
            -e 's|/teklif-iste/standart|/request-quote/standard|g' \
            -e 's|/teklif-iste|/request-quote|g' \
            -e 's|/sektorler/cam-yikama|/sectors/bottle-washing|g' \
            -e 's|/sektorler/kapak|/sectors/caps|g' \
            -e 's|/sektorler/tekstil|/sectors/textile|g' \
            -e 's|/sektorler|/sectors|g' \
            -e 's|/urunler|/products|g' \
            -e 's|/hakkimizda|/about|g' \
            -e 's|/iletisim|/contact|g' \
            -e 's|/referanslar|/references|g' \
            -e 's|/admin/ayarlar/bildirimler|/admin/settings/notifications|g' "$f"
done
```

- [ ] **Step 3: E2E test suite — tam çalıştır**

Run:
```bash
pnpm dev &
sleep 5
pnpm playwright test --reporter=list
```

Expected: Tüm spec'ler (url-redirects.spec.ts dahil ~63 spec) PASS.

Kapat: `pkill -f 'next dev'`

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): update pathname assertions for English slugs; add url-redirects spec"
```

---

### Task 11: Full build + test + lint yeşil

**Files:**
- Verify only

- [ ] **Step 1: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Unit tests**

Run: `pnpm test`
Expected: all 73+ tests pass.

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: build success, route list gösterilir:
```
Route (app)
/[locale]/products
/[locale]/products/[slug] (yoksa bu plan 4b'de ekleniyor — Plan 4a'da bu route yok)
/[locale]/sectors
/[locale]/sectors/bottle-washing
/[locale]/sectors/caps
/[locale]/sectors/textile
/[locale]/about
/[locale]/contact
/[locale]/references
/[locale]/request-quote
/[locale]/request-quote/custom
/[locale]/request-quote/standard
/admin/settings/notifications
```

Hiçbir eski path (`urunler`, `sektorler`, vs.) listede olmamalı.

- [ ] **Step 5: Sitemap manuel doğrula**

Run:
```bash
pnpm dev &
sleep 5
curl -s http://localhost:3000/sitemap.xml | grep -oE "<loc>[^<]+</loc>" | head -20
```

Expected: her URL `/products`, `/sectors`, `/about`, vs. içeriyor. Hiçbir `/urunler`, `/sektorler`, vs. yok.

Kapat: `pkill -f 'next dev'`

---

### Task 12: Push + CI yeşil

**Files:**
- Branch: `feat/plan4a-url-migration`

- [ ] **Step 1: Tüm commit'leri push et**

Run:
```bash
git push -u origin feat/plan4a-url-migration
```

- [ ] **Step 2: CI durumunu izle**

Run: `gh run watch` veya GitHub Actions tab'ında "URL Migration" run'unu takip et.

Expected: build + test job'ları GREEN. E2E job'u baseline env placeholder'larıyla geçiyor.

Eğer CI kırılırsa: log'u oku, sorunu fix et, push et, tekrar izle.

- [ ] **Step 3: PR aç (GitHub CLI ile)**

Run:
```bash
gh pr create --title "Plan 4a: Public URL'ler İngilizce'ye geçirildi" --body "$(cat <<'EOF'
## Summary
- 12 public route'u Türkçe'den İngilizce'ye rename (git mv ile history korunarak)
- 301 redirect kuralları next.config.ts'de (eski URL'ler Google index için korunur)
- Admin /admin/ayarlar/bildirimler → /admin/settings/notifications tutarlılık düzeltmesi
- lib/seo/routes.ts tek değişimle sitemap + hreflang otomatik güncellendi

Spec: docs/superpowers/specs/2026-04-21-plan4a-url-migration-design.md

## Test plan
- [x] pnpm typecheck clean
- [x] pnpm test (73+ unit) yeşil
- [x] pnpm playwright test (63 spec) yeşil (yeni url-redirects.spec.ts dahil)
- [x] pnpm build başarılı, route listesi yeni path'leri gösteriyor
- [x] Manuel: curl ile /tr/urunler → 301 /tr/products doğrulandı
- [ ] Merge sonrası Coolify redeploy
- [ ] Canlı smoke (Task 13)
- [ ] Google Search Console yeni sitemap submit (Task 13)
EOF
)"
```

- [ ] **Step 4: PR review + merge**

Kullanıcı review eder. Onay sonrası `gh pr merge --squash --delete-branch` veya GitHub UI'dan squash merge.

---

### Task 13: Deploy + canlı smoke + Search Console

**Files:**
- Verify only (canlı)

- [ ] **Step 1: Main'e checkout + pull**

```bash
git checkout main
git pull origin main
```

- [ ] **Step 2: Coolify redeploy**

Tarayıcıda `https://coolify.brtapps.dev/` aç → kitaplastik uygulaması → Redeploy butonu (cache'li yeter, force rebuild gerekmez).

Deployment log'unu izle — build + deploy ~3 dk.

- [ ] **Step 3: Canlı smoke — eski URL'ler 301 dönüyor mu?**

Run:
```bash
for old in /tr/urunler /en/sektorler/kapak /ru/hakkimizda /ar/iletisim /tr/teklif-iste/standart; do
  echo "=== $old ==="
  curl -sI "https://kitaplastik.com$old" | head -3
done
```

Expected: her URL `HTTP/2 308` (Next.js default) veya `301`, `location: ...` yeni path içeriyor.

- [ ] **Step 4: Canlı smoke — yeni URL'ler 200 dönüyor mu?**

Run:
```bash
for new in /tr/products /en/sectors/caps /ru/about /ar/contact /tr/request-quote/standard; do
  echo "=== $new ==="
  curl -sI "https://kitaplastik.com$new" | head -3
done
```

Expected: her URL `HTTP/2 200`.

- [ ] **Step 5: LocaleSwitcher regression (tarayıcıda manuel)**

- `https://kitaplastik.com/tr/products` aç
- Sağ üst TR dropdown'dan EN seç → `https://kitaplastik.com/en/products` açılmalı
- RU seç → `/ru/products`
- AR seç → `/ar/products` (RTL doğru)

- [ ] **Step 6: 4 locale × 11 route hızlı gezinti**

Tarayıcıda her locale için Header nav linklerine sırayla tıkla → her sayfa açılıyor, 404 yok.

- [ ] **Step 7: Google Search Console yeni sitemap submit**

- https://search.google.com/search-console → kitaplastik.com property
- Sitemaps → Remove old `sitemap.xml` (varsa) → Add new `sitemap.xml`
- Submit. Status "Success" olmalı.

- [ ] **Step 8: URL inspection (3 örnek eski URL)**

- Search Console → URL inspection
- `https://kitaplastik.com/tr/urunler` → "Page not indexed; redirected"
- `https://kitaplastik.com/en/hakkimizda` → aynı
- `https://kitaplastik.com/ar/iletisim` → aynı

Beklenen: Google redirect'i fark ediyor, yeni URL'i index'e almaya başlayacak.

- [ ] **Step 9: Bitiş durumu**

Plan 4a tamamlandı. Kabul kriterleri (spec "Kabul kriterleri" listesi) tek tek check.

---

## Self-Review (plan writer tarafından tamamlandı)

**Spec coverage:**
- Rename haritası → Task 3, 7, 8 (PUBLIC_ROUTES + klasör + internal link)
- 301 redirects → Task 9
- Sitemap güncelleme → Task 5 (otomatik)
- Test güncelleme → Task 2, 4, 6, 10
- CI yeşil → Task 11, 12
- Deploy + smoke → Task 13
- Google Search Console submit → Task 13 Step 7

**Placeholder scan:** clean (no TBD/TODO, no "add appropriate error handling").

**Type consistency:** `PUBLIC_ROUTES` array sabit tip `as const`, Task 3-6 içinde tutarlı. `Alternates` tipinde değişiklik yok.

**Zorluklar / dikkat:**
- Task 7 sed komutu sırası kritik — **önce alt path sonra parent**. Aksi halde `/sektorler` substring'i `/sektorler/cam-yikama`'yı bozar. Plan'da bu sıra korunmuş.
- Task 7 klasör rename'leri `sektorler` ve `teklif-iste` parent klasörler — alt klasörleri önce geçici bir dizine taşı, sonra parent rename et pattern'i kullanıldı (git history preserve).
- Task 10 admin E2E spec'i `admin.spec.ts` — admin authenticated flow `test.skip` olabilir; path güncellemesi yine de yapılmalı.
- macOS `sed -i ""` syntax (Linux'ta `sed -i ''`) — CI Linux runner'da pattern farklı olabilir; plan lokal macOS odaklı yazılı, gerekirse implementer uyarlayacak.
