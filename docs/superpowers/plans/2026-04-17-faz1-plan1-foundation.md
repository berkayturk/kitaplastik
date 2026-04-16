# Kıta Plastik MVP — Plan 1: Foundation + Design System + Anasayfa İskelet

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Çalışır halde Next.js 15 + Tailwind 4 + shadcn/ui + Supabase iskeleti. Tek dilli (TR) minimal anasayfa Vercel'de deploy edilebilir, tüm geliştirme tooling'i (test, lint, format, CI) hazır.

**Architecture:** Tek Next.js App Router projesi. Server Components varsayılan, Client Components gerektiğinde işaretli. Tailwind 4 (CSS-based config, `@theme` directive) + shadcn/ui (new-york preset). Supabase istemci/sunucu helper'ları kurulu (henüz tablo yok). Test pyramid: Vitest (unit/component) + Playwright (E2E smoke). CI: GitHub Actions install/lint/typecheck/build/test job zinciri.

**Tech Stack:** Next.js 15, React 19, TypeScript 5 strict, Tailwind CSS 4, shadcn/ui (Radix), Supabase (`@supabase/ssr`), pnpm 9, Vitest 2, Playwright 1.4x, ESLint 9, Prettier 3.

**Bu plan'ın kapsamında OLAN:**
- Repo bootstrap, tooling, CI
- Next.js + TS strict + Tailwind 4 + shadcn/ui kurulumu
- Industrial Precision design tokens (renk, font, spacing) Tailwind theme'inde
- Self-hosted Inter + JetBrains Mono
- Supabase client/server helper iskeleti
- Layout componentleri (`Container`, `Header`, `Footer`) iskeleti
- Anasayfa iskeleti (Hero placeholder, sektör grid placeholder) — TR-only, 3D yok, içerikler statik metin
- Logo placeholder SVG (Plan 2'de cilalı SVG ile değişecek)
- 404 sayfası
- Vercel deploy konfigürasyonu (CSP headers iskeleti)
- E2E smoke test
- README

**Bu plan'ın kapsamında OLMAYAN (gelecek planlar):**
- **Plan 2:** i18n (4 dil), translate.py pipeline, glossary, atmosferik 3D hero (R3F + shader), kalan 7 public sayfa, gerçek logo SVG, gerçek anasayfa içerik blokları
- **Plan 3:** RFQ formları, Supabase tabloları + RLS, admin auth (magic link), admin paneli (inbox, ürün/sektör CRUD), Resend, Cloudflare Turnstile
- **Plan 4:** SEO (hreflang, sitemap, OG, Schema.org), Plausible, Sentry, performans optimizasyonu, Lighthouse, Playwright E2E senaryoları, manuel test, üretim deploy

**Spec:** `docs/superpowers/specs/2026-04-16-kitaplastik-website-design.md`

---

## File Structure

Bu plan'da oluşturulacak/değiştirilecek dosyalar:

**Create — repo / config:**
- `.gitignore`
- `.nvmrc`
- `README.md`
- `package.json`
- `pnpm-lock.yaml` (otomatik)
- `tsconfig.json`
- `next.config.ts`
- `next-env.d.ts` (otomatik)
- `postcss.config.mjs`
- `eslint.config.mjs`
- `.prettierrc`
- `.prettierignore`
- `vitest.config.ts`
- `vitest.setup.ts`
- `playwright.config.ts`
- `components.json` (shadcn)
- `vercel.json`
- `.env.example`

**Create — kaynak kod:**
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `app/not-found.tsx`
- `components/ui/button.tsx` (shadcn)
- `components/ui/card.tsx` (shadcn)
- `components/layout/Container.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/home/Hero.tsx`
- `components/home/SectorGrid.tsx`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/utils.ts`
- `tests/unit/utils.test.ts`
- `tests/unit/components/Container.test.tsx`
- `tests/e2e/smoke.spec.ts`

**Create — public assets:**
- `public/logo/kita-logo-placeholder.svg`
- `public/fonts/Inter-Variable.woff2`
- `public/fonts/JetBrainsMono-Variable.woff2`

**Create — CI:**
- `.github/workflows/ci.yml`

---

## Task 1: Git Repo Bootstrap

**Files:**
- Create: `.gitignore`, `README.md`

- [ ] **Step 1: Working dir kontrol ve git init**

```bash
cd /Users/bt/claude/kitaplastik
git init
git branch -M main
```

Expected output: `Initialized empty Git repository in /Users/bt/claude/kitaplastik/.git/`

- [ ] **Step 2: .gitignore oluştur**

Create `.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.*.local
!.env.example

# Misc
.DS_Store
*.pem
.vercel

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Testing
coverage/
playwright-report/
test-results/
.playwright/

# Editor
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
*.swp

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Superpowers brainstorming artifacts
.superpowers/

# OS
Thumbs.db
```

- [ ] **Step 3: README oluştur**

Create `README.md`:

```markdown
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

Önkoşul: Node 22, pnpm 9.

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
```

- [ ] **Step 4: İlk commit**

```bash
git add .gitignore README.md
git commit -m "chore: initial repo bootstrap"
```

Expected: `[main (root-commit) ...] chore: initial repo bootstrap`

---

## Task 2: pnpm + Node Sürüm Kilidi

**Files:**
- Create: `.nvmrc`, `package.json`

- [ ] **Step 1: Node sürümünü kontrol et**

```bash
node --version
```

Expected: `v22.x.x`. Eğer farklıysa: `nvm install 22 && nvm use 22`

- [ ] **Step 2: pnpm kurulu mu kontrol et**

```bash
pnpm --version
```

Expected: `9.x.x`. Eğer yoksa: `npm install -g pnpm@9`

- [ ] **Step 3: .nvmrc oluştur**

Create `.nvmrc`:

```
20
```

- [ ] **Step 4: package.json oluştur (initial)**

Create `package.json`:

```json
{
  "name": "kitaplastik",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": ">=22",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write \"**/*.{ts,tsx,md,json,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,md,json,css}\""
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add .nvmrc package.json
git commit -m "chore: lock node 22 and pnpm 9"
```

---

## Task 3: Next.js 15 + TypeScript Bootstrap

**Files:**
- Create: `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Next.js + React + TypeScript install**

```bash
pnpm add next@latest react@latest react-dom@latest
pnpm add -D typescript @types/node @types/react @types/react-dom
```

Expected: `+ next 15.x`, `+ react 19.x`, `+ react-dom 19.x` paketleri.

- [ ] **Step 2: tsconfig.json oluştur (strict)**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: next.config.ts oluştur**

Create `next.config.ts`:

```typescript
import type { NextConfig } from "next";

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
};

export default nextConfig;
```

- [ ] **Step 4: app/ klasörü ve temel dosyalar**

Create `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kıta Plastik · 1989'dan beri Bursa",
  description:
    "Plastik enjeksiyonun mühendislik partneri. Cam yıkama, kapak ve tekstil sektörlerine üretim.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
```

Create `app/page.tsx`:

```typescript
export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Kıta Plastik</h1>
      <p className="mt-2 text-text-secondary">
        Foundation kuruluyor — Plan 1 in progress.
      </p>
    </main>
  );
}
```

Create `app/globals.css` (Tailwind kurulumundan önce minimal):

```css
/* Tailwind 4 import Task 7'de eklenecek */
:root {
  color-scheme: dark;
}

html,
body {
  margin: 0;
  padding: 0;
}
```

- [ ] **Step 5: Dev server'ı çalıştır ve doğrula**

```bash
pnpm dev
```

Expected: `▲ Next.js 15.x.x · Local: http://localhost:3000` mesajı, hatasız başlama.

Tarayıcıda http://localhost:3000 → "Kıta Plastik" başlığı görünmeli (Tailwind henüz yok, stil minimal).

Ctrl+C ile dev server'ı kapat.

- [ ] **Step 6: Type check**

```bash
pnpm typecheck
```

Expected: hata yok, exit code 0.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: bootstrap Next.js 15 with TypeScript strict"
```

---

## Task 4: ESLint Setup

**Files:**
- Create: `eslint.config.mjs`

- [ ] **Step 1: ESLint paketlerini yükle**

```bash
pnpm add -D eslint eslint-config-next @eslint/js typescript-eslint
```

- [ ] **Step 2: eslint.config.mjs oluştur (Flat config)**

Create `eslint.config.mjs`:

```javascript
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      ".superpowers/**",
    ],
  },
];
```

`pnpm add -D @eslint/eslintrc` (FlatCompat için).

- [ ] **Step 3: Lint çalıştır**

```bash
pnpm lint
```

Expected: ya temiz ya da minimal düzeltilebilir uyarı. Eğer "Cannot find module" hatası gelirse `pnpm install` tekrar.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs package.json pnpm-lock.yaml
git commit -m "chore: configure ESLint flat config"
```

---

## Task 5: Prettier Setup

**Files:**
- Create: `.prettierrc`, `.prettierignore`

- [ ] **Step 1: Prettier yükle**

```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

- [ ] **Step 2: .prettierrc oluştur**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: .prettierignore oluştur**

Create `.prettierignore`:

```
.next/
node_modules/
pnpm-lock.yaml
public/
*.min.js
*.min.css
playwright-report/
test-results/
.superpowers/
```

- [ ] **Step 4: Format çalıştır**

```bash
pnpm format
```

Expected: Tüm dosyalar biçimlendirilir, "All matched files use Prettier code style!" benzeri mesaj.

- [ ] **Step 5: Format-check çalıştır**

```bash
pnpm format:check
```

Expected: Exit 0.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: add Prettier with Tailwind plugin"
```

---

## Task 6: Tailwind CSS 4 Install

**Files:**
- Modify: `app/globals.css`, `package.json`
- Create: `postcss.config.mjs`

- [ ] **Step 1: Tailwind 4 yükle**

```bash
pnpm add -D tailwindcss @tailwindcss/postcss
```

Expected: `+ tailwindcss 4.x.x`, `+ @tailwindcss/postcss 4.x.x`

- [ ] **Step 2: postcss.config.mjs oluştur**

Create `postcss.config.mjs`:

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 3: app/globals.css'i Tailwind import ile güncelle**

Replace `app/globals.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
}

html,
body {
  margin: 0;
  padding: 0;
}
```

- [ ] **Step 4: Dev server'ı çalıştır ve Tailwind çalıştığını doğrula**

`app/page.tsx` zaten `text-4xl font-bold` kullanıyor. Tarayıcıda http://localhost:3000 → büyük başlık görünmeli (Tailwind class çalışıyor).

```bash
pnpm dev
```

Tarayıcı kontrolü → Ctrl+C ile kapat.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: install Tailwind CSS 4"
```

---

## Task 7: Industrial Precision Design Tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Design token'ları globals.css'e ekle**

Replace `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Industrial Precision palette — spec Bölüm 5.2 */
  --color-bg-primary: #0a1628;
  --color-bg-secondary: #1a2540;
  --color-bg-elevated: #1f3a5f;
  --color-surface-light: #f7f8fa;
  --color-surface-card: #ffffff;
  --color-border-subtle-dark: #2a3a52;
  --color-border-subtle-light: #d8dde5;
  --color-text-primary: #e6ebf2;
  --color-text-primary-light: #0a1628;
  --color-text-secondary: #8ba4c5;
  --color-text-secondary-light: #5a6878;
  --color-accent-blue: #5b8fc7;
  --color-accent-cyan: #7fb0e0;
  --color-accent-red: #b8252e;
  --color-accent-green: #1f9e6b;

  /* Sektör temaları */
  --color-sector-cam: #5b8fc7;
  --color-sector-kapak: #b8a040;
  --color-sector-tekstil: #8a5fb8;

  /* Tipografi (font-face Task 8'de yüklenecek) */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "SFMono-Regular", "Menlo", monospace;
  --font-arabic: "IBM Plex Sans Arabic", "Inter", sans-serif;

  /* Border radius — Industrial Precision keskin köşeler */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
}

:root {
  color-scheme: dark;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: var(--font-sans);
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: app/page.tsx'i token'larla güncelle**

Replace `app/page.tsx`:

```typescript
export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="font-mono text-xs uppercase tracking-widest text-accent-blue">
        — 1989'dan beri / Bursa
      </div>
      <h1 className="mt-3 text-5xl font-bold tracking-tight">Kıta Plastik</h1>
      <p className="mt-3 max-w-md text-text-secondary">
        Plastik enjeksiyonun mühendislik partneri. Cam yıkama, kapak ve tekstil
        sektörlerine üretim.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Dev server'da görsel kontrol**

```bash
pnpm dev
```

Tarayıcıda http://localhost:3000 → koyu lacivert arka plan, açık metin, mavi mono etiket görünmeli. Ctrl+C ile kapat.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/page.tsx
git commit -m "feat: add Industrial Precision design tokens"
```

---

## Task 8: Self-hosted Fonts (Inter + JetBrains Mono)

**Files:**
- Create: `public/fonts/Inter-Variable.woff2`, `public/fonts/JetBrainsMono-Variable.woff2`
- Modify: `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Fontları indir**

```bash
mkdir -p public/fonts
curl -L "https://github.com/rsms/inter/raw/master/docs/font-files/InterVariable.woff2" -o public/fonts/Inter-Variable.woff2
curl -L "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/variable/JetBrainsMono%5Bwght%5D.woff2" -o public/fonts/JetBrainsMono-Variable.woff2
```

Expected: İki dosya `public/fonts/` altında, her biri ~200-400KB.

İndirme başarısız olursa alternatif: `https://fonts.bunny.net` veya `npm i @fontsource-variable/inter @fontsource-variable/jetbrains-mono` ile npm üzerinden.

- [ ] **Step 2: app/layout.tsx'te next/font/local ile yükle**

Replace `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../public/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const jetbrainsMono = localFont({
  src: "../public/fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "100 800",
});

export const metadata: Metadata = {
  title: "Kıta Plastik · 1989'dan beri Bursa",
  description:
    "Plastik enjeksiyonun mühendislik partneri. Cam yıkama, kapak ve tekstil sektörlerine üretim.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: globals.css'te font-family değerlerini variable kullanacak şekilde güncelle**

`app/globals.css` içindeki `@theme` bloğunda:

```css
  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-jetbrains-mono), "SFMono-Regular", "Menlo", monospace;
```

Diğer satırlar aynı kalır.

- [ ] **Step 4: Dev server'da font yüklendiğini doğrula**

```bash
pnpm dev
```

Tarayıcıda DevTools → Computed → font-family Inter görmelisin (system fallback değil). Ctrl+C ile kapat.

- [ ] **Step 5: Commit**

```bash
git add public/fonts/ app/layout.tsx app/globals.css
git commit -m "feat: self-host Inter and JetBrains Mono variable fonts"
```

---

## Task 9: shadcn/ui Init + lib/utils.ts

**Files:**
- Create: `components.json`, `lib/utils.ts`
- Modify: `tsconfig.json` (yol alias kontrol)

- [ ] **Step 1: shadcn dependencies yükle**

```bash
pnpm add clsx tailwind-merge class-variance-authority lucide-react
pnpm add -D @types/node
```

- [ ] **Step 2: lib/utils.ts oluştur (cn helper)**

Create `lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: components.json oluştur**

Create `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 4: shadcn'in beklediği renk değişkenlerini globals.css'e ekle**

`app/globals.css`'e (mevcut `@theme` bloğunun ALTINA) ekle:

```css
@layer base {
  :root {
    /* shadcn baseColor: slate, dark mode varsayılan */
    --background: 220 47% 10%;
    --foreground: 217 25% 92%;
    --card: 218 42% 15%;
    --card-foreground: 217 25% 92%;
    --popover: 218 42% 15%;
    --popover-foreground: 217 25% 92%;
    --primary: 357 67% 44%;
    --primary-foreground: 0 0% 98%;
    --secondary: 218 42% 20%;
    --secondary-foreground: 217 25% 92%;
    --muted: 218 30% 18%;
    --muted-foreground: 215 20% 65%;
    --accent: 218 42% 25%;
    --accent-foreground: 217 25% 92%;
    --destructive: 0 65% 45%;
    --destructive-foreground: 0 0% 98%;
    --border: 218 25% 25%;
    --input: 218 25% 22%;
    --ring: 211 53% 57%;
    --radius: 0.125rem;
  }
}
```

- [ ] **Step 5: İlk shadcn componentini ekle (button)**

```bash
pnpm dlx shadcn@latest add button card
```

Expected: `components/ui/button.tsx` ve `components/ui/card.tsx` oluşturulur.

Eğer komut interactive sorarsa: style=new-york, base color=slate, css variables=yes seç.

- [ ] **Step 6: Type check**

```bash
pnpm typecheck
```

Expected: Hata yok.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: setup shadcn/ui with button and card components"
```

---

## Task 10: Vitest + Testing Library Kurulumu

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `tests/unit/utils.test.ts`

- [ ] **Step 1: Test paketlerini yükle**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: vitest.config.ts oluştur**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 3: vitest.setup.ts oluştur**

Create `vitest.setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: İlk failing test yaz (TDD — RED)**

Create `tests/unit/utils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn helper", () => {
  it("birleştirir basit class string'lerini", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("falsy değerleri filtreler", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("Tailwind çakışmalarında son class'ı korur", () => {
    expect(cn("p-4 p-8")).toBe("p-8");
  });

  it("conditional object syntax destekler", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe(
      "text-red-500",
    );
  });
});
```

- [ ] **Step 5: Test çalıştır — pass etmeli (cn zaten Task 9'da yazıldı)**

```bash
pnpm test
```

Expected: 4 passed, 0 failed.

- [ ] **Step 6: tsconfig.json'a vitest types ekle (test dosyalarında globals)**

Modify `tsconfig.json`'da `"types"` eklemek için `compilerOptions` içine:

```json
    "types": ["vitest/globals", "@testing-library/jest-dom"],
```

(Eğer `types` zaten varsa, sadece bu iki entry'yi ekle.)

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "test: setup Vitest with Testing Library and first cn helper test"
```

---

## Task 11: Playwright E2E Setup

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `.gitignore` (zaten ekli)

- [ ] **Step 1: Playwright yükle**

```bash
pnpm add -D @playwright/test
pnpm dlx playwright install chromium
```

- [ ] **Step 2: playwright.config.ts oluştur**

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: İlk smoke test yaz (TDD — RED)**

Create `tests/e2e/smoke.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Anasayfa smoke", () => {
  test("anasayfa açılır ve marka adı görünür", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Kıta Plastik",
    );
  });

  test("1989 etiketi görünür", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/1989'dan beri/i)).toBeVisible();
  });
});
```

- [ ] **Step 4: E2E test çalıştır**

```bash
pnpm test:e2e
```

Expected: 2 passed (Playwright dev server'ı kendisi başlatır).

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: setup Playwright with anasayfa smoke test"
```

---

## Task 12: Supabase Client/Server Helpers + .env.example

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `.env.example`

- [ ] **Step 1: Supabase paketlerini yükle**

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: .env.example oluştur**

Create `.env.example`:

```
# Supabase (Plan 3'te tablolar oluşturulduktan sonra gerçek değerler)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudflare Turnstile (Plan 3)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Resend (Plan 3)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@kitaplastik.com

# Anthropic (Plan 2 — translate.py için CI'da)
ANTHROPIC_API_KEY=

# Plausible (Plan 4)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com

# Sentry (Plan 4)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

- [ ] **Step 3: lib/supabase/client.ts oluştur (browser client)**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ortam değişkenleri tanımlı olmalı.",
    );
  }

  return createBrowserClient(url, key);
}
```

- [ ] **Step 4: lib/supabase/server.ts oluştur (server client + cookies)**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ortam değişkenleri tanımlı olmalı.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component'ten çağrılırsa cookie set edilemez — middleware kontrol eder.
        }
      },
    },
  });
}
```

- [ ] **Step 5: .env.local'i geliştirici için kopyala (gitignored)**

```bash
cp .env.example .env.local
```

Not: `.env.local` gitignore'da, commit edilmez. Geliştirici Supabase project oluşturduktan sonra (Plan 3 başında) gerçek değerleri buraya yazar.

- [ ] **Step 6: Type check (henüz tablo type'ları yok ama import çalışır)**

```bash
pnpm typecheck
```

Expected: Hata yok.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase .env.example package.json pnpm-lock.yaml
git commit -m "feat: add Supabase client/server helpers and env template"
```

---

## Task 13: Container Layout Component (TDD)

**Files:**
- Create: `components/layout/Container.tsx`, `tests/unit/components/Container.test.tsx`

- [ ] **Step 1: Failing test yaz (RED)**

Create `tests/unit/components/Container.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "@/components/layout/Container";

describe("Container", () => {
  it("children'ı render eder", () => {
    render(
      <Container>
        <span>içerik</span>
      </Container>,
    );
    expect(screen.getByText("içerik")).toBeInTheDocument();
  });

  it("varsayılan max-width container class'ını uygular", () => {
    const { container } = render(
      <Container>
        <span>x</span>
      </Container>,
    );
    expect(container.firstChild).toHaveClass("mx-auto");
    expect(container.firstChild).toHaveClass("max-w-7xl");
  });

  it("custom className'i merge eder", () => {
    const { container } = render(
      <Container className="bg-red-500">
        <span>x</span>
      </Container>,
    );
    expect(container.firstChild).toHaveClass("bg-red-500");
    expect(container.firstChild).toHaveClass("max-w-7xl");
  });

  it("as prop ile farklı element render eder", () => {
    render(
      <Container as="section" data-testid="ctn">
        <span>x</span>
      </Container>,
    );
    expect(screen.getByTestId("ctn").tagName).toBe("SECTION");
  });
});
```

- [ ] **Step 2: Test çalıştır — fail etmeli**

```bash
pnpm test
```

Expected: `Container.test.tsx` failed — "Cannot find module '@/components/layout/Container'".

- [ ] **Step 3: Container componentini yaz (GREEN)**

Create `components/layout/Container.tsx`:

```typescript
import { cn } from "@/lib/utils";
import type { HTMLAttributes, ElementType } from "react";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function Container<T extends ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: ContainerProps<T>) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}
```

- [ ] **Step 4: Test tekrar çalıştır — pass etmeli**

```bash
pnpm test
```

Expected: Container ile ilgili 4 test pass.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Container.tsx tests/unit/components/Container.test.tsx
git commit -m "feat(layout): add Container component with TDD"
```

---

## Task 14: Header Skeleton Component

**Files:**
- Create: `components/layout/Header.tsx`, `tests/unit/components/Header.test.tsx`

- [ ] **Step 1: Failing test yaz (RED)**

Create `tests/unit/components/Header.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

describe("Header", () => {
  it("logo veya marka adı görünür", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText(/KITA/i)).toBeInTheDocument();
  });

  it("ana navigasyon link'leri içerir", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: /ana menü/i });
    expect(nav).toBeInTheDocument();
  });

  it("Teklif İste CTA butonu görünür", () => {
    render(<Header />);
    expect(
      screen.getByRole("link", { name: /teklif iste/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test fail doğrula**

```bash
pnpm test tests/unit/components/Header.test.tsx
```

Expected: Module not found.

- [ ] **Step 3: Header componentini yaz (GREEN)**

Create `components/layout/Header.tsx`:

```typescript
import Link from "next/link";
import { Container } from "./Container";

const NAV_ITEMS = [
  { href: "/sektorler", label: "Sektörler" },
  { href: "/urunler", label: "Ürünler" },
  { href: "/muhendislik", label: "Mühendislik" },
  { href: "/atolye", label: "Atölye" },
  { href: "/kalite", label: "Kalite" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function Header() {
  return (
    <header className="border-b border-[var(--color-border-subtle-dark)] bg-bg-primary/95 backdrop-blur-sm sticky top-0 z-40">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Kıta Plastik anasayfa"
          >
            <span className="text-2xl font-black tracking-tight text-[var(--color-accent-red)]">
              KITA
            </span>
            <span className="hidden text-xs font-medium uppercase tracking-widest text-text-secondary sm:inline">
              Plastik · Tekstil
            </span>
          </Link>
          <nav
            aria-label="Ana menü"
            className="hidden items-center gap-6 lg:flex"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/teklif-iste"
            className="rounded-sm bg-[var(--color-accent-red)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Teklif İste
          </Link>
        </div>
      </Container>
    </header>
  );
}
```

- [ ] **Step 4: Test tekrar çalıştır**

```bash
pnpm test
```

Expected: Tüm testler pass.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Header.tsx tests/unit/components/Header.test.tsx
git commit -m "feat(layout): add Header skeleton with nav and CTA"
```

---

## Task 15: Footer Skeleton Component

**Files:**
- Create: `components/layout/Footer.tsx`, `tests/unit/components/Footer.test.tsx`

- [ ] **Step 1: Failing test yaz**

Create `tests/unit/components/Footer.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("contentinfo role'üyle render olur", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("şirketin tam yasal adını içerir", () => {
    render(<Footer />);
    expect(
      screen.getByText(/KITA PLASTİK ve TEKSTİL SAN\. TİC\. LTD\. ŞTİ\./i),
    ).toBeInTheDocument();
  });

  it("güncel yıl + 1989'dan beri kuruluş yılını gösterir", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`1989.*${currentYear}|${currentYear}.*1989`)),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test fail doğrula**

```bash
pnpm test tests/unit/components/Footer.test.tsx
```

Expected: Module not found.

- [ ] **Step 3: Footer componentini yaz**

Create `components/layout/Footer.tsx`:

```typescript
import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border-subtle-dark)] bg-bg-secondary mt-24">
      <Container>
        <div className="grid gap-8 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-mono text-xs uppercase tracking-widest text-accent-blue">
              — 1989'dan beri Bursa
            </div>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-[var(--color-accent-red)]">
              KITA
            </h3>
            <p className="mt-4 max-w-md text-sm text-text-secondary">
              Plastik enjeksiyonun mühendislik partneri. Cam yıkama, kapak ve
              tekstil sektörlerine üretim.
            </p>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-text-secondary">
              Site
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/sektorler" className="hover:text-text-primary">
                  Sektörler
                </Link>
              </li>
              <li>
                <Link href="/urunler" className="hover:text-text-primary">
                  Ürünler
                </Link>
              </li>
              <li>
                <Link href="/muhendislik" className="hover:text-text-primary">
                  Mühendislik
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="hover:text-text-primary">
                  Hakkımızda
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-text-secondary">
              İletişim
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/iletisim" className="hover:text-text-primary">
                  İletişim sayfası
                </Link>
              </li>
              <li>
                <Link href="/teklif-iste" className="hover:text-text-primary">
                  Teklif iste
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--color-border-subtle-dark)] py-6 text-xs text-text-secondary">
          <p>
            KITA PLASTİK ve TEKSTİL SAN. TİC. LTD. ŞTİ. — Bursa, Türkiye
          </p>
          <p className="mt-1 font-mono">
            © 1989—{currentYear} · Tüm hakları saklıdır
          </p>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 4: Test tekrar çalıştır**

```bash
pnpm test
```

Expected: Tüm testler pass.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Footer.tsx tests/unit/components/Footer.test.tsx
git commit -m "feat(layout): add Footer skeleton with company info"
```

---

## Task 16: Anasayfa Hero Placeholder

**Files:**
- Create: `components/home/Hero.tsx`, `tests/unit/components/Hero.test.tsx`

- [ ] **Step 1: Failing test yaz**

Create `tests/unit/components/Hero.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/home/Hero";

describe("Hero", () => {
  it("ana başlığı render eder", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toHaveTextContent(/mühendislik partneri/i);
  });

  it("1989 etiketi görünür", () => {
    render(<Hero />);
    expect(screen.getByText(/1989'dan beri/i)).toBeInTheDocument();
  });

  it("iki CTA içerir (custom + standart)", () => {
    render(<Hero />);
    expect(
      screen.getByRole("link", { name: /özel üretim/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /standart ürün/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test fail doğrula**

```bash
pnpm test tests/unit/components/Hero.test.tsx
```

- [ ] **Step 3: Hero componentini yaz (3D YOK — sadece statik gradient placeholder)**

Create `components/home/Hero.tsx`:

```typescript
import Link from "next/link";
import { Container } from "../layout/Container";

export function Hero() {
  return (
    <section
      aria-label="Anasayfa hero"
      className="relative overflow-hidden border-b border-[var(--color-border-subtle-dark)]"
    >
      {/* Atmosferik 3D placeholder — Plan 2'de R3F + custom shader ile değişecek */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,#1f3a5f_0%,#0a1628_60%,#050a14_100%)]"
      />
      <Container>
        <div className="relative py-24 md:py-32 lg:py-40">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent-cyan">
            — 1989'dan beri / Bursa, Türkiye
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            Plastik enjeksiyonun{" "}
            <span className="text-[var(--color-accent-cyan)]">
              mühendislik partneri.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-text-secondary">
            36 yıllık üretim deneyimi · 3 sektör · 4 dilde küresel B2B
            tedarik. Bursa atölyemizden cam yıkama, kapak ve tekstil
            sektörlerine üretim ve özel mühendislik.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/teklif-iste/ozel-uretim"
              className="rounded-sm bg-[var(--color-accent-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Özel Üretim Teklifi
            </Link>
            <Link
              href="/teklif-iste/standart"
              className="rounded-sm border border-[var(--color-accent-blue)] px-6 py-3 text-sm font-semibold text-[var(--color-accent-blue)] transition-colors hover:bg-[var(--color-accent-blue)]/10"
            >
              Standart Ürün Talebi
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Test pass doğrula**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add components/home/Hero.tsx tests/unit/components/Hero.test.tsx
git commit -m "feat(home): add Hero placeholder section"
```

---

## Task 17: SectorGrid Placeholder Component

**Files:**
- Create: `components/home/SectorGrid.tsx`, `tests/unit/components/SectorGrid.test.tsx`

- [ ] **Step 1: Failing test yaz**

Create `tests/unit/components/SectorGrid.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectorGrid } from "@/components/home/SectorGrid";

describe("SectorGrid", () => {
  it("3 sektör kartını render eder", () => {
    render(<SectorGrid />);
    expect(screen.getByText(/cam yıkama/i)).toBeInTheDocument();
    expect(screen.getByText(/^kapak$/i)).toBeInTheDocument();
    expect(screen.getByText(/^tekstil$/i)).toBeInTheDocument();
  });

  it("her kart bir Link içerir", () => {
    render(<SectorGrid />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Test fail doğrula**

```bash
pnpm test tests/unit/components/SectorGrid.test.tsx
```

- [ ] **Step 3: SectorGrid componentini yaz**

Create `components/home/SectorGrid.tsx`:

```typescript
import Link from "next/link";
import { Container } from "../layout/Container";

const SECTORS = [
  {
    slug: "cam-yikama",
    title: "Cam Yıkama",
    description:
      "Endüstriyel cam yıkama makineleri için yüksek dayanıklı bileşenler.",
    color: "var(--color-sector-cam)",
  },
  {
    slug: "kapak",
    title: "Kapak",
    description: "Endüstriyel ve ambalaj sektörü için plastik kapaklar.",
    color: "var(--color-sector-kapak)",
  },
  {
    slug: "tekstil",
    title: "Tekstil",
    description:
      "Tekstil makinaları ve aksesuarları için özel plastik parçalar.",
    color: "var(--color-sector-tekstil)",
  },
];

export function SectorGrid() {
  return (
    <section className="py-20" aria-label="Sektörler">
      <Container>
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-accent-blue">
              Sector / 01—03
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Üç sektör. Tek atölye.
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {SECTORS.map((sector) => (
            <Link
              key={sector.slug}
              href={`/sektorler/${sector.slug}`}
              className="group block rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-secondary p-6 transition-colors hover:border-[var(--color-accent-blue)]"
            >
              <div
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: sector.color }}
              >
                Sector
              </div>
              <h3 className="mt-3 text-2xl font-semibold">{sector.title}</h3>
              <p className="mt-3 text-sm text-text-secondary">
                {sector.description}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent-blue)] transition-transform group-hover:translate-x-1">
                Detaya git →
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Test pass doğrula**

```bash
pnpm test
```

- [ ] **Step 5: Commit**

```bash
git add components/home/SectorGrid.tsx tests/unit/components/SectorGrid.test.tsx
git commit -m "feat(home): add SectorGrid with 3 sector cards"
```

---

## Task 18: Anasayfa Birleştirme + Layout Wrapping

**Files:**
- Modify: `app/page.tsx`, `app/layout.tsx`

- [ ] **Step 1: Layout'a Header + Footer ekle**

Replace `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = localFont({
  src: "../public/fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const jetbrainsMono = localFont({
  src: "../public/fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "100 800",
});

export const metadata: Metadata = {
  title: "Kıta Plastik · 1989'dan beri Bursa",
  description:
    "Plastik enjeksiyonun mühendislik partneri. Cam yıkama, kapak ve tekstil sektörlerine üretim.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg-primary text-text-primary antialiased">
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: app/page.tsx'i Hero + SectorGrid kompozisyonu yap**

Replace `app/page.tsx`:

```typescript
import { Hero } from "@/components/home/Hero";
import { SectorGrid } from "@/components/home/SectorGrid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SectorGrid />
    </>
  );
}
```

- [ ] **Step 3: Dev server'da görsel doğrulama**

```bash
pnpm dev
```

Tarayıcıda http://localhost:3000 → Header + Hero (gradient + başlık + 2 CTA) + SectorGrid (3 kart) + Footer görünmeli. Ctrl+C ile kapat.

- [ ] **Step 4: Tüm testleri çalıştır**

```bash
pnpm test && pnpm test:e2e
```

Expected: Tüm unit testler pass, E2E smoke testler pass.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat(home): compose anasayfa with Hero and SectorGrid"
```

---

## Task 19: 404 Sayfası

**Files:**
- Create: `app/not-found.tsx`, `tests/e2e/not-found.spec.ts`

- [ ] **Step 1: Failing E2E test yaz**

Create `tests/e2e/not-found.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("404 sayfası anlamlı bir hata mesajı gösterir", async ({ page }) => {
  const response = await page.goto("/var-olmayan-sayfa");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/sayfa bulunamadı/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /anasayfaya dön/i }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Test fail doğrula**

```bash
pnpm test:e2e tests/e2e/not-found.spec.ts
```

Expected: Test fails — varsayılan Next.js 404 sayfası farklı mesaj gösterir.

- [ ] **Step 3: not-found.tsx oluştur**

Create `app/not-found.tsx`:

```typescript
import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-accent-blue">
          Error · 404
        </div>
        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Sayfa bulunamadı
        </h1>
        <p className="mt-4 max-w-md text-text-secondary">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-sm bg-[var(--color-accent-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Anasayfaya dön
        </Link>
      </div>
    </Container>
  );
}
```

- [ ] **Step 4: Test pass doğrula**

```bash
pnpm test:e2e tests/e2e/not-found.spec.ts
```

Expected: Pass.

- [ ] **Step 5: Commit**

```bash
git add app/not-found.tsx tests/e2e/not-found.spec.ts
git commit -m "feat: add custom 404 page"
```

---

## Task 20: Logo Placeholder SVG

**Files:**
- Create: `public/logo/kita-logo-placeholder.svg`

- [ ] **Step 1: Placeholder logo SVG oluştur (Plan 2'de cilalı versiyona değişecek)**

Create `public/logo/kita-logo-placeholder.svg`:

```xml
<svg viewBox="0 0 320 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kıta Plastik">
  <g transform="translate(50,55)">
    <circle r="38" fill="none" stroke="#0e3265" stroke-width="2.5"/>
    <ellipse rx="38" ry="12" fill="none" stroke="#0e3265" stroke-width="1.5"/>
    <ellipse rx="12" ry="38" fill="none" stroke="#0e3265" stroke-width="1.5"/>
    <path d="M-14,-18 Q-2,-26 8,-18 Q12,-10 4,-6 Q-12,-4 -18,-10 Z" fill="#1f9e6b"/>
    <path d="M-22,8 Q-6,4 2,14 Q-6,22 -20,22 Z" fill="#1f9e6b"/>
  </g>
  <text x="100" y="55" font-family="Helvetica Neue, Arial, sans-serif" font-size="44" font-weight="900" fill="#b8252e" letter-spacing="-1">KITA</text>
  <g transform="translate(102,68)">
    <rect x="0" y="0" width="92" height="14" rx="7" fill="#0e3265"/>
    <text x="46" y="10" font-family="Helvetica Neue, Arial, sans-serif" font-size="9" fill="white" font-weight="700" letter-spacing="1" text-anchor="middle">1989'DAN BERİ</text>
  </g>
</svg>
```

- [ ] **Step 2: Header'da logo SVG'sini referans verecek şekilde güncelle (opsiyonel — şimdilik metinle kalsın, Plan 2'de Image component ile değişecek)**

Bu adımda Header'a SVG eklemiyoruz — Plan 2'de gerçek logo + lokalizasyonla beraber gelecek. Şimdilik `public/logo/` altında dosya olarak yer alıyor olması yeterli.

- [ ] **Step 3: Commit**

```bash
git add public/logo/kita-logo-placeholder.svg
git commit -m "chore: add logo placeholder SVG (Plan 2 will replace)"
```

---

## Task 21: Vercel Deploy Configuration

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: vercel.json oluştur (CSP iskeleti)**

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

Not: Tam Content-Security-Policy header'ı Plan 4'te eklenecek (Plausible, Sentry, Turnstile domain'leri belli olduktan sonra).

- [ ] **Step 2: README'ye deploy notları ekle**

`README.md`'ye dosyanın sonuna ekle:

```markdown

## Deploy

Vercel'e deploy:

1. Vercel hesabı oluştur ve GitHub repo'yu import et.
2. Project Settings → Environment Variables → `.env.example`'daki değerleri ekle (gerçek değerler).
3. Build command: `pnpm build` (otomatik algılanır).
4. Domain: kitaplastik.com → Vercel'e CNAME / A record (Vercel dashboard'dan DNS talimatları gösterir).

İlk deploy sonrası SSL otomatik aktive olur.
```

- [ ] **Step 3: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: add Vercel deploy config and README notes"
```

---

## Task 22: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: CI workflow oluştur**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  install-and-check:
    name: install + lint + typecheck + test + build
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Format check
        run: pnpm format:check

      - name: Unit tests
        run: pnpm test

      - name: Security audit
        run: pnpm audit --audit-level=high --prod
        continue-on-error: false

      - name: Build
        run: pnpm build

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: install-and-check

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm dlx playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions for lint/typecheck/test/build/e2e"
```

---

## Task 23: Final Smoke — Lokal End-to-End Doğrulama

**Files:** (değişiklik yok, sadece komutlar)

- [ ] **Step 1: Tüm tooling'i temiz state'ten çalıştır**

```bash
rm -rf .next node_modules
pnpm install --frozen-lockfile
```

Expected: Clean install başarılı.

- [ ] **Step 2: Lint + format + typecheck + unit test sırayla**

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
```

Expected: Hepsi exit 0.

- [ ] **Step 3: Production build**

```bash
pnpm build
```

Expected: `✓ Compiled successfully`, hata yok, route listesi `/` ve `/_not-found`.

- [ ] **Step 4: E2E test**

```bash
pnpm test:e2e
```

Expected: 3 passed (smoke 2 + not-found 1).

- [ ] **Step 5: Production sunucuyu başlat ve manuel kontrol**

```bash
pnpm start
```

Tarayıcıda http://localhost:3000 ile manuel kontrol:

- Header görünüyor (KITA + nav + Teklif İste butonu)
- Hero görünüyor (1989 etiketi, başlık, iki CTA, koyu gradient arka plan)
- SectorGrid 3 kart (cam yıkama, kapak, tekstil)
- Footer görünüyor (KITA + tam yasal ad + © 1989—{currentYear})
- Tarayıcı sekmesi başlığı: "Kıta Plastik · 1989'dan beri Bursa"
- DevTools → Network: Inter ve JetBrains Mono fontları yükleniyor
- DevTools → Console: hata yok

Ctrl+C ile kapat.

- [ ] **Step 6: Git status temiz mi**

```bash
git status
```

Expected: `nothing to commit, working tree clean`

- [ ] **Step 7: Git log'da tüm commit'ler**

```bash
git log --oneline
```

Expected: Yaklaşık 22-23 commit, hepsi conventional commit formatında.

- [ ] **Step 8: GitHub remote ekle ve push (eğer remote varsa)**

```bash
# Remote yoksa GitHub'da repo aç (private), URL'i not al, sonra:
git remote add origin git@github.com:USERNAME/kitaplastik.git
git push -u origin main
```

Expected: Branch ve commit'ler GitHub'a gider. CI workflow tetiklenir.

GitHub Actions sekmesinde CI run'ını kontrol et — yeşil olmalı (install + lint + typecheck + test + build + audit + e2e).

---

## Task 24: Husky + lint-staged Pre-commit Hooks

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json`

- [ ] **Step 1: Husky + lint-staged yükle**

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

Expected: `.husky/pre-commit` dosyası oluşur, `package.json`'a `"prepare": "husky"` script eklenir.

- [ ] **Step 2: package.json'a lint-staged config ekle**

`package.json`'a (en alt seviyede, scripts'ten sonra) ekle:

```json
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
```

- [ ] **Step 3: .husky/pre-commit içeriğini güncelle**

Replace `.husky/pre-commit`:

```bash
pnpm exec lint-staged
```

- [ ] **Step 4: Test et — sahte değişiklik commit'i**

```bash
echo "// test" >> app/page.tsx
git add app/page.tsx
git commit -m "test: husky smoke" --dry-run
```

Expected: lint-staged çalışır, ESLint + Prettier düzeltir.

Geri al:

```bash
git checkout app/page.tsx
```

- [ ] **Step 5: Commit**

```bash
git add .husky package.json pnpm-lock.yaml
git commit -m "chore: add Husky and lint-staged pre-commit hooks"
```

---

## Task 25: Type-Safe Env Validation (zod)

**Files:**
- Create: `lib/env.ts`, `tests/unit/env.test.ts`
- Modify: `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: zod yükle (henüz yoksa — Plan 3'te de kullanılacak)**

```bash
pnpm add zod
```

- [ ] **Step 2: Failing test yaz (RED)**

Create `tests/unit/env.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("geçerli env değişkenleriyle parse eder", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-xyz";
    const { env } = await import("@/lib/env");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-key-xyz");
  });

  it("eksik zorunlu değişken için anlamlı hata fırlatır", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-xyz";
    await expect(import("@/lib/env")).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("geçersiz URL formatı için hata fırlatır", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-xyz";
    await expect(import("@/lib/env")).rejects.toThrow(/url/i);
  });
});
```

- [ ] **Step 3: Test fail doğrula**

```bash
pnpm test tests/unit/env.test.ts
```

Expected: `Cannot find module '@/lib/env'`.

- [ ] **Step 4: lib/env.ts oluştur (GREEN)**

Create `lib/env.ts`:

```typescript
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  // Server-only değişkenler ileriki planlarda eklenecek (RESEND_API_KEY, vb.)
});

const isServer = typeof window === "undefined";

const schema = isServer ? serverEnvSchema : publicEnvSchema;

const result = schema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Geçersiz veya eksik ortam değişkenleri:\n${issues}\n\n` +
      `Lütfen .env.local dosyanızı .env.example'a göre doldurun.`,
  );
}

export const env = result.data;
```

- [ ] **Step 5: Test pass doğrula**

```bash
pnpm test tests/unit/env.test.ts
```

Expected: 3 passed.

- [ ] **Step 6: Supabase helper'ları env üzerinden tüket**

Replace `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

Replace `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'ten çağrılırsa cookie set edilemez — middleware kontrol eder.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 7: Type check + tüm testler**

```bash
pnpm typecheck && pnpm test
```

Expected: hata yok, tüm testler pass.

- [ ] **Step 8: Commit**

```bash
git add lib/env.ts tests/unit/env.test.ts lib/supabase/
git commit -m "feat: add zod-based type-safe env validation"
```

---

## Plan 1 Tamamlandı — Çıktı Özeti

✅ Çalışır halde Next.js 15 + Tailwind 4 + shadcn/ui projesi
✅ Industrial Precision design tokens (renk + tipografi + spacing)
✅ Self-hosted Inter + JetBrains Mono variable fonts
✅ Layout iskeleti: Container, Header (nav + CTA), Footer (yasal ad + 1989—{year})
✅ Anasayfa iskeleti: Hero placeholder (3D yerine gradient) + SectorGrid (3 kart)
✅ Custom 404 sayfası
✅ Supabase client/server helpers + .env.example
✅ Vitest unit testler (cn helper, 4 component testi)
✅ Playwright E2E smoke testleri (3 test)
✅ ESLint + Prettier + TypeScript strict
✅ Husky + lint-staged pre-commit hooks
✅ Type-safe env validation (zod)
✅ GitHub Actions CI (install → lint → typecheck → format → test → build → audit → e2e)
✅ Vercel deploy config + README

**Plan 2 (sıradaki):** i18n (next-intl, 4 dil), translate.py + glossary, atmosferik 3D hero (R3F + custom shader), kalan 7 public sayfa, gerçek logo SVG.

---

## Self-Review Notları

**Spec coverage kontrolü:**

| Spec bölümü | Plan 1'de karşılanan | Sonraki plan |
|---|---|---|
| §5.1 Logo | Placeholder SVG (Task 20) | Plan 2 — cilalı versiyon |
| §5.2 Renk paleti (Industrial Precision) | ✅ Tüm tokens (Task 7) | — |
| §5.3 Tipografi | ✅ Inter + JetBrains Mono (Task 8) | Plan 2 — Arabic font |
| §5.4 Spacing/grid/border | ✅ (Task 7, Container Task 13) | — |
| §5.5 Bileşen stilleri | shadcn button + card init (Task 9) | Diğer componentler ihtiyaç oldukça |
| §6 3D plan | Hero placeholder (Task 16) | **Plan 2** — R3F + shader |
| §7 i18n | — | **Plan 2** — next-intl + translate.py |
| §8 RFQ | — | **Plan 3** |
| §9 Veri modeli | Supabase client iskeleti (Task 12) | **Plan 3** — tablolar + RLS |
| §10 Admin | — | **Plan 3** |
| §11 Mimari | ✅ Next.js + Supabase iskelet | — |
| §12 Tech stack | ✅ Plan 1 kapsamındaki paketler | Geri kalanı sonraki planlar |
| §13 Geliştirme süreci | ✅ CI iskelet (Task 22) | Plan 4 — deploy + monitoring |
| §14 Test stratejisi | ✅ Vitest + Playwright iskelet | Plan 4 — E2E senaryoları |
| §15 Performans / SEO / A11y | Lighthouse hedefleri henüz ölçülmedi | **Plan 4** |
| §16 Güvenlik | CSP partial (Task 21) | Plan 4 — tam CSP |
| §17 Lansman fazları | — | Plan 4 |

**Placeholder taraması:** TBD/TODO bulunmadı. Her step'te exact code, exact command, expected output var.

**Type consistency:** `cn` helper, `Container`, `Header`, `Footer`, `Hero`, `SectorGrid` adlandırma tutarlı. `createClient` (Supabase) hem client hem server'da aynı isim — Next.js dokümantasyonuna uygun.

---

**Plan yazarı:** Claude (Opus 4.7) — superpowers:writing-plans skill
