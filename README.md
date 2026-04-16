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
