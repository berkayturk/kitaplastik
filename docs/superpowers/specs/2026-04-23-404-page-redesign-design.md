# 404 Page Redesign — Design Spec

**Date:** 2026-04-23
**Status:** Approved, ready for implementation plan
**Scope:** Plan 5a'nın önüne sıkıştırılmış bağımsız iş paketi — 404 deneyiminin "dümdüz"den "refined industrial + recovery-focused"a çıkarılması
**Author:** Berkay + Claude (brainstorm)

---

## 1. Problem & Motivation

Mevcut 404 sayfası düz: büyük başlık + tek cümle + tek "Anasayfa" linki. B2B üretim firması için üç somut kayıp:

1. **Broken external link / eski katalog PDF linklerinden** gelen potansiyel müşteri kaybediliyor — recovery path yok.
2. **Marka tonu konuşmuyor** — "refined industrial" paletinin (cobalt/jade/paper) sesi yok, nötr ve kimliksiz.
3. **Broken link görünürlüğü yok** — hangi URL'lerin 404 ürettiğini bilmiyoruz, proaktif fix yapamıyoruz.

Hedef: (a) kullanıcıyı relevant conversion path'lerine ("Ürünler / Sektörler / Katalog iste / İletişim") geri kazanmak, (b) marka personality'sini sessiz bir blueprint estetiğiyle konuşturmak, (c) 404 trafiğini Sentry breadcrumb olarak gözlemlenebilir kılmak.

---

## 2. Scope & Non-goals

**Scope:**
- `app/[locale]/not-found.tsx` yeniden tasarlanır (4 locale: tr, en, ru, ar).
- `app/not-found.tsx` (root fallback) minimal 4-dil CTA sürümüne güncellenir.
- Yeni bileşenler: `components/not-found/NotFoundHero.tsx`, `BlueprintIllustration.tsx`, `RecoveryCards.tsx`, `NotFoundClientSignals.tsx`.
- i18n anahtarları (`messages/{tr,en,ru,ar}/common.json` → `notFound.*`) genişletilir.
- Sentry breadcrumb telemetrisi (404 navigation, level warning).
- Metadata: `robots: noindex, follow`, locale-aware title.
- Unit + E2E testler.

**Non-goals:**
- **Canlı search altyapısı** — arama kutusu eklenmez. 4 recovery kart aynı işi daha iyi sinyalle yapar.
- **Animasyon / motion** — statik SVG. `prefers-reduced-motion` problemi kendiliğinden yok.
- **Custom 410/500 treatment** — bu spec sadece 404. `error.tsx` ayrı konu.
- **Bot traffic filtering** — breadcrumb önce hamham gönderilir, Sentry'de noise olursa ileride referrer/UA filter eklenir (bu spec'in dışında).
- **Redirect önerileri (fuzzy match)** — "belki bunu kastettiniz" akıllı öneri yok; statik 4 kart.

---

## 3. Visual Design

### 3.1 Style direction — "Blueprint aesthetic"

Cobalt (#1E4DD8) + jade (#0FA37F) + paper (#FAFAF7) paleti ile teknik çizim / CAD sayfası tonu. Üretim firmasının mesleki dilini konuşur, plastik'i literal göstermez (cheesy değil).

### 3.2 Layout — desktop (≥1024px)

Tek container (`max-w-6xl`), iki satır:

**Satır 1 — Hero (padding py-20):**
- Sol kolon (8/12 grid):
  - Eyebrow: `HATA · 404` — cobalt, uppercase, tracking-wide, `text-xs`
  - H1 title: `Sayfa bulunamadı.` — `text-5xl lg:text-6xl`, `tracking-tight`, `font-semibold`, ink
  - Description: `max-w-xl`, `text-lg`, text-secondary
  - URL echo: `Aradığınız: <pathname>` — tertiary, `text-sm`, `font-mono`, truncate 250+ char → "…"
- Sağ kolon (4/12 grid):
  - `<BlueprintIllustration />` — 240×240 SVG

**Divider:** `1px` hairline (`--color-border-hairline`)

**Satır 2 — Recovery:**
- Eyebrow: `BELKİ BUNLAR?` (locale-translated), same eyebrow style
- 4 kart grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- Her kart: bordered card, hover accent, tam alan clickable (link wrap)

### 3.3 Layout — mobile (<640px)

- Hero tek kolon, illustration başlığın **altında** (sırayla: eyebrow, title, description, URL echo, illustration)
- Recovery kartlar `grid-cols-1` (tam genişlik stack)

### 3.4 Blueprint SVG spec

```
viewBox: 0 0 240 240
aria-hidden: true
role: presentation

Layer 1 — dot grid:
  12×12 matrix of circles, r=1, fill=#e7e5e0, opacity=0.6
  cx step = 20, cy step = 20, padding = 10

Layer 2 — industrial arc:
  M 60 120 A 60 60 0 0 1 180 120    (yarım daire, cobalt stroke)
  stroke: #1E4DD8, stroke-width: 1.5, stroke-linecap: round, fill: none

Layer 3 — vertical segment:
  M 120 60 L 120 180
  stroke: #1E4DD8, stroke-width: 1.5, stroke-linecap: round

Layer 4 — missing piece (jade dot):
  <circle cx=180 cy=120 r=5 fill=#0FA37F />
```

**RTL:** illustration simetrik, mirror/flip yok. Default `scaleX: 1`.

### 3.5 Recovery card spec

```
wrapper: <Link> (localized href)
  border: 1px solid var(--color-border-hairline)
  background: var(--color-bg-elevated) (white)
  padding: p-5 md:p-6
  border-radius: rounded-sm (matches brand)
  transition: border-color 150ms, background-color 150ms

hover/focus-visible:
  border-color: var(--color-accent-cobalt)
  background: var(--color-accent-cobalt-tint) (#eef2fe)

content (stacked):
  title: text-base, font-medium, ink
  description: text-sm, text-secondary
  arrow icon: text-cobalt, absolute bottom-right; RTL dir auto mirror via CSS logical property
```

4 kart içeriği (tr örneği; tüm locale'lere çevrilir):
| slug | title | desc | href |
|---|---|---|---|
| products | Ürünler | Tüm ürün ailesini inceleyin | `/products` |
| sectors | Sektörler | Cam yıkama · kapak · tekstil | `/sectors` |
| catalog | Katalog iste | PDF katalog talep formu | `/request-quote` |
| contact | İletişim | Bize ulaşın | `/contact` |

Href'ler `@/i18n/navigation` `Link` bileşeni ile → locale-aware slug (örn: TR için `/urunler`, EN için `/products`).

### 3.6 Root fallback (`app/not-found.tsx`)

Minimal, locale-agnostic. 4 dil tek satır CTA + tek cümle. Illustration **yok** (locale belirsiz → recovery link seçilemez).

```
<Container>
  <Stack>
    eyebrow:  ERROR · 404
    h1:       4 dilde tek satır: "Sayfa bulunamadı · Page not found · ..."
    single CTA: "Anasayfa · Home · الرئيسية · Главная"
      → href "/" (middleware locale detect edip yönlendirir)
  </Stack>
</Container>
```

---

## 4. Architecture

### 4.1 Component tree

```
app/[locale]/not-found.tsx           Server Component — orchestrator + metadata export
├── NotFoundHero                      Server — eyebrow, h1, description, URL echo slot
│   ├── BlueprintIllustration         Server — pure SVG
│   └── NotFoundClientSignals         "use client" — URL echo text + Sentry breadcrumb
└── RecoveryCards                     Server — 4 localized Link kart

app/not-found.tsx                     Server — minimal 4-lang fallback
components/not-found/
  ├── NotFoundHero.tsx                Server
  ├── BlueprintIllustration.tsx       Server, pure SVG
  ├── NotFoundClientSignals.tsx       "use client", usePathname + Sentry
  └── RecoveryCards.tsx               Server, 4 lokalize Link

lib/sentry/not-found.ts               Helper: sendNotFoundBreadcrumb(pathname, referrer)
```

**Karar — neden `NotFoundClientSignals` ayrı client island:**
Next.js 15 app router'da `not-found.tsx` server-rendered. `usePathname()` + Sentry breadcrumb ikisi de client API. Tek küçük client island ayrılır → kalan shell server-rendered, bundle minimum.

### 4.2 Data flow

```
request /tr/urunler/eski-slug
  → Next.js routing: unmatched → notFound() triggered
  → app/[locale]/not-found.tsx (server) renders with locale="tr"
    → HTTP status: 404 (Next.js default)
    → generateMetadata: { title: "404 — Kıta Plastik", robots: "noindex,follow" }
    → NotFoundHero + BlueprintIllustration + RecoveryCards (all server)
    → NotFoundClientSignals hydrates on client
       → reads usePathname() = "/tr/urunler/eski-slug"
       → truncates if >250 char
       → renders URL echo text
       → useEffect: Sentry.addBreadcrumb({ category: "navigation.404", level: "warning", message, data: { referrer } })
```

### 4.3 Fallback path handling

- `/xx/valid-locale/bad-slug` → `app/[locale]/not-found.tsx` (localized, full design)
- `/invalid-prefix/foo` → `app/not-found.tsx` (root fallback, 4-dil minimal)
- `/` + middleware locale detect fail → root fallback (edge case)

### 4.4 HTTP status verification

Next.js 15 app router, `not-found.tsx` dosyası otomatik 404 döner (documented behavior). `notFound()` function çağrısı ya da yakalanmayan segment trigger eder. **E2E'de doğrulanacak** — assumption test edilmeden teslim edilmez.

---

## 5. i18n

### 5.1 Key expansion — `messages/{tr,en,ru,ar}/common.json`

Mevcut:
```json
"notFound": { "title": "...", "description": "...", "home": "..." }
```

Genişletilmiş:
```json
"notFound": {
  "eyebrow": "HATA · 404",
  "title": "Sayfa bulunamadı",
  "description": "Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.",
  "urlEchoLabel": "Aradığınız:",
  "home": "Anasayfaya dön",
  "recoveryTitle": "BELKİ BUNLAR?",
  "cards": {
    "products":  { "title": "Ürünler",       "desc": "Tüm ürün ailesini inceleyin" },
    "sectors":   { "title": "Sektörler",     "desc": "Cam yıkama · kapak · tekstil" },
    "catalog":   { "title": "Katalog iste",  "desc": "PDF katalog talep formu" },
    "contact":   { "title": "İletişim",      "desc": "Bize ulaşın" }
  }
}
```

Toplam: **4 locale × ~9 yeni key = 36 çeviri**. AR diacritics + RTL doğrulanır (full orthographic correctness kuralı, CLAUDE rules).

### 5.2 Root fallback strings

`app/not-found.tsx` hardcoded 4-dil string (çeviri değil, tek karışık satır) — bunlar component içinde sabit, i18n anahtar **değil** (çünkü locale belirsiz).

### 5.3 Localized Link targets

`RecoveryCards` `@/i18n/navigation` Link bileşeni kullanır, href olarak internal route (`/products`) verir — next-intl `pathnames` config'i (halihazırda var) slug'ları locale'e göre çevirir (`/urunler`, `/produktsiya`, `/al-muntajat`).

---

## 6. Telemetry — Sentry breadcrumb

### 6.1 Why breadcrumb, not error event

- **Maliyet:** Sentry plan 5a Faz 1'de canlı; 404 trafiği (bot + insan) error event olsa quota yerdi.
- **Sinyal:** Breadcrumb son 100 event'e eklenir; bir sonraki gerçek error event'te context olarak görünür → broken link korelasyonu için yeterli.
- **Standalone monitoring:** Ek dashboard için ileride Plausible custom event eklenir (bu spec'in dışında). Şimdilik Sentry breadcrumb minimum viable.

### 6.2 Implementation

```ts
// lib/sentry/not-found.ts
import * as Sentry from "@sentry/nextjs";

export function sendNotFoundBreadcrumb(pathname: string, referrer: string | null): void {
  Sentry.addBreadcrumb({
    category: "navigation.404",
    level: "warning",
    message: `404: ${pathname}`,
    data: { referrer },
  });
}
```

```tsx
// components/not-found/NotFoundClientSignals.tsx
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendNotFoundBreadcrumb } from "@/lib/sentry/not-found";

const MAX_ECHO_LEN = 250;

interface Props { label: string; }

export function NotFoundClientSignals({ label }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;
    sendNotFoundBreadcrumb(pathname, referrer);
  }, [pathname]);

  if (!pathname) return null;
  const display = pathname.length > MAX_ECHO_LEN
    ? `${pathname.slice(0, MAX_ECHO_LEN)}…`
    : pathname;

  return (
    <p className="text-text-tertiary font-mono text-sm">
      {label} <span className="break-all">{display}</span>
    </p>
  );
}
```

**Güvenlik:** `pathname` browser-supplied, React otomatik escape → XSS riski yok. Query string `usePathname()` dönmez, token leak yok.

---

## 7. Accessibility

- `<h1>` unique ve sayfa başlığı
- Recovery region: `<nav aria-labelledby="recovery-title">` + `<h2 id="recovery-title" className="sr-only">...</h2>` (veya eyebrow `role="heading"`)
- Illustration: `<svg aria-hidden="true" role="presentation">`
- All links: focus-visible ring cobalt (mevcut Tailwind utility)
- Color contrast:
  - ink (#0A0F1E) on paper (#FAFAF7) — **AAA** (21:1)
  - text-secondary (#525A6B) on paper — **AA large**, body'de OK
  - text-tertiary (#8B94A5) on paper — **AA** (check in test; URL echo küçük ama dekoratif bilgi)
- RTL: `dir="rtl"` document level (mevcut layout); CSS logical properties (margin-inline-start vs ml) zaten kullanılıyor
- Keyboard: tab order hero → 4 recovery card sırayla

---

## 8. Testing

### 8.1 Unit tests (Vitest)

**`components/not-found/BlueprintIllustration.test.tsx`:**
- Renders `<svg aria-hidden="true">`
- Contains 144 (`12*12`) `<circle>` dot grid elements
- Contains cobalt path + jade dot

**`components/not-found/RecoveryCards.test.tsx`:**
- Renders exactly 4 `<Link>` elements
- Each has translated title + desc (test TR locale)
- Hrefs map correctly to `/products`, `/sectors`, `/request-quote`, `/contact`

**`components/not-found/NotFoundClientSignals.test.tsx`:**
- URL echo truncates at 250 chars with "…"
- Short path renders as-is
- Sentry `addBreadcrumb` called on mount with correct payload (mocked `@sentry/nextjs`)
- No render when pathname null

### 8.2 E2E tests (Playwright)

**`tests/e2e/not-found.spec.ts`:**

Per-locale matrix (`for each of ["tr","en","ru","ar"]`):
- GET `/${locale}/definitely-not-a-page`
- Assert HTTP status === 404 (via `response.status()`)
- Assert `<h1>` matches `notFound.title` translation
- Assert 4 recovery cards visible
- Assert URL echo shows the bad path
- For `ar`: assert `<html dir="rtl">` present

Root fallback test:
- GET `/totally-invalid-path` (no locale prefix) → middleware redirect veya root `not-found.tsx`?
- **Decision to validate during implementation:** middleware behavior check edilecek, test ona göre yazılır. Implementation öncesi `tests/fixtures/` altında expected behavior net.

### 8.3 Coverage target

80%+ kritik path (component render + i18n + Sentry hook). Edge case: very long URL, RTL.

---

## 9. Risks & open questions

**R1 — Next.js 15 HTTP status assumption**
Teoride `not-found.tsx` otomatik 404 döner ama pathnames config + middleware katmanı kenarda edge case yaratabilir. **Mitigation:** E2E test implementation'da ilk yazılır, kırmızı olursa `notFound()` call chain eklenir. Risk low.

**R2 — Sentry breadcrumb noise**
Bot 404'leri breadcrumb quota'yı etkilemez ama 404 sonrası bir error event fırlarsa breadcrumb context'te görünür — bu beklenti. Quota etkisi sıfır (breadcrumb ≠ event). Risk low.

**R3 — AR illustration simetri**
SVG simetrik tasarlandı ama göz testi RTL'de yapılmalı. **Mitigation:** E2E `ar` locale'de screenshot diff (opsiyonel, Playwright snapshot) veya manuel review.

**R4 — Localized link verification**
next-intl `pathnames` TR/EN/RU/AR'da slug farklılığı var. `<Link href="/products">` render'da doğru slug'a çevirilmeli. **Mitigation:** E2E her locale'de recovery kart href'ini `expect(...).toHaveAttribute("href", "/tr/urunler")` şeklinde assert eder.

**Open (plan phase'de netleşir):**
- [ ] Root `app/not-found.tsx`'de middleware locale detect edebilir mi yoksa gerçek minimal 4-lang fallback mi render olur? → Implementation'da test edilip karar verilir.
- [ ] Plausible 404 custom event (out of scope — plan 5c analytics phase'de).

---

## 10. Acceptance Criteria

Bu iş paketi "done" sayılır ⇔:

1. **Visual:**
   - [ ] `/tr/foo-yok` → yeni tasarım (eyebrow + big title + description + URL echo + blueprint SVG + 4 recovery card) görünür
   - [ ] `/ar/foo-yok` → RTL düzgün, illustration simetrik
   - [ ] Mobile (<640px) stack düzen doğru
   - [ ] Recovery kart hover → cobalt tint, focus ring cobalt

2. **i18n:**
   - [ ] 4 locale (tr, en, ru, ar) × 9 yeni key eklendi, hiçbiri İngilizce fallback göstermiyor
   - [ ] AR diacritics tam (örn. `الصفحة` düzgün), orthographic check geçti
   - [ ] Recovery kart href'leri locale'e göre doğru slug: TR `/urunler`, EN `/products`, RU `/produktsiya`, AR `/al-muntajat`

3. **Telemetry:**
   - [ ] 404 visit sonrası Sentry breadcrumb görünür (manual trigger error + check issue context)
   - [ ] Error event fırlamıyor (Sentry issue oluşmuyor)

4. **HTTP:**
   - [ ] Response status 404 (browser DevTools + Playwright assert)
   - [ ] `<meta name="robots" content="noindex,follow">` present

5. **Quality:**
   - [ ] Unit test coverage ≥80% on new components
   - [ ] E2E 4 locale × 404 spec yeşil (CI + local parity — feedback rule)
   - [ ] `pnpm verify` (full CI-mirror) yeşil push öncesi

6. **Root fallback:**
   - [ ] `/definitely-invalid` (no locale prefix) minimal 4-lang fallback veya middleware redirect — beklenti test edilmiş ve dokümante

---

## 11. Out-of-scope follow-ups

Plan 5c'ye eklenebilir (catalog request analytics dashboard dışında):
- Plausible `404 view` custom event (referrer-segmented dashboard)
- Admin panel'de "son 30 gün 404 URL listesi" (Sentry breadcrumb scrape veya Plausible event filter)
- Fuzzy slug redirect — `/urunler/eski-slug` → en yakın geçerli slug'ı öner (Levenshtein)

Bunlar bu spec'in dışında, separately ticket edilir.
