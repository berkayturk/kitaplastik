# Kıta Plastik

Kıta Plastik ve Tekstil San. Tic. Ltd. Şti. (Bursa, 1989'dan beri) için kurumsal web sitesi.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase (Postgres + Storage + Auth)
- next-intl (i18n: TR/EN/RU/AR — Plan 2'de eklenecek)
- react-three-fiber (atmosferik 3D — Plan 2'de eklenecek)
- Vercel (hosting)

## Geliştirme

Önkoşul: Node 22 LTS, pnpm 9.

```bash
pnpm install
cp .env.example .env.local  # değerleri doldur
pnpm dev
```

Tarayıcıda: http://localhost:3000

## Komutlar

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — üretim build
- `pnpm start` — üretim sunucusu
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript kontrol
- `pnpm test` — Vitest unit + component testleri
- `pnpm test:watch` — Vitest watch mode
- `pnpm test:e2e` — Playwright E2E testleri
- `pnpm format` — Prettier ile biçimlendir

## Dokümantasyon

- Spec: `docs/superpowers/specs/`
- Planlar: `docs/superpowers/plans/`

## Deploy

Vercel'e deploy:

1. Vercel hesabı oluştur ve GitHub repo'yu import et.
2. Project Settings → Environment Variables → `.env.example`'daki değerleri ekle (gerçek değerler).
3. Build command: `pnpm build` (otomatik algılanır).
4. Domain: kitaplastik.com → Vercel'e CNAME / A record (Vercel dashboard'dan DNS talimatları gösterir).

İlk deploy sonrası SSL otomatik aktive olur.

## Uluslararasılaştırma (i18n)

Site 4 dili destekler: **TR** (kaynak), **EN**, **RU**, **AR** (RTL). Tüm public sayfalar `app/[locale]/` altındadır ve middleware kök isteği `/tr`'ye redirect eder.

- **Kaynak dil:** TR (`messages/tr/*.json`)
- **Çeviriler:** EN/RU/AR JSON'ları `messages/{lang}/*.json`. İçerik güncellemesi için TR'yi düzenleyip Claude session'ı ile kalan dilleri güncelleyiniz. `glossary.json` teknik terim rehberidir (50+ terim).
- **RTL:** Arapça locale'de `<html dir="rtl">`, Tailwind logical utilities (`ms-/me-/ps-/pe-`) otomatik davranır. `rtl-flip` utility'si ile ikonları aynalayın.
- **Sitemap / hreflang:** `app/sitemap.ts` otomatik 4 dil alternatifleri üretir; `/sitemap.xml` 48 URL (12 route × 4 locale).

## 3D Atmosferik Hero

Anasayfa Hero'da custom GLSL shader — `react-three-fiber` + özel perlin noise + flow + light particles. Kritik detaylar:

- `dynamic({ ssr: false })` ile lazy-load (three chunk ~100 KB gzipped).
- **Fallback tetikleyicileri:** `prefers-reduced-motion: reduce`, `navigator.connection.saveData`, `hardwareConcurrency < 4`, WebGL yokluğu → CSS gradient fallback (`HeroFallback`).
- Perf hedefi: 60fps desktop / 30fps mobile.
- Shader dosyaları: `components/three/shaders/index.ts` içinde TS template literal.

## Referanslar

Anasayfa above-the-fold'da **ReferencesStrip** (8 müşteri logosu) + `/referanslar` detay sayfası. Veri şu an `lib/references/data.ts`'de mock — Plan 3'te Supabase `clients` tablosuna taşınır (interface sabit kalır).

## Yeni İçerik Ekleme (TR → EN/RU/AR)

1. Sadece `messages/tr/*.json` dosyasını düzenleyin (kaynak dil).
2. `glossary.json`'u kontrol edin — yeni teknik terim varsa ekleyin.
3. Claude session açıp `messages/{en,ru,ar}/*.json`'u TR'ye göre güncellemesini isteyin.
4. Değişiklikleri commit edin. CI testlerini çalıştırın (`pnpm test`, `pnpm typecheck`).
