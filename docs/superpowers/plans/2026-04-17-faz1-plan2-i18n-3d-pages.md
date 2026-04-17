# Faz 1 — Plan 2: i18n + 3D Hero + Referanslar + 8 Public Sayfa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kıta Plastik sitesini 4 dilli (TR/EN/RU/AR, AR RTL) hâle getir, atmosferik 3D hero ekle, anasayfa ilk açılışta görünür **Referanslar** şeridi ver, 8 public sayfayı tamamla ve logoyu cilala.

**Architecture:**
- `next-intl` v3+ ile `[locale]` route segment + middleware → TR default, 4 dil subdirectory. Kök `/` → `/tr` redirect.
- Mesaj dosyaları `messages/{tr,en,ru,ar}/*.json` namespace hiyerarşisi. **Çevirileri bu session'da direkt Claude yazar — Python script / Anthropic API pipeline YOK, Plan 3'e kadar ertelendi.**
- 3D Hero: `react-three-fiber` + `@react-three/drei` + custom GLSL shader, `dynamic({ ssr: false })` lazy-load, WebGL / reduce-motion / saveData fallback.
- Referanslar: anasayfada hero'nun **hemen altında above-the-fold logo strip** + detaylı `/[locale]/referanslar` sayfası. Başlangıçta 8 mock müşteri logosu (SVG, anonim markalar; gerçek listeler Plan 3'te Supabase'e taşınır).

**Tech Stack:**
- next-intl ^3.28 (stable, React Server Components uyumlu)
- three ^0.170, @react-three/fiber ^8.18, @react-three/drei ^9.120, @types/three
- @fontsource-variable/noto-sans-arabic (IBM Plex Arabic variable yok, Noto Arabic variable mevcut ve self-host-friendly)
- Mevcut: Tailwind 4.2.2 logical properties (ms-/me-/ps-/pe-) zaten destekleniyor; ayrı plugin gerekmez.

**Önemli kararlar:**
- Kullanıcı onayı: "hepsini sen (Claude) yap" — TR JSON'ları ve 3 hedef dilin çevirileri plan execution sırasında implementer subagent tarafından doğrudan yazılır. Glossary JSON (in-repo reference) tutulur ama runtime/CI kullanmaz.
- Referanslar için mock data (`lib/references/data.ts`) — Plan 3'te Supabase `clients` tablosuna migrate edilecek. Mock interface aynı kalır → Plan 3 sadece data source değişir.
- 3D Hero sadece anasayfa için uygulanır. Sektör hub + custom mühendislik 3D varyantları Faz 2 (spec §17.2) kapsamında.

---

## File Structure

**Yeni dosyalar:**
```
app/[locale]/layout.tsx                 Locale-aware layout (replaces app/layout.tsx for localized routes)
app/[locale]/page.tsx                   Anasayfa (moves from app/page.tsx)
app/[locale]/referanslar/page.tsx       Referanslar detay sayfası
app/[locale]/sektorler/page.tsx         Sektörler hub
app/[locale]/sektorler/cam-yikama/page.tsx
app/[locale]/sektorler/kapak/page.tsx
app/[locale]/sektorler/tekstil/page.tsx
app/[locale]/urunler/page.tsx
app/[locale]/muhendislik/page.tsx
app/[locale]/atolye/page.tsx
app/[locale]/kalite/page.tsx
app/[locale]/hakkimizda/page.tsx
app/[locale]/iletisim/page.tsx
app/[locale]/not-found.tsx              Localized 404
app/sitemap.ts                          hreflang-aware sitemap
app/robots.ts

middleware.ts                           next-intl middleware
i18n/routing.ts                         Locale list + pathnames config
i18n/request.ts                         getRequestConfig for RSC
i18n/navigation.ts                      Typed Link/redirect wrappers

lib/references/data.ts                  Mock müşteri referansları (SVG yolları + meta)
lib/references/types.ts                 Reference interface
lib/rtl.ts                              isRtl(locale) helper

components/layout/LocaleSwitcher.tsx    4-dil dropdown (Header'a eklenir)
components/home/ReferencesStrip.tsx     Anasayfa above-the-fold logo strip
components/references/ReferenceCard.tsx Detay sayfası için
components/three/HeroCanvas.tsx         R3F canvas (dynamic import entry)
components/three/AtmosphericMesh.tsx    Plane + shader material
components/three/shaders/atmospheric.frag.glsl
components/three/shaders/atmospheric.vert.glsl
components/three/HeroFallback.tsx       CSS gradient fallback
components/three/useReducedMotion.ts    Reduce-motion + WebGL + saveData detect hook

messages/tr/common.json
messages/tr/home.json
messages/tr/nav.json
messages/tr/sectors.json
messages/tr/references.json
messages/tr/pages.json                  urunler, muhendislik, atolye, kalite, hakkimizda, iletisim birleşik
messages/en/{common,home,nav,sectors,references,pages}.json
messages/ru/{common,home,nav,sectors,references,pages}.json
messages/ar/{common,home,nav,sectors,references,pages}.json

glossary.json                           50+ teknik terim referansı (dev reference, runtime kullanmaz)

public/logo/kita-logo.svg               Cilalı final logo (replaces kita-logo-placeholder.svg)
public/references/*.svg                 8 mock müşteri logosu (grayscale-friendly)

tests/unit/i18n/routing.test.ts
tests/unit/lib/rtl.test.ts
tests/unit/components/LocaleSwitcher.test.tsx
tests/unit/components/ReferencesStrip.test.tsx
tests/unit/components/HeroFallback.test.tsx
tests/unit/lib/references.test.ts
tests/e2e/i18n.spec.ts
tests/e2e/references.spec.ts
tests/e2e/pages-smoke.spec.ts
```

**Silinecek/taşınacak dosyalar:**
```
app/layout.tsx           → içerik app/[locale]/layout.tsx'e taşınır, bu dosya sadece root <html> skeleton kalır (locale bilinmediği için RootLayout minimal olur).
app/page.tsx             → app/[locale]/page.tsx'e taşınır
app/not-found.tsx        → kalır (root 404, locale-unaware); [locale]/not-found.tsx localized mesaj gösterir
public/logo/kita-logo-placeholder.svg → silinir (Task 32'de kita-logo.svg ile değiştirilir)
components/home/Hero.tsx → içerik 3D Canvas entegrasyonuyla güncellenir (yerinde)
components/layout/Header.tsx → LocaleSwitcher ve i18n string kullanımına güncellenir
components/layout/Footer.tsx → i18n string kullanımına güncellenir
```

**Değişen config dosyaları:**
```
next.config.ts           next-intl plugin wrapper
tsconfig.json            "paths": { "@/i18n/*": ["./i18n/*"] } ek
package.json             yeni dependency'ler
.env.example             (ANTHROPIC_API_KEY satırı EKLENMEZ — plan revize edildi)
README.md                i18n kullanım + 3D notları
app/globals.css          RTL logical-first utility patch
```

---

## Task 1: next-intl kurulumu + i18n config dosyaları

**Files:**
- Create: `i18n/routing.ts`
- Create: `i18n/request.ts`
- Create: `i18n/navigation.ts`
- Modify: `package.json` (add dependency)
- Modify: `next.config.ts`
- Modify: `tsconfig.json` (path alias)

- [ ] **Step 1: Dependency ekle**

```bash
pnpm add next-intl@^3.28
```

Expected: `next-intl` dependencies'e eklenmiş, lockfile güncel.

- [ ] **Step 2: Failing test — routing config locale listesini export eder**

`tests/unit/i18n/routing.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { routing, locales, defaultLocale } from "@/i18n/routing";

describe("i18n routing", () => {
  it("exposes 4 locales in order tr, en, ru, ar", () => {
    expect(locales).toEqual(["tr", "en", "ru", "ar"]);
  });

  it("has TR as default locale", () => {
    expect(defaultLocale).toBe("tr");
    expect(routing.defaultLocale).toBe("tr");
  });

  it("uses always-prefix strategy", () => {
    expect(routing.localePrefix).toBe("always");
  });
});
```

Run: `pnpm test tests/unit/i18n/routing.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: `i18n/routing.ts` implementasyonu**

```typescript
import { defineRouting } from "next-intl/routing";

export const locales = ["tr", "en", "ru", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "tr";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
```

- [ ] **Step 4: Test geçmeli**

Run: `pnpm test tests/unit/i18n/routing.test.ts`
Expected: PASS (3 testler yeşil).

- [ ] **Step 5: `i18n/request.ts` — getRequestConfig**

```typescript
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [common, home, nav, sectors, references, pages] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/home.json`).then((m) => m.default),
    import(`../messages/${locale}/nav.json`).then((m) => m.default),
    import(`../messages/${locale}/sectors.json`).then((m) => m.default),
    import(`../messages/${locale}/references.json`).then((m) => m.default),
    import(`../messages/${locale}/pages.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: { common, home, nav, sectors, references, pages },
  };
});
```

- [ ] **Step 6: `i18n/navigation.ts` — typed wrappers**

```typescript
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 7: `tsconfig.json` path alias ekle**

`compilerOptions.paths` altına `"@/i18n/*": ["./i18n/*"]` ekle. Mevcut `"@/*"` genelken bu explicit alias i18n klasörünün app dışında yaşamasını TypeScript'e bildirmez, o yüzden **mevcut `"@/*": ["./*"]` alias'ı zaten yeterli** — bu adımı atla ve yorum düş `// note: "@/*" zaten i18n klasörünü kapsar`.

Realite: mevcut tsconfig `"@/*": ["./*"]` olduğu için ayrı alias gerekmez. Adımı doğrula:

```bash
grep -A 4 'paths' tsconfig.json
```

Expected: `"@/*": ["./*"]` görmeli. Ek path eklenmez.

- [ ] **Step 8: `next.config.ts` — next-intl plugin sar**

`next.config.ts` mevcut içeriği oku, sonra:

```typescript
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // mevcut config key'leri burada korunur
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 9: Placeholder messages oluştur (JSON importları kırılmasın diye)**

Her 4 locale için 6 namespace'in minimal iskeletini yaz. Bu geçici stub'tır — gerçek içerik Task 8-13'te gelecek.

```bash
mkdir -p messages/tr messages/en messages/ru messages/ar
for loc in tr en ru ar; do
  for ns in common home nav sectors references pages; do
    echo '{}' > messages/$loc/$ns.json
  done
done
```

Expected: 24 boş JSON dosyası. `ls messages/tr/` → 6 dosya.

- [ ] **Step 10: Typecheck**

Run: `pnpm typecheck`
Expected: No TS errors.

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts i18n/ messages/ tests/unit/i18n/
git commit -m "feat(i18n): add next-intl routing, request config and navigation wrappers"
```

---

## Task 2: Middleware + kök redirect

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: `middleware.ts` implementasyonu**

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Statik asset'ler ve API route'ları hariç tut
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
```

- [ ] **Step 2: Dev server restart + manuel kontrol**

Terminal 1'de dev server'ı öldür (kullanıcı'nın çalışan session'ından bağımsız), plan executor yeniden başlatır:

```bash
# executor:
pkill -f "next dev" || true
pnpm dev &
sleep 3
curl -sI http://localhost:3000/ | head -5
```

Expected: `HTTP/1.1 307 Temporary Redirect` ve `location: /tr` header'ı. next-intl middleware kök isteği default locale'e redirect eder.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(i18n): add next-intl middleware with always-prefix locale routing"
```

---

## Task 3: `[locale]` route segment migration

**Files:**
- Create: `app/[locale]/layout.tsx` (mevcut `app/layout.tsx` içeriğini taşır + NextIntlClientProvider wrap)
- Create: `app/[locale]/page.tsx` (mevcut `app/page.tsx`'i taşır)
- Create: `app/[locale]/not-found.tsx`
- Modify: `app/layout.tsx` (minimal root shell)
- Delete: `app/page.tsx` (içerik [locale] altına taşındı)

**Not:** Next.js 15 App Router'ında aynı route için hem `app/layout.tsx` (root) hem `app/[locale]/layout.tsx` (segment) yaşayabilir. Root layout sadece `<html>` ve `<body>` skeleton sağlar (locale henüz bilinmediği için dil attribute'ü segment layout'ta belirlenir). Middleware kök path'e gelen her şeyi `/[locale]`'e redirect ettiği için kullanıcı root layout'u görmez — yine de RSC streaming için root layout zorunludur.

- [ ] **Step 1: Mevcut `app/layout.tsx` içeriğini oku**

```bash
cat app/layout.tsx
```

Executor mevcut içeriği gözlemler (font imports, metadata, Header/Footer kullanımı).

- [ ] **Step 2: Failing test — [locale]/layout HTML dir attribute doğru koyar**

`tests/unit/i18n/locale-layout.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import LocaleLayout from "@/app/[locale]/layout";

describe("LocaleLayout", () => {
  it("renders children inside NextIntlClientProvider with correct locale", async () => {
    const element = await LocaleLayout({
      children: <div data-testid="child">hi</div>,
      params: Promise.resolve({ locale: "ar" }),
    });
    // LocaleLayout returns a JSX tree; assert it passes locale='ar' to provider
    const { container } = render(element as JSX.Element);
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
```

Run: `pnpm test tests/unit/i18n/locale-layout.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: `app/[locale]/layout.tsx` yaz**

```typescript
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { Inter, JetBrains_Mono } from "next/font/google";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const messages = await getMessages();

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Kritik:** Mevcut `app/layout.tsx`'deki font yapılandırmasını (ör. `next/font/local` ile self-hosted Inter) buraya birebir taşı. Yukarıdaki `next/font/google` varsayımı mevcut kod farklıysa değiştirilir — executor mevcut import'u birebir kopyalar.

- [ ] **Step 4: Root `app/layout.tsx`'i minimize et**

```typescript
import type { ReactNode } from "react";

// Root layout — middleware kök path'i /[locale]'e redirect ettiği için
// kullanıcı bu layout'u göremez, ama Next.js segment yapısı bunu zorunlu kılar.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
```

**Önemli:** Next.js root layout'un `<html>` ve `<body>` döndürmesi zorunlu görünse de, next-intl docs gösterir ki `[locale]` altındaki layout bu görevi üstlenir ve root layout sadece passthrough olur. Bu pattern v15'te destekleniyor (docs: next-intl.dev/docs/getting-started/app-router).

Doğrulama: Middleware zaten root path'e düşen her isteği /tr'ye redirect eder, yani bu layout asla render edilmez production'da. Yine de Next.js yapısal gereksinimi için dosya var olmalı.

- [ ] **Step 5: `app/[locale]/page.tsx` — mevcut anasayfa'yı taşı**

```typescript
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Hero } from "@/components/home/Hero";
import { SectorGrid } from "@/components/home/SectorGrid";
import { ReferencesStrip } from "@/components/home/ReferencesStrip";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ReferencesStrip />
      <SectorGrid />
    </>
  );
}
```

**Not:** `ReferencesStrip` henüz yok (Task 15'te oluşturulacak). Bu task için geçici olarak import'u yorumla:

```typescript
// import { ReferencesStrip } from "@/components/home/ReferencesStrip"; // Task 15
// <ReferencesStrip />  // Task 15
```

- [ ] **Step 6: `app/page.tsx` sil**

```bash
rm app/page.tsx
```

- [ ] **Step 7: `app/[locale]/not-found.tsx` — localized 404**

```typescript
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations("common.notFound");
  return (
    <section className="container mx-auto flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Link href="/" className="underline">
        {t("home")}
      </Link>
    </section>
  );
}
```

- [ ] **Step 8: Dev server'da smoke test**

```bash
curl -sI http://localhost:3000/tr | head -3
curl -sI http://localhost:3000/en | head -3
curl -sI http://localhost:3000/ar | head -3
```

Expected: Her biri `HTTP/1.1 200 OK`.

- [ ] **Step 9: Commit**

```bash
git add app/ tests/unit/i18n/locale-layout.test.tsx
git commit -m "feat(i18n): migrate routes to [locale] segment with localized layout"
```

---

## Task 4: LocaleSwitcher komponenti + Header entegrasyonu

**Files:**
- Create: `components/layout/LocaleSwitcher.tsx`
- Create: `tests/unit/components/LocaleSwitcher.test.tsx`
- Modify: `components/layout/Header.tsx`
- Modify: `tests/unit/components/Header.test.tsx`

- [ ] **Step 1: Failing test — LocaleSwitcher 4 dili listeler**

`tests/unit/components/LocaleSwitcher.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

const messages = { nav: { language: "Dil" } };

function renderWithProvider(locale = "tr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleSwitcher />
    </NextIntlClientProvider>,
  );
}

describe("LocaleSwitcher", () => {
  it("renders all 4 locales", () => {
    renderWithProvider();
    expect(screen.getByRole("link", { name: /TR/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RU/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AR/i })).toBeInTheDocument();
  });

  it("marks current locale with aria-current", () => {
    renderWithProvider("en");
    const active = screen.getByRole("link", { name: /EN/i });
    expect(active).toHaveAttribute("aria-current", "true");
  });
});
```

Run: `pnpm test tests/unit/components/LocaleSwitcher.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 2: `LocaleSwitcher.tsx` implementasyonu**

```typescript
"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABEL: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  ru: "RU",
  ar: "AR",
};

export function LocaleSwitcher() {
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label="Dil / Language" className="flex items-center gap-1 text-sm">
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded px-2 py-1 font-mono uppercase tracking-wide transition-colors",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LABEL[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Testler geçmeli**

Run: `pnpm test tests/unit/components/LocaleSwitcher.test.tsx`
Expected: PASS.

- [ ] **Step 4: Header'a LocaleSwitcher entegre et**

Mevcut `components/layout/Header.tsx`'i oku. Nav link'lerinin yanına LocaleSwitcher'ı ekle:

```typescript
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="border-border/60 sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Kıta Plastik
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label={t("primary")}>
          <Link href="/sektorler">{t("sectors")}</Link>
          <Link href="/urunler">{t("products")}</Link>
          <Link href="/muhendislik">{t("engineering")}</Link>
          <Link href="/referanslar">{t("references")}</Link>
          <Link href="/hakkimizda">{t("about")}</Link>
          <Link href="/iletisim">{t("contact")}</Link>
        </nav>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Header testini güncelle**

Mevcut `tests/unit/components/Header.test.tsx`'i `NextIntlClientProvider` ile sarmalı hâle getir. Test içinde nav namespace'i için stub messages:

```typescript
const messages = {
  nav: {
    primary: "Ana navigasyon",
    sectors: "Sektörler",
    products: "Ürünler",
    engineering: "Mühendislik",
    references: "Referanslar",
    about: "Hakkımızda",
    contact: "İletişim",
    language: "Dil",
  },
};
```

Tüm `render(<Header />)` çağrılarını `renderWithIntl(<Header />, messages)` ile sar.

- [ ] **Step 6: Tüm testler yeşil**

Run: `pnpm test`
Expected: PASS all suites.

- [ ] **Step 7: Commit**

```bash
git add components/layout/ tests/unit/components/
git commit -m "feat(i18n): add LocaleSwitcher and integrate into Header"
```

---

## Task 5: RTL desteği + Arapça font + globals patch

**Files:**
- Create: `lib/rtl.ts`
- Create: `tests/unit/lib/rtl.test.ts`
- Modify: `app/globals.css`
- Modify: `app/[locale]/layout.tsx` (Noto Sans Arabic font ekle)
- Modify: `package.json` (@fontsource-variable/noto-sans-arabic)

- [ ] **Step 1: Failing test — isRtl helper**

`tests/unit/lib/rtl.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { isRtl, getDir } from "@/lib/rtl";

describe("rtl helpers", () => {
  it("identifies ar as RTL", () => {
    expect(isRtl("ar")).toBe(true);
  });

  it("identifies tr/en/ru as LTR", () => {
    expect(isRtl("tr")).toBe(false);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("ru")).toBe(false);
  });

  it("getDir returns rtl/ltr", () => {
    expect(getDir("ar")).toBe("rtl");
    expect(getDir("tr")).toBe("ltr");
  });
});
```

Run: `pnpm test tests/unit/lib/rtl.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 2: `lib/rtl.ts` implementasyonu**

```typescript
import type { Locale } from "@/i18n/routing";

const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar"]);

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}

export function getDir(locale: Locale): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr";
}
```

- [ ] **Step 3: Layout'ta `getDir` kullan**

`app/[locale]/layout.tsx` içinde `const dir = locale === "ar" ? "rtl" : "ltr"` satırını `const dir = getDir(locale as Locale);` ile değiştir + import ekle.

- [ ] **Step 4: Arapça font dependency**

```bash
pnpm add @fontsource-variable/noto-sans-arabic@^5
```

- [ ] **Step 5: Layout'ta Arapça font import (koşullu class)**

`app/[locale]/layout.tsx` üstüne:

```typescript
import "@fontsource-variable/noto-sans-arabic/wght.css";
```

Body class'ına koşullu ekle:

```typescript
<body
  className={cn(
    "min-h-dvh bg-background text-foreground antialiased",
    locale === "ar" && "font-arabic",
  )}
>
```

- [ ] **Step 6: `app/globals.css` — font-arabic utility + RTL patch**

Mevcut globals.css'in sonuna ekle:

```css
@layer base {
  :root {
    --font-arabic: "Noto Sans Arabic Variable", "Noto Sans Arabic", system-ui, sans-serif;
  }

  html[dir="rtl"] body,
  .font-arabic {
    font-family: var(--font-arabic);
  }

  /* İkon flip: RTL'de explicit flip istediğimiz yerler için utility */
  html[dir="rtl"] .rtl-flip {
    transform: scaleX(-1);
  }
}
```

- [ ] **Step 7: Manuel smoke test**

```bash
curl -s http://localhost:3000/ar | grep -E '(dir=|lang=)' | head -1
```

Expected: `<html lang="ar" dir="rtl" ...` pattern'i görünür.

- [ ] **Step 8: Commit**

```bash
git add lib/rtl.ts tests/unit/lib/rtl.test.ts app/globals.css app/[locale]/layout.tsx package.json pnpm-lock.yaml
git commit -m "feat(i18n): add RTL direction helper and Arabic font support"
```

---

## Task 6: hreflang sitemap + robots

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `lib/seo/routes.ts`
- Create: `tests/unit/seo/routes.test.ts`

- [ ] **Step 1: Failing test — route enumeration**

`tests/unit/seo/routes.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { PUBLIC_ROUTES, buildAlternates } from "@/lib/seo/routes";

describe("seo routes", () => {
  it("lists all public routes", () => {
    expect(PUBLIC_ROUTES).toContain("/");
    expect(PUBLIC_ROUTES).toContain("/sektorler");
    expect(PUBLIC_ROUTES).toContain("/sektorler/cam-yikama");
    expect(PUBLIC_ROUTES).toContain("/sektorler/kapak");
    expect(PUBLIC_ROUTES).toContain("/sektorler/tekstil");
    expect(PUBLIC_ROUTES).toContain("/urunler");
    expect(PUBLIC_ROUTES).toContain("/muhendislik");
    expect(PUBLIC_ROUTES).toContain("/atolye");
    expect(PUBLIC_ROUTES).toContain("/kalite");
    expect(PUBLIC_ROUTES).toContain("/hakkimizda");
    expect(PUBLIC_ROUTES).toContain("/iletisim");
    expect(PUBLIC_ROUTES).toContain("/referanslar");
    expect(PUBLIC_ROUTES).toHaveLength(12);
  });

  it("buildAlternates produces hreflang map with x-default", () => {
    const alt = buildAlternates("/hakkimizda", "https://kitaplastik.com");
    expect(alt.languages).toEqual({
      tr: "https://kitaplastik.com/tr/hakkimizda",
      en: "https://kitaplastik.com/en/hakkimizda",
      ru: "https://kitaplastik.com/ru/hakkimizda",
      ar: "https://kitaplastik.com/ar/hakkimizda",
    });
    expect(alt["x-default"]).toBe("https://kitaplastik.com/tr/hakkimizda");
  });
});
```

Run: `pnpm test tests/unit/seo/routes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 2: `lib/seo/routes.ts` implementasyonu**

```typescript
import { locales, defaultLocale, type Locale } from "@/i18n/routing";

export const PUBLIC_ROUTES = [
  "/",
  "/sektorler",
  "/sektorler/cam-yikama",
  "/sektorler/kapak",
  "/sektorler/tekstil",
  "/urunler",
  "/muhendislik",
  "/atolye",
  "/kalite",
  "/hakkimizda",
  "/iletisim",
  "/referanslar",
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export interface Alternates {
  languages: Record<Locale, string>;
  "x-default": string;
}

function joinPath(path: string): string {
  return path === "/" ? "" : path;
}

export function buildAlternates(route: string, origin: string): Alternates {
  const languages = locales.reduce<Record<Locale, string>>(
    (acc, locale) => {
      acc[locale] = `${origin}/${locale}${joinPath(route)}`;
      return acc;
    },
    {} as Record<Locale, string>,
  );
  return {
    languages,
    "x-default": `${origin}/${defaultLocale}${joinPath(route)}`,
  };
}
```

- [ ] **Step 3: `app/sitemap.ts`**

```typescript
import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { PUBLIC_ROUTES, buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";

  return PUBLIC_ROUTES.flatMap((route) =>
    locales.map((locale) => {
      const alt = buildAlternates(route, origin);
      return {
        url: alt.languages[locale],
        changeFrequency: "monthly" as const,
        priority: route === "/" ? 1 : 0.7,
        alternates: {
          languages: alt.languages,
        },
      };
    }),
  );
}
```

**Not:** `NEXT_PUBLIC_SITE_URL` env var'ı `lib/env.ts`'e ek: optional string with default. Bir sonraki step'te.

- [ ] **Step 4: `lib/env.ts`'e NEXT_PUBLIC_SITE_URL ekle**

Mevcut zod schema'ya:

```typescript
NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
```

`.env.example`'a ekle:

```
# Site origin (sitemap/OG için — lokalde boş bırakılabilir)
NEXT_PUBLIC_SITE_URL=https://kitaplastik.com
```

- [ ] **Step 5: `app/robots.ts`**

```typescript
import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
```

- [ ] **Step 6: Manuel smoke test**

```bash
curl -s http://localhost:3000/sitemap.xml | head -30
curl -s http://localhost:3000/robots.txt
```

Expected: sitemap.xml'de `<url>` elementleri ve `<xhtml:link rel="alternate" hreflang="..."/>` satırları; robots.txt'te `Disallow: /admin/`.

- [ ] **Step 7: Commit**

```bash
git add app/sitemap.ts app/robots.ts lib/seo/ lib/env.ts .env.example tests/unit/seo/
git commit -m "feat(seo): add hreflang-aware sitemap and robots"
```

---

## Task 7: Glossary referans dosyası (dev-only, runtime etkilemez)

**Files:**
- Create: `glossary.json`
- Create: `docs/i18n/GLOSSARY.md`

- [ ] **Step 1: `glossary.json` — 50+ teknik terim**

```json
{
  "plastik enjeksiyon": {
    "en": "plastic injection moulding",
    "ru": "литьё пластмасс под давлением",
    "ar": "حقن البلاستيك"
  },
  "kalıp tasarımı": {
    "en": "mould design",
    "ru": "проектирование пресс-форм",
    "ar": "تصميم القوالب"
  },
  "tolerans": {
    "en": "tolerance",
    "ru": "допуск",
    "ar": "التفاوت"
  },
  "cam yıkama makinesi": {
    "en": "glass-washing machine",
    "ru": "стекломоечная машина",
    "ar": "آلة غسيل الزجاج"
  },
  "kapak": {
    "en": "cap",
    "ru": "колпачок",
    "ar": "غطاء"
  },
  "tekstil aksesuarı": {
    "en": "textile accessory",
    "ru": "текстильный аксессуар",
    "ar": "ملحق نسيج"
  },
  "fizibilite": {
    "en": "feasibility",
    "ru": "технико-экономическое обоснование",
    "ar": "دراسة الجدوى"
  },
  "seri üretim": {
    "en": "serial production",
    "ru": "серийное производство",
    "ar": "الإنتاج التسلسلي"
  },
  "ön üretim": {
    "en": "pre-production",
    "ru": "предсерийное производство",
    "ar": "ما قبل الإنتاج"
  },
  "numune": {
    "en": "sample",
    "ru": "образец",
    "ar": "عينة"
  },
  "teklif iste": {
    "en": "request a quote",
    "ru": "запросить предложение",
    "ar": "اطلب عرض سعر"
  },
  "teklif": {
    "en": "quote",
    "ru": "коммерческое предложение",
    "ar": "عرض سعر"
  },
  "özel üretim": {
    "en": "custom production",
    "ru": "производство под заказ",
    "ar": "إنتاج خاص"
  },
  "mühendislik partneri": {
    "en": "engineering partner",
    "ru": "инженерный партнёр",
    "ar": "شريك هندسي"
  },
  "kalite yönetim sistemi": {
    "en": "quality management system",
    "ru": "система менеджмента качества",
    "ar": "نظام إدارة الجودة"
  },
  "sertifika": {
    "en": "certification",
    "ru": "сертификат",
    "ar": "شهادة"
  },
  "üretim kapasitesi": {
    "en": "production capacity",
    "ru": "производственная мощность",
    "ar": "الطاقة الإنتاجية"
  },
  "atölye": {
    "en": "workshop",
    "ru": "цех",
    "ar": "ورشة"
  },
  "referanslar": {
    "en": "references",
    "ru": "отзывы клиентов",
    "ar": "المراجع"
  },
  "müşteri": {
    "en": "customer",
    "ru": "клиент",
    "ar": "عميل"
  },
  "tedarikçi": {
    "en": "supplier",
    "ru": "поставщик",
    "ar": "مورد"
  },
  "NDA (gizlilik)": {
    "en": "NDA (confidentiality)",
    "ru": "соглашение о неразглашении",
    "ar": "اتفاقية عدم الإفصاح"
  },
  "hakkımızda": {
    "en": "about us",
    "ru": "о нас",
    "ar": "من نحن"
  },
  "iletişim": {
    "en": "contact",
    "ru": "контакты",
    "ar": "اتصل بنا"
  },
  "sektör": {
    "en": "sector",
    "ru": "отрасль",
    "ar": "قطاع"
  },
  "ürün kataloğu": {
    "en": "product catalog",
    "ru": "каталог продукции",
    "ar": "كتالوج المنتجات"
  },
  "malzeme": {
    "en": "material",
    "ru": "материал",
    "ar": "مادة"
  },
  "polimer": {
    "en": "polymer",
    "ru": "полимер",
    "ar": "بوليمر"
  },
  "HDPE": {
    "en": "HDPE",
    "ru": "ПЭВП",
    "ar": "HDPE"
  },
  "LDPE": {
    "en": "LDPE",
    "ru": "ПЭНП",
    "ar": "LDPE"
  },
  "PP": {
    "en": "PP (polypropylene)",
    "ru": "ПП (полипропилен)",
    "ar": "PP (بولي بروبيلين)"
  },
  "PET": {
    "en": "PET",
    "ru": "ПЭТ",
    "ar": "PET"
  },
  "1989'dan beri": {
    "en": "since 1989",
    "ru": "с 1989 года",
    "ar": "منذ 1989"
  },
  "Bursa'dan dünyaya": {
    "en": "from Bursa to the world",
    "ru": "из Бурсы во весь мир",
    "ar": "من بورصة إلى العالم"
  },
  "36 yıllık tecrübe": {
    "en": "36 years of experience",
    "ru": "36 лет опыта",
    "ar": "36 عامًا من الخبرة"
  },
  "hibrit üretim": {
    "en": "hybrid production",
    "ru": "гибридное производство",
    "ar": "إنتاج هجين"
  },
  "B2B": {
    "en": "B2B",
    "ru": "B2B",
    "ar": "B2B"
  },
  "proje brief": {
    "en": "project brief",
    "ru": "техническое задание",
    "ar": "ملخص المشروع"
  },
  "ihracat": {
    "en": "export",
    "ru": "экспорт",
    "ar": "تصدير"
  },
  "yerli": {
    "en": "domestic",
    "ru": "отечественный",
    "ar": "محلي"
  },
  "KVKK": {
    "en": "KVKK (Turkish GDPR)",
    "ru": "KVKK (закон о защите персональных данных Турции)",
    "ar": "KVKK (قانون حماية البيانات التركي)"
  },
  "GDPR": {
    "en": "GDPR",
    "ru": "GDPR",
    "ar": "اللائحة العامة لحماية البيانات"
  },
  "aksesuar": {
    "en": "accessory",
    "ru": "аксессуар",
    "ar": "ملحق"
  },
  "mesh": {
    "en": "mesh",
    "ru": "сетка",
    "ar": "شبكة"
  },
  "çerçeve": {
    "en": "frame",
    "ru": "рамка",
    "ar": "إطار"
  },
  "conta": {
    "en": "seal / gasket",
    "ru": "уплотнитель",
    "ar": "جلبة"
  },
  "enjeksiyon makinesi": {
    "en": "injection moulding machine",
    "ru": "термопластавтомат",
    "ar": "آلة حقن البلاستيك"
  },
  "dişli": {
    "en": "gear",
    "ru": "шестерня",
    "ar": "ترس"
  },
  "şişeleme hattı": {
    "en": "bottling line",
    "ru": "линия розлива",
    "ar": "خط التعبئة"
  },
  "ambalaj": {
    "en": "packaging",
    "ru": "упаковка",
    "ar": "تغليف"
  }
}
```

- [ ] **Step 2: `docs/i18n/GLOSSARY.md` — insan okur versiyon**

```markdown
# Terminoloji Sözlüğü (i18n)

Bu sözlük, içerik güncellemelerinde terim tutarlılığı için referanstır. Runtime'da kullanılmaz — sadece Claude / çevirmen için.

## Neden gerekli?

- "mould" mü "mold" mü? → British English (mould) kullanıyoruz
- "tolerance" için RU karşılığı "допуск" mı "терпимость" mi? → "допуск" (teknik anlam)
- Arapça'da "plastik enjeksiyon" tek kelimeyle mi çevrilir? → "حقن البلاستيك"

## Kullanım

İçerik güncellenirken Claude session'ı `glossary.json`'u okur, çeviri yaparken bu terimleri aynen kullanır.

## Güncelleme

Yeni teknik terim eklendiğinde:
1. `glossary.json`'a 4 dil karşılığını ekle
2. Bu dosyaya örnek bağlam yaz (gerekirse)
3. Commit: `docs(i18n): add "XYZ" to glossary`
```

- [ ] **Step 3: Commit**

```bash
git add glossary.json docs/i18n/
git commit -m "docs(i18n): add terminology glossary for translation consistency"
```

---

## Task 8: TR messages — common + nav + home

**Files:**
- Modify: `messages/tr/common.json`
- Modify: `messages/tr/nav.json`
- Modify: `messages/tr/home.json`

- [ ] **Step 1: `messages/tr/common.json`**

```json
{
  "brand": {
    "name": "Kıta Plastik",
    "tagline": "Plastik enjeksiyonun mühendislik partneri"
  },
  "cta": {
    "requestQuote": "Teklif İste",
    "learnMore": "Daha Fazla",
    "contactUs": "İletişime Geç",
    "exploreSectors": "Sektörleri Keşfet",
    "backToHome": "Anasayfaya Dön"
  },
  "notFound": {
    "title": "Sayfa bulunamadı",
    "description": "Aradığınız sayfa mevcut değil veya taşınmış olabilir.",
    "home": "Anasayfaya dön"
  },
  "form": {
    "required": "Zorunlu alan",
    "submit": "Gönder",
    "cancel": "Vazgeç"
  },
  "footer": {
    "copyright": "© {year} Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
    "since": "1989'dan beri Bursa'dan",
    "address": "Bursa Organize Sanayi Bölgesi",
    "phone": "Telefon",
    "email": "E-posta",
    "links": "Bağlantılar"
  }
}
```

- [ ] **Step 2: `messages/tr/nav.json`**

```json
{
  "primary": "Ana navigasyon",
  "sectors": "Sektörler",
  "products": "Ürünler",
  "engineering": "Mühendislik",
  "workshop": "Atölye",
  "quality": "Kalite",
  "references": "Referanslar",
  "about": "Hakkımızda",
  "contact": "İletişim",
  "language": "Dil"
}
```

- [ ] **Step 3: `messages/tr/home.json`**

```json
{
  "hero": {
    "eyebrow": "1989'dan beri",
    "title": "Plastik enjeksiyonun mühendislik partneri",
    "subtitle": "Bursa'dan dünyaya. Cam yıkama, kapak ve tekstil sektörlerine standart ürünler ve müşteriye özel mühendislik çözümleri.",
    "primaryCta": "Teklif İste",
    "secondaryCta": "Sektörleri Keşfet"
  },
  "references": {
    "eyebrow": "Güvenilen üretim partneri",
    "title": "Bizi seçen markalar",
    "subtitle": "36 yıllık tecrübe, 3 kıtada teslimat.",
    "viewAll": "Tüm referanslar"
  },
  "sectors": {
    "eyebrow": "Sektörler",
    "title": "Üç sektör, tek mühendislik disiplini",
    "camYikama": {
      "title": "Cam Yıkama",
      "description": "Şişeleme hatlarına dayanıklı yıkama ekipmanı parçaları."
    },
    "kapak": {
      "title": "Kapak",
      "description": "Yüksek hacimli kapak üretimi — gıda, kozmetik, kimya ambalaj."
    },
    "tekstil": {
      "title": "Tekstil",
      "description": "Tekstil makineleri ve aksesuarları için hassas plastik parçalar."
    }
  },
  "capabilities": {
    "eyebrow": "Yetkinlikler",
    "title": "Kalıp tasarımından seri üretime",
    "items": [
      { "title": "Kalıp Tasarımı", "description": "Müşteri brief'inden 3D model ve tolerans şemasına." },
      { "title": "Fizibilite", "description": "Malzeme, maliyet ve süreç analizi." },
      { "title": "Seri Üretim", "description": "Çok kalıplı, kalibreli, tekrarlanabilir hatlar." },
      { "title": "Kalite Kontrol", "description": "Her partide boyut ve görsel denetim." }
    ]
  },
  "cta": {
    "title": "Projenizi konuşalım",
    "subtitle": "Brief'inizi paylaşın, 48 saat içinde fizibilite ile dönelim.",
    "button": "Teklif İste"
  }
}
```

- [ ] **Step 4: JSON sözdizimi doğrulaması**

```bash
node -e 'require("./messages/tr/common.json"); require("./messages/tr/nav.json"); require("./messages/tr/home.json"); console.log("OK")'
```

Expected: `OK`

- [ ] **Step 5: Dev server'da TR homepage yüklensin**

```bash
curl -s http://localhost:3000/tr | grep -o "Plastik enjeksiyonun mühendislik partneri"
```

Expected: match.

- [ ] **Step 6: Commit**

```bash
git add messages/tr/common.json messages/tr/nav.json messages/tr/home.json
git commit -m "feat(i18n): add Turkish messages for common, nav, home"
```

---

## Task 9: TR messages — sectors + references

**Files:**
- Modify: `messages/tr/sectors.json`
- Modify: `messages/tr/references.json`

- [ ] **Step 1: `messages/tr/sectors.json`**

```json
{
  "hub": {
    "hero": {
      "eyebrow": "Sektörler",
      "title": "Üç sektör, tek mühendislik disiplini",
      "subtitle": "Cam yıkama, kapak ve tekstil sektörlerinde 36 yıllık üretim tecrübesi."
    },
    "camYikama": {
      "title": "Cam Yıkama",
      "description": "Şişeleme ve yıkama hatlarında kullanılan dayanıklı plastik parçalar."
    },
    "kapak": {
      "title": "Kapak",
      "description": "Gıda, kozmetik ve kimya ambalajı için yüksek hacimli kapak üretimi."
    },
    "tekstil": {
      "title": "Tekstil",
      "description": "Tekstil makineleri için hassas toleranslı plastik aksesuarlar."
    }
  },
  "camYikama": {
    "hero": {
      "eyebrow": "Sektör",
      "title": "Cam yıkama hatlarının görünmeyen omurgası",
      "subtitle": "Şişe yıkama makineleri, şişeleme hatları ve CIP sistemleri için polimer parçalar."
    },
    "solutions": {
      "title": "Çözümler",
      "items": [
        { "title": "Şişe tutma kolları", "description": "Yıkama sırasında şişeyi sabitleyen, aşınmaya dayanıklı kollar." },
        { "title": "Kılavuz profiller", "description": "Konveyör hatları için düşük sürtünmeli plastik profiller." },
        { "title": "Püskürtme nozulları", "description": "Yüksek basınca dayanıklı polimer nozul gövdeleri." }
      ]
    },
    "materials": {
      "title": "Malzeme seçenekleri",
      "items": ["HDPE", "POM (asetal)", "PP", "PA6 (naylon)"]
    }
  },
  "kapak": {
    "hero": {
      "eyebrow": "Sektör",
      "title": "Kapakta ölçek ve tutarlılık",
      "subtitle": "Yüksek hacimli seri üretim — gıda, kozmetik ve kimya ambalajı için kapak ve kapatma çözümleri."
    },
    "solutions": {
      "title": "Çözümler",
      "items": [
        { "title": "Standart vida kapak", "description": "PP / HDPE malzemede 20–80 mm çap aralığı." },
        { "title": "Flip-top kapak", "description": "Şampuan, sıvı sabun ve gıda yağı için." },
        { "title": "Çocuk emniyetli kapak", "description": "Kimya ve ilaç sektörü için güvenlik standardı uyumlu." }
      ]
    },
    "materials": {
      "title": "Malzeme seçenekleri",
      "items": ["PP", "HDPE", "LDPE"]
    }
  },
  "tekstil": {
    "hero": {
      "eyebrow": "Sektör",
      "title": "Tekstil makinelerinin hassas parçaları",
      "subtitle": "Dokuma, örme ve konfeksiyon makineleri için düşük toleranslı plastik aksesuarlar."
    },
    "solutions": {
      "title": "Çözümler",
      "items": [
        { "title": "Mekik kılavuzları", "description": "Dokuma tezgahlarında iplik akışını yönlendiren parçalar." },
        { "title": "Masura ve bobin", "description": "İplik sarma makineleri için." },
        { "title": "Gergi çerçeveleri", "description": "Kumaş gergi hatlarında kullanılan polimer bileşenler." }
      ]
    },
    "materials": {
      "title": "Malzeme seçenekleri",
      "items": ["POM (asetal)", "PA6", "PBT", "PP"]
    }
  }
}
```

- [ ] **Step 2: `messages/tr/references.json`**

```json
{
  "strip": {
    "eyebrow": "Güvenilen üretim partneri",
    "title": "36 yıldır üreten markaların yanında",
    "viewAll": "Tüm referanslar"
  },
  "page": {
    "hero": {
      "eyebrow": "Referanslar",
      "title": "Üç sektörde, 3 kıtada",
      "subtitle": "Yurt içi ve ihracat müşterilerimizin bir kısmı. Ticari gizlilik nedeniyle müşteri detayları anonim tutulmuştur; detaylı bilgi için iletişime geçiniz."
    },
    "sectionTitle": "Seçkin müşterilerimiz",
    "empty": "Henüz referans eklenmemiş."
  },
  "clients": {
    "c1": { "name": "Anadolu Şişeleme A.Ş.", "sector": "Cam Yıkama" },
    "c2": { "name": "Marmara Ambalaj", "sector": "Kapak" },
    "c3": { "name": "Ege Tekstil Makine", "sector": "Tekstil" },
    "c4": { "name": "Bosphorus Glass Co.", "sector": "Cam Yıkama" },
    "c5": { "name": "NordPack GmbH", "sector": "Kapak" },
    "c6": { "name": "Textile Pro LLC", "sector": "Tekstil" },
    "c7": { "name": "BalkanBottling d.o.o.", "sector": "Cam Yıkama" },
    "c8": { "name": "Cosmopack Intl.", "sector": "Kapak" }
  }
}
```

- [ ] **Step 3: JSON doğrulama + commit**

```bash
node -e 'require("./messages/tr/sectors.json"); require("./messages/tr/references.json"); console.log("OK")'
git add messages/tr/sectors.json messages/tr/references.json
git commit -m "feat(i18n): add Turkish messages for sectors and references"
```

---

## Task 10: TR messages — pages (urunler + muhendislik + atolye + kalite + hakkimizda + iletisim)

**Files:**
- Modify: `messages/tr/pages.json`

- [ ] **Step 1: `messages/tr/pages.json`**

```json
{
  "products": {
    "hero": {
      "eyebrow": "Ürünler",
      "title": "Standart ürün katalogumuz",
      "subtitle": "Üç sektör için stoklu ve hızlı teslim edilebilen standart parçalarımız. Detaylı katalog için iletişime geçiniz."
    },
    "notice": "Tam kataloğumuz Plan 3 kapsamında eklenecektir — şu anda talepleri iletişim formundan alıyoruz."
  },
  "engineering": {
    "hero": {
      "eyebrow": "Özel Üretim",
      "title": "Bursa'dan global B2B mühendislik partneri",
      "subtitle": "Kendi ürününüzü tasarlayıp ürettirmek istiyorsanız — brief'ten seri üretime kadar tek ekip."
    },
    "process": {
      "title": "Dört adımda projeniz",
      "steps": [
        { "title": "1. Brief & NDA", "description": "Gereksinimlerinizi dinler, gerekiyorsa NDA imzalarız." },
        { "title": "2. Fizibilite", "description": "Malzeme seçimi, kalıp yapısı ve maliyet öngörüsü — tipik 5 iş günü." },
        { "title": "3. Kalıp tasarımı", "description": "3D model, tolerans şeması ve numune üretimi." },
        { "title": "4. Seri üretim", "description": "Onaylı numuneden sonra kalibre edilmiş, tekrarlanabilir üretim." }
      ]
    },
    "capabilities": {
      "title": "Yetkinliklerimiz",
      "items": [
        { "label": "Malzeme", "value": "HDPE, LDPE, PP, POM, PA6, PBT, ABS" },
        { "label": "Enjeksiyon tonajı", "value": "50–450 ton" },
        { "label": "Tolerans", "value": "±0.05 mm (standart), ±0.02 mm (hassas)" },
        { "label": "Aylık kapasite", "value": "Yaklaşık 8 milyon parça" }
      ]
    },
    "confidentiality": {
      "title": "Gizlilik",
      "body": "Her proje NDA çerçevesinde yürütülür; müşteri kalıpları ve tasarımları üçüncü taraflara kapalıdır."
    }
  },
  "workshop": {
    "hero": {
      "eyebrow": "Atölye",
      "title": "Bursa Organize Sanayi'de üretim",
      "subtitle": "3.500 m² kapalı alan, 14 enjeksiyon makinesi ve tam donanımlı kalite laboratuvarı."
    },
    "stats": {
      "area": "3.500 m²",
      "machines": "14 enjeksiyon makinesi",
      "capacity": "Aylık 8M parça",
      "staff": "42 kişi"
    }
  },
  "quality": {
    "hero": {
      "eyebrow": "Kalite",
      "title": "Her partide aynı tolerans",
      "subtitle": "Kalite yönetim sistemimiz, ihracat için gereken sertifikalar ve her partide boyut / görsel denetim süreçlerimiz."
    },
    "certificates": {
      "title": "Sertifikalar",
      "items": [
        { "name": "ISO 9001", "description": "Kalite Yönetim Sistemi — 2008'den beri." },
        { "name": "ISO 14001", "description": "Çevre Yönetim Sistemi." },
        { "name": "Gıda temas uyumluluğu", "description": "EU 10/2011 ve FDA 21 CFR 177." }
      ]
    },
    "process": {
      "title": "Kalite kontrol süreci",
      "items": [
        "Gelen malzeme giriş kontrolü (MFI, nem testi)",
        "Kalıp ilk parça onayı (FAI)",
        "Parti başı ve parti içi örnekleme",
        "Boyutsal ölçüm (kumpas, CMM)",
        "Görsel / renk kontrolü"
      ]
    }
  },
  "about": {
    "hero": {
      "eyebrow": "Hakkımızda",
      "title": "1989'dan beri Bursa'dan dünyaya",
      "subtitle": "Kıta Plastik ve Tekstil, üç kuşak mühendislik birikimiyle 36 yıldır plastik enjeksiyon üretiminde."
    },
    "story": {
      "title": "Hikâyemiz",
      "body": "1989'da Bursa'da küçük bir atölye olarak kurulduk. İlk yıllarda tekstil sektörü için makine parçaları ürettik. 2000'lerde cam yıkama ve ambalaj sektörlerine genişledik. Bugün 42 kişilik bir ekiple, üç sektörde yerli ve ihracat müşterilerimize özel ve standart çözümler sunuyoruz."
    },
    "values": {
      "title": "Değerlerimiz",
      "items": [
        { "title": "Mühendislik disiplini", "description": "Her proje ölçülebilir toleranslarla teslim edilir." },
        { "title": "Uzun soluklu ortaklık", "description": "Müşterilerimizin çoğuyla 10+ yıldır çalışıyoruz." },
        { "title": "Şeffaf süreç", "description": "Fizibiliteden teslimata kadar her aşamada net iletişim." }
      ]
    }
  },
  "contact": {
    "hero": {
      "eyebrow": "İletişim",
      "title": "Projenizi konuşalım",
      "subtitle": "Brief'inizi paylaşın, 48 saat içinde fizibilite ile dönelim."
    },
    "details": {
      "addressLabel": "Adres",
      "address": "Bursa Organize Sanayi Bölgesi, Nilüfer / Bursa, Türkiye",
      "phoneLabel": "Telefon",
      "phone": "+90 224 XXX XX XX",
      "emailLabel": "E-posta",
      "email": "info@kitaplastik.com",
      "hoursLabel": "Çalışma saatleri",
      "hours": "Pazartesi–Cuma 08:00–18:00 (UTC+3)"
    },
    "formNotice": "Detaylı RFQ formu Plan 3 kapsamında eklenecektir — şu anda e-posta ile talep alıyoruz."
  }
}
```

- [ ] **Step 2: JSON doğrulama + commit**

```bash
node -e 'require("./messages/tr/pages.json"); console.log("OK")'
git add messages/tr/pages.json
git commit -m "feat(i18n): add Turkish messages for product/engineering/workshop/quality/about/contact pages"
```

---

## Task 11: EN translations (6 namespace)

**Files:**
- Modify: `messages/en/{common,nav,home,sectors,references,pages}.json`

**Strateji:** Implementer TR JSON'ları bir bir okur, glossary.json'daki zorunlu terimleri kullanarak İngilizce karşılığını üretir ve JSON structure'ı birebir korur. Anahtarlar AYNEN TR ile aynı — sadece değerler İngilizce olur.

- [ ] **Step 1: `messages/en/common.json`**

```json
{
  "brand": {
    "name": "Kıta Plastik",
    "tagline": "Engineering partner in plastic injection"
  },
  "cta": {
    "requestQuote": "Request a Quote",
    "learnMore": "Learn more",
    "contactUs": "Contact us",
    "exploreSectors": "Explore sectors",
    "backToHome": "Back to home"
  },
  "notFound": {
    "title": "Page not found",
    "description": "The page you are looking for does not exist or has been moved.",
    "home": "Back to home"
  },
  "form": {
    "required": "Required field",
    "submit": "Submit",
    "cancel": "Cancel"
  },
  "footer": {
    "copyright": "© {year} Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
    "since": "From Bursa since 1989",
    "address": "Bursa Organised Industrial Zone",
    "phone": "Phone",
    "email": "Email",
    "links": "Links"
  }
}
```

- [ ] **Step 2: `messages/en/nav.json`**

```json
{
  "primary": "Primary navigation",
  "sectors": "Sectors",
  "products": "Products",
  "engineering": "Engineering",
  "workshop": "Workshop",
  "quality": "Quality",
  "references": "References",
  "about": "About",
  "contact": "Contact",
  "language": "Language"
}
```

- [ ] **Step 3: `messages/en/home.json`**

```json
{
  "hero": {
    "eyebrow": "Since 1989",
    "title": "Engineering partner in plastic injection",
    "subtitle": "From Bursa to the world. Standard products and custom engineering for the glass-washing, cap and textile sectors.",
    "primaryCta": "Request a Quote",
    "secondaryCta": "Explore sectors"
  },
  "references": {
    "eyebrow": "A trusted production partner",
    "title": "Brands that choose us",
    "subtitle": "36 years of experience, delivery across 3 continents.",
    "viewAll": "All references"
  },
  "sectors": {
    "eyebrow": "Sectors",
    "title": "Three sectors, one engineering discipline",
    "camYikama": {
      "title": "Glass Washing",
      "description": "Durable parts for bottle-washing and bottling lines."
    },
    "kapak": {
      "title": "Caps",
      "description": "High-volume cap production for food, cosmetics and chemical packaging."
    },
    "tekstil": {
      "title": "Textile",
      "description": "Precision plastic parts for textile machinery and accessories."
    }
  },
  "capabilities": {
    "eyebrow": "Capabilities",
    "title": "From mould design to serial production",
    "items": [
      { "title": "Mould Design", "description": "From customer brief to 3D model and tolerance scheme." },
      { "title": "Feasibility", "description": "Material, cost and process analysis." },
      { "title": "Serial Production", "description": "Multi-mould, calibrated, repeatable lines." },
      { "title": "Quality Control", "description": "Dimensional and visual inspection on every batch." }
    ]
  },
  "cta": {
    "title": "Let's talk about your project",
    "subtitle": "Share your brief and we'll come back with a feasibility study in 48 hours.",
    "button": "Request a Quote"
  }
}
```

- [ ] **Step 4: `messages/en/sectors.json`**

TR sectors.json'daki yapının birebir İngilizce karşılığı. Implementer:
1. `messages/tr/sectors.json`'u okur
2. Her string değeri İngilizce'ye çevirir, anahtarları KORUR
3. `glossary.json` terimlerini AYNEN kullanır (mould design, tolerance, injection moulding machine, vb.)
4. `messages/en/sectors.json`'a yazar

Örnek dönüşüm:
```
"Plastik enjeksiyonun mühendislik partneri" → "Engineering partner in plastic injection"
"Şişeleme hatlarına dayanıklı yıkama ekipmanı parçaları" → "Durable washing equipment parts for bottling lines"
"POM (asetal)" → "POM (acetal)"
"PA6 (naylon)" → "PA6 (nylon)"
```

- [ ] **Step 5: `messages/en/references.json`**

TR'dan çevir. Müşteri isimleri olduğu gibi kalır (özel isimler). Sektör etiketleri:
- "Cam Yıkama" → "Glass Washing"
- "Kapak" → "Caps"
- "Tekstil" → "Textile"

- [ ] **Step 6: `messages/en/pages.json`**

TR pages.json'un birebir İngilizce karşılığı. Glossary terimleri korunur. Adres satırı gibi yer adları aynı kalır ("Bursa Organised Industrial Zone" çevirisi yapılır; "Nilüfer / Bursa, Türkiye" aynen).

- [ ] **Step 7: JSON doğrulama + commit**

```bash
for f in messages/en/*.json; do node -e "require('./$f')" || exit 1; done
echo "OK"
git add messages/en/
git commit -m "feat(i18n): add English translations for all 6 namespaces"
```

---

## Task 12: RU translations (6 namespace)

**Files:**
- Modify: `messages/ru/{common,nav,home,sectors,references,pages}.json`

**Strateji:** Task 11 ile aynı — TR JSON'ları oku, glossary'deki RU karşılıklarını kullan, Russian'a çevir. Tarih/para formatları `Intl.NumberFormat('ru-RU')`'yle runtime'da yapılır, JSON'da raw text kalır.

- [ ] **Step 1: `messages/ru/common.json`**

```json
{
  "brand": {
    "name": "Kıta Plastik",
    "tagline": "Инженерный партнёр в литье пластмасс"
  },
  "cta": {
    "requestQuote": "Запросить предложение",
    "learnMore": "Подробнее",
    "contactUs": "Связаться с нами",
    "exploreSectors": "Изучить отрасли",
    "backToHome": "На главную"
  },
  "notFound": {
    "title": "Страница не найдена",
    "description": "Запрашиваемая страница не существует или была перемещена.",
    "home": "На главную"
  },
  "form": {
    "required": "Обязательное поле",
    "submit": "Отправить",
    "cancel": "Отмена"
  },
  "footer": {
    "copyright": "© {year} Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
    "since": "Из Бурсы с 1989 года",
    "address": "Организованная промышленная зона Бурсы",
    "phone": "Телефон",
    "email": "Эл. почта",
    "links": "Ссылки"
  }
}
```

- [ ] **Step 2: `messages/ru/nav.json`**

```json
{
  "primary": "Основная навигация",
  "sectors": "Отрасли",
  "products": "Продукция",
  "engineering": "Инжиниринг",
  "workshop": "Цех",
  "quality": "Качество",
  "references": "Отзывы",
  "about": "О нас",
  "contact": "Контакты",
  "language": "Язык"
}
```

- [ ] **Step 3: `messages/ru/home.json`**

TR home.json'un Rusça karşılığı. Glossary terimleri zorunlu:
- "plastik enjeksiyon" → "литьё пластмасс под давлением"
- "mühendislik partneri" → "инженерный партнёр"
- "Bursa'dan dünyaya" → "из Бурсы во весь мир"
- "1989'dan beri" → "с 1989 года"

- [ ] **Step 4: `messages/ru/sectors.json`**

Sektör isimleri:
- Cam Yıkama → Мойка стекла
- Kapak → Колпачки
- Tekstil → Текстиль

- [ ] **Step 5: `messages/ru/references.json`**

- [ ] **Step 6: `messages/ru/pages.json`**

- [ ] **Step 7: JSON doğrulama + commit**

```bash
for f in messages/ru/*.json; do node -e "require('./$f')" || exit 1; done
echo "OK"
git add messages/ru/
git commit -m "feat(i18n): add Russian translations for all 6 namespaces"
```

---

## Task 13: AR translations (6 namespace)

**Files:**
- Modify: `messages/ar/{common,nav,home,sectors,references,pages}.json`

**Strateji:** Task 11-12 ile aynı + RTL dikkat: 
- Arapça metinde ASCII harf + Arap harfi karışıyorsa, browser Unicode bidi algoritmasını kullanır. Özel `&lrm;`/`&rlm;` gömmek gerekmez.
- Özel isimler (Kıta Plastik) Latin harfle kalır — çevirmen Arapça metnin içinde bile Latin markayı korur.
- Telefon numarasını Arap-Hintçe rakam (٠١٢٣) yerine Western Arabic (0123) tut — B2B pratiği.

- [ ] **Step 1: `messages/ar/common.json`**

```json
{
  "brand": {
    "name": "Kıta Plastik",
    "tagline": "شريكك الهندسي في حقن البلاستيك"
  },
  "cta": {
    "requestQuote": "اطلب عرض سعر",
    "learnMore": "اعرف المزيد",
    "contactUs": "اتصل بنا",
    "exploreSectors": "استكشف القطاعات",
    "backToHome": "العودة إلى الرئيسية"
  },
  "notFound": {
    "title": "الصفحة غير موجودة",
    "description": "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    "home": "العودة إلى الرئيسية"
  },
  "form": {
    "required": "حقل مطلوب",
    "submit": "إرسال",
    "cancel": "إلغاء"
  },
  "footer": {
    "copyright": "© {year} Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
    "since": "من بورصة منذ 1989",
    "address": "منطقة بورصة الصناعية المنظمة",
    "phone": "الهاتف",
    "email": "البريد الإلكتروني",
    "links": "الروابط"
  }
}
```

- [ ] **Step 2: `messages/ar/nav.json`**

```json
{
  "primary": "التنقل الرئيسي",
  "sectors": "القطاعات",
  "products": "المنتجات",
  "engineering": "الهندسة",
  "workshop": "الورشة",
  "quality": "الجودة",
  "references": "المراجع",
  "about": "من نحن",
  "contact": "اتصل بنا",
  "language": "اللغة"
}
```

- [ ] **Step 3: `messages/ar/home.json`**

TR home.json'un Arapça karşılığı. Glossary zorunlu terimler: "حقن البلاستيك", "شريك هندسي", "من بورصة منذ 1989".

- [ ] **Step 4: `messages/ar/sectors.json`**

Sektör isimleri:
- Cam Yıkama → غسيل الزجاج
- Kapak → الأغطية
- Tekstil → النسيج

- [ ] **Step 5: `messages/ar/references.json`**

- [ ] **Step 6: `messages/ar/pages.json`**

- [ ] **Step 7: JSON doğrulama + commit**

```bash
for f in messages/ar/*.json; do node -e "require('./$f')" || exit 1; done
echo "OK"
git add messages/ar/
git commit -m "feat(i18n): add Arabic translations for all 6 namespaces"
```

---

## Task 14: Referans veri modeli + mock data + SVG logoları

**Files:**
- Create: `lib/references/types.ts`
- Create: `lib/references/data.ts`
- Create: `tests/unit/lib/references.test.ts`
- Create: `public/references/{c1..c8}.svg` (8 anonim SVG logo)

- [ ] **Step 1: Failing test**

`tests/unit/lib/references.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getReferences, getReferencesBySector } from "@/lib/references/data";

describe("references data", () => {
  it("returns 8 references", () => {
    expect(getReferences()).toHaveLength(8);
  });

  it("each reference has id, key, logoPath, sectorKey", () => {
    const refs = getReferences();
    for (const ref of refs) {
      expect(ref.id).toBeTruthy();
      expect(ref.key).toBeTruthy();
      expect(ref.logoPath).toMatch(/^\/references\/.+\.svg$/);
      expect(["camYikama", "kapak", "tekstil"]).toContain(ref.sectorKey);
    }
  });

  it("filters by sector", () => {
    const glass = getReferencesBySector("camYikama");
    expect(glass.length).toBeGreaterThan(0);
    expect(glass.every((r) => r.sectorKey === "camYikama")).toBe(true);
  });
});
```

Run: `pnpm test tests/unit/lib/references.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 2: `lib/references/types.ts`**

```typescript
export type SectorKey = "camYikama" | "kapak" | "tekstil";

export interface Reference {
  id: string;
  /** i18n key — messages/*/references.json.clients.{key} */
  key: string;
  logoPath: string;
  sectorKey: SectorKey;
}
```

- [ ] **Step 3: `lib/references/data.ts`**

```typescript
import type { Reference, SectorKey } from "./types";

const REFERENCES: ReadonlyArray<Reference> = [
  { id: "c1", key: "c1", logoPath: "/references/c1.svg", sectorKey: "camYikama" },
  { id: "c2", key: "c2", logoPath: "/references/c2.svg", sectorKey: "kapak" },
  { id: "c3", key: "c3", logoPath: "/references/c3.svg", sectorKey: "tekstil" },
  { id: "c4", key: "c4", logoPath: "/references/c4.svg", sectorKey: "camYikama" },
  { id: "c5", key: "c5", logoPath: "/references/c5.svg", sectorKey: "kapak" },
  { id: "c6", key: "c6", logoPath: "/references/c6.svg", sectorKey: "tekstil" },
  { id: "c7", key: "c7", logoPath: "/references/c7.svg", sectorKey: "camYikama" },
  { id: "c8", key: "c8", logoPath: "/references/c8.svg", sectorKey: "kapak" },
];

export function getReferences(): ReadonlyArray<Reference> {
  return REFERENCES;
}

export function getReferencesBySector(sector: SectorKey): ReadonlyArray<Reference> {
  return REFERENCES.filter((r) => r.sectorKey === sector);
}
```

- [ ] **Step 4: 8 mock SVG logoyu üret**

Her SVG ~150×60 viewBox, grayscale (`currentColor` stroke), minimal geometrik logo. Örnek `public/references/c1.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 60" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <rect x="10" y="15" width="30" height="30" />
  <text x="48" y="38" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="currentColor" stroke="none">Anadolu</text>
</svg>
```

8 logoyu farklı geometrik motif + farklı metin ile üret (c1 Anadolu, c2 Marmara, c3 Ege, c4 Bosphorus, c5 NordPack, c6 TextilePro, c7 Balkan, c8 Cosmopack). `currentColor` kullanımı sayesinde ReferencesStrip'te parent'ın text rengini alır (grayscale effect).

- [ ] **Step 5: Test geçmeli**

Run: `pnpm test tests/unit/lib/references.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/references/ tests/unit/lib/references.test.ts public/references/
git commit -m "feat(references): add mock client references data and 8 placeholder SVG logos"
```

---

## Task 15: ReferencesStrip komponenti (anasayfa above-the-fold)

**Files:**
- Create: `components/home/ReferencesStrip.tsx`
- Create: `tests/unit/components/ReferencesStrip.test.tsx`
- Modify: `app/[locale]/page.tsx` (enable import)
- Modify: `components/home/Hero.tsx` (yüksekliği daralt ki strip above-the-fold görünür olsun)

**Hedef:** Strip Hero'nun hemen altında, kullanıcı scroll etmeden görünür. Hero yüksekliği dvh olarak sınırlandırılır (örn. `min-h-[72dvh]`) böylece 1920×1080 ve 1440×900 monitörlerde strip fold üstünde.

- [ ] **Step 1: Failing test**

`tests/unit/components/ReferencesStrip.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ReferencesStrip } from "@/components/home/ReferencesStrip";

const messages = {
  home: {
    references: {
      eyebrow: "Güvenilen partner",
      title: "Bizi seçen markalar",
      subtitle: "36 yıl",
      viewAll: "Tümü",
    },
  },
  references: {
    clients: {
      c1: { name: "Anadolu", sector: "Cam" },
      c2: { name: "Marmara", sector: "Kapak" },
      c3: { name: "Ege", sector: "Tekstil" },
      c4: { name: "Bosphorus", sector: "Cam" },
      c5: { name: "Nord", sector: "Kapak" },
      c6: { name: "Textile", sector: "Tekstil" },
      c7: { name: "Balkan", sector: "Cam" },
      c8: { name: "Cosmo", sector: "Kapak" },
    },
  },
};

function renderStrip() {
  return render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <ReferencesStrip />
    </NextIntlClientProvider>,
  );
}

describe("ReferencesStrip", () => {
  it("renders eyebrow and title", () => {
    renderStrip();
    expect(screen.getByText("Güvenilen partner")).toBeInTheDocument();
    expect(screen.getByText("Bizi seçen markalar")).toBeInTheDocument();
  });

  it("renders all 8 client logos with aria labels", () => {
    renderStrip();
    expect(screen.getByRole("img", { name: /Anadolu/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Cosmo/i })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(8);
  });

  it("has link to full references page", () => {
    renderStrip();
    const link = screen.getByRole("link", { name: /Tümü/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("/referanslar"));
  });
});
```

Run: `pnpm test tests/unit/components/ReferencesStrip.test.tsx`
Expected: FAIL.

- [ ] **Step 2: `ReferencesStrip.tsx`**

```typescript
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getReferences } from "@/lib/references/data";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

export function ReferencesStrip() {
  const tHome = useTranslations("home.references");
  const tClients = useTranslations("references.clients");
  const references = getReferences();

  return (
    <section
      aria-labelledby="references-strip-title"
      className="border-border/50 border-y bg-muted/30 py-10 md:py-14"
    >
      <Container>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
              {tHome("eyebrow")}
            </p>
            <h2
              id="references-strip-title"
              className="mt-1 text-lg font-semibold tracking-tight md:text-xl"
            >
              {tHome("title")}
            </h2>
          </div>
          <Link
            href="/referanslar"
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
          >
            {tHome("viewAll")} →
          </Link>
        </div>

        <ul
          role="list"
          className={cn(
            "grid grid-cols-2 items-center gap-x-8 gap-y-6",
            "sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8",
            "text-muted-foreground",
          )}
        >
          {references.map((ref) => {
            const name = tClients(`${ref.key}.name`);
            return (
              <li key={ref.id} className="flex items-center justify-center">
                <Image
                  src={ref.logoPath}
                  alt={name}
                  width={150}
                  height={60}
                  className="h-12 w-auto opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
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

- [ ] **Step 3: Hero yüksekliğini daralt (fold içinde strip görünsün)**

`components/home/Hero.tsx`'de dış container class'ına `min-h-[72dvh]` veya benzeri koy (mevcut değer muhtemelen `min-h-dvh` — 100dvh tüm fold'u kaplıyor). Hedef: 72dvh Hero + ~25dvh strip = fold'a sığar.

- [ ] **Step 4: `app/[locale]/page.tsx` — ReferencesStrip import'unu aktive et**

Task 3'te yorum satırı olan import'u aç:

```typescript
import { ReferencesStrip } from "@/components/home/ReferencesStrip";
// ...
<Hero />
<ReferencesStrip />
<SectorGrid />
```

- [ ] **Step 5: Testler yeşil**

```bash
pnpm test tests/unit/components/ReferencesStrip.test.tsx
```
Expected: PASS.

- [ ] **Step 6: Manuel smoke test (browser)**

Dev server'ı açık tut, `http://localhost:3000/tr`'yi tarayıcıda aç, 1440×900 ve 1920×1080 çözünürlükte fold içinde "Bizi seçen markalar" başlığı ve 8 logo görünüyor mu kontrol et. Göremiyorsa Hero'nun `min-h`'ını daha da küçült (68dvh).

- [ ] **Step 7: Commit**

```bash
git add components/home/ReferencesStrip.tsx components/home/Hero.tsx app/[locale]/page.tsx tests/unit/components/ReferencesStrip.test.tsx
git commit -m "feat(home): add above-the-fold ReferencesStrip with 8 client logos"
```

---

## Task 16: /referanslar detay sayfası

**Files:**
- Create: `app/[locale]/referanslar/page.tsx`
- Create: `components/references/ReferenceCard.tsx`

- [ ] **Step 1: `components/references/ReferenceCard.tsx`**

```typescript
import Image from "next/image";
import type { Reference } from "@/lib/references/types";

interface ReferenceCardProps {
  reference: Reference;
  clientName: string;
  sectorLabel: string;
}

export function ReferenceCard({
  reference,
  clientName,
  sectorLabel,
}: ReferenceCardProps) {
  return (
    <article className="border-border/60 bg-card flex flex-col gap-4 rounded-lg border p-6">
      <div className="bg-muted/40 flex h-24 items-center justify-center rounded-md text-muted-foreground">
        <Image
          src={reference.logoPath}
          alt={clientName}
          width={160}
          height={64}
          className="h-14 w-auto"
        />
      </div>
      <div>
        <h3 className="text-base font-semibold">{clientName}</h3>
        <p className="text-muted-foreground mt-1 font-mono text-xs uppercase tracking-wider">
          {sectorLabel}
        </p>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: `app/[locale]/referanslar/page.tsx`**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { Container } from "@/components/layout/Container";
import { ReferenceCard } from "@/components/references/ReferenceCard";
import { getReferences } from "@/lib/references/data";
import { env } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "references.page" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("hero.title")} | Kıta Plastik`,
    description: t("hero.subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/referanslar`,
      languages: buildAlternates("/referanslar", origin).languages,
    },
  };
}

const SECTOR_NS_KEY = {
  camYikama: "hub.camYikama.title",
  kapak: "hub.kapak.title",
  tekstil: "hub.tekstil.title",
} as const;

export default async function ReferencesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tPage = await getTranslations("references.page");
  const tClients = await getTranslations("references.clients");
  const tSectors = await getTranslations("sectors");

  const references = getReferences();

  return (
    <Container as="section" className="py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {tPage("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {tPage("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          {tPage("hero.subtitle")}
        </p>
      </header>

      <h2 className="mt-12 text-2xl font-semibold">{tPage("sectionTitle")}</h2>

      {references.length === 0 ? (
        <p className="text-muted-foreground mt-6">{tPage("empty")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {references.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              clientName={tClients(`${ref.key}.name`)}
              sectorLabel={tSectors(SECTOR_NS_KEY[ref.sectorKey])}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
```

- [ ] **Step 3: `Container` komponenti `as` prop'unu destekliyor mu kontrol et**

`components/layout/Container.tsx`'i oku. `as` prop desteklemiyorsa ya düz `<Container>` + dış `<section>` kullan ya da Container'a `as?: ElementType` prop'u ekle. Minimal değişiklik için yukarıdaki kodda `<section>` dış sarıcı olarak kullan:

```typescript
<section className="container mx-auto px-6 py-16 md:py-24">
  {/* header + grid */}
</section>
```

- [ ] **Step 4: Smoke test**

```bash
curl -sI http://localhost:3000/tr/referanslar | head -3
curl -sI http://localhost:3000/en/referanslar | head -3
curl -sI http://localhost:3000/ar/referanslar | head -3
```
Expected: Hepsi 200.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/referanslar/ components/references/
git commit -m "feat(references): add full /referanslar detail page with grid of client cards"
```

---

## Task 17: R3F + three dependency kurulumu + tip setup

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Dependencies ekle**

```bash
pnpm add three@^0.170 @react-three/fiber@^8.18 @react-three/drei@^9.120
pnpm add -D @types/three@^0.170
```

Expected: `three`, `@react-three/fiber`, `@react-three/drei` deps'e; `@types/three` devDeps'e eklenir.

- [ ] **Step 2: TS derlemesi**

Run: `pnpm typecheck`
Expected: No errors (types üçünden geliyor).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add react-three-fiber, drei and three for 3D hero"
```

---

## Task 18: GLSL shader dosyaları (atmospheric)

**Files:**
- Create: `components/three/shaders/atmospheric.vert.glsl`
- Create: `components/three/shaders/atmospheric.frag.glsl`
- Create: `components/three/shaders/index.ts`

**Yaklaşım:** GLSL'i string import edebilmek için tsconfig + vitest'te raw import ayarı gerek. Alternatif: GLSL'i TS template string olarak `index.ts`'e gömmek — ayrı dosya karmaşasını önler ve runtime'da ek loader gerekmez. Bu planda TS template string yolunu seçiyoruz (Plan 3'te gerekirse `glslify` pipeline'ına geçilebilir).

- [ ] **Step 1: `components/three/shaders/index.ts`**

```typescript
export const atmosphericVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphericFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  // 2D Simplex noise — Ashima Arts / Ian McEwan
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    vec2 parallax = uMouse * 0.1;
    uv += parallax;

    // Flow alanı — iki noise katmanı farklı hızlarda kayar
    float flow1 = snoise(uv * 2.0 + vec2(uTime * 0.05, 0.0));
    float flow2 = snoise(uv * 3.5 + vec2(0.0, uTime * 0.03));
    float mixed = (flow1 + flow2) * 0.5;

    // Gradient renk karışımı
    float t = smoothstep(-0.5, 0.5, mixed);
    vec3 color = mix(uColorA, uColorB, t);

    // Light particles — noise eşik
    float sparkle = smoothstep(0.75, 0.85, snoise(uv * 30.0 + uTime * 0.2));
    color += sparkle * 0.15;

    gl_FragColor = vec4(color, 1.0);
  }
`;
```

- [ ] **Step 2: Atmospheric renkler için palette sabiti ekle**

Aynı `index.ts`'e:

```typescript
import { Color } from "three";

// Industrial Precision palette — spec §5.2
export const ATMOSPHERIC_COLOR_A = new Color("#0b1220"); // deep navy
export const ATMOSPHERIC_COLOR_B = new Color("#1e3a5f"); // industrial blue
```

- [ ] **Step 3: Commit (shader sadece, canvas yok)**

```bash
git add components/three/shaders/
git commit -m "feat(three): add atmospheric GLSL shader with noise and flow"
```

---

## Task 19: HeroCanvas + AtmosphericMesh (R3F canvas)

**Files:**
- Create: `components/three/AtmosphericMesh.tsx`
- Create: `components/three/HeroCanvas.tsx`

- [ ] **Step 1: `components/three/AtmosphericMesh.tsx`**

```typescript
"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ShaderMaterial } from "three";
import {
  atmosphericVertexShader,
  atmosphericFragmentShader,
  ATMOSPHERIC_COLOR_A,
  ATMOSPHERIC_COLOR_B,
} from "./shaders";

interface AtmosphericMeshProps {
  reduced?: boolean;
}

export function AtmosphericMesh({ reduced = false }: AtmosphericMeshProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: [0, 0] as [number, number] },
      uColorA: { value: ATMOSPHERIC_COLOR_A },
      uColorB: { value: ATMOSPHERIC_COLOR_B },
    }),
    [],
  );

  useFrame((state) => {
    if (!materialRef.current || reduced) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const { x, y } = state.pointer;
    const current = materialRef.current.uniforms.uMouse.value as [number, number];
    // Smooth lerp
    current[0] += (x - current[0]) * 0.05;
    current[1] += (y - current[1]) * 0.05;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphericVertexShader}
        fragmentShader={atmosphericFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: `components/three/HeroCanvas.tsx`**

```typescript
"use client";

import { Canvas } from "@react-three/fiber";
import { AtmosphericMesh } from "./AtmosphericMesh";

interface HeroCanvasProps {
  reduced?: boolean;
}

export function HeroCanvas({ reduced = false }: HeroCanvasProps) {
  return (
    <Canvas
      aria-hidden="true"
      className="absolute inset-0"
      camera={{ position: [0, 0, 1], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        powerPreference: "low-power",
        alpha: false,
      }}
      frameloop={reduced ? "never" : "always"}
    >
      <AtmosphericMesh reduced={reduced} />
    </Canvas>
  );
}

// Required for next/dynamic default export
export default HeroCanvas;
```

- [ ] **Step 3: TypeScript kontrol**

```bash
pnpm typecheck
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/three/AtmosphericMesh.tsx components/three/HeroCanvas.tsx
git commit -m "feat(three): add HeroCanvas with atmospheric shader mesh"
```

---

## Task 20: Fallback — reduce-motion + WebGL + saveData hook + CSS fallback

**Files:**
- Create: `components/three/useReducedMotion.ts`
- Create: `components/three/HeroFallback.tsx`
- Create: `tests/unit/components/HeroFallback.test.tsx`

- [ ] **Step 1: `components/three/useReducedMotion.ts`**

```typescript
"use client";

import { useEffect, useState } from "react";

/**
 * Returns true if the 3D hero should be skipped:
 * - OS prefers-reduced-motion: reduce
 * - navigator.connection.saveData (Data Saver)
 * - hardwareConcurrency < 4 (low-power device)
 * - WebGL unavailable
 */
export function useShouldReduceMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) prefers-reduced-motion
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      setReduced(true);
      return;
    }

    // 2) saveData
    type NavConn = { saveData?: boolean };
    const conn = (navigator as Navigator & { connection?: NavConn }).connection;
    if (conn?.saveData) {
      setReduced(true);
      return;
    }

    // 3) low-power device
    if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4) {
      setReduced(true);
      return;
    }

    // 4) WebGL detection
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!ctx) {
      setReduced(true);
      return;
    }

    setReduced(false);

    // React to OS preference changes
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return reduced;
}
```

- [ ] **Step 2: `components/three/HeroFallback.tsx`**

```typescript
export function HeroFallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_theme(colors.slate.800)_0%,_theme(colors.slate.950)_55%,_theme(colors.slate.950)_100%)]"
    >
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
    </div>
  );
}
```

- [ ] **Step 3: Failing test — fallback renders**

`tests/unit/components/HeroFallback.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HeroFallback } from "@/components/three/HeroFallback";

describe("HeroFallback", () => {
  it("renders aria-hidden decorative background", () => {
    const { container } = render(<HeroFallback />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.className).toContain("absolute");
    expect(root.className).toContain("inset-0");
  });
});
```

- [ ] **Step 4: Test geçmeli**

```bash
pnpm test tests/unit/components/HeroFallback.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/three/useReducedMotion.ts components/three/HeroFallback.tsx tests/unit/components/HeroFallback.test.tsx
git commit -m "feat(three): add reduce-motion/WebGL/saveData detection and CSS fallback"
```

---

## Task 21: Hero komponentine 3D entegrasyonu + dynamic import

**Files:**
- Modify: `components/home/Hero.tsx`

- [ ] **Step 1: Mevcut Hero.tsx'i oku**

```bash
cat components/home/Hero.tsx
```

Mevcut içerik muhtemelen plain gradient + metin. Taşınan parçaları kaybetme.

- [ ] **Step 2: Hero'yu 3D + fallback ile güncelle**

```typescript
"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { HeroFallback } from "@/components/three/HeroFallback";
import { useShouldReduceMotion } from "@/components/three/useReducedMotion";
import { cn } from "@/lib/utils";

const HeroCanvas = dynamic(
  () => import("@/components/three/HeroCanvas").then((mod) => mod.HeroCanvas),
  {
    ssr: false,
    loading: () => <HeroFallback />,
  },
);

export function Hero() {
  const t = useTranslations("home.hero");
  const reduced = useShouldReduceMotion();

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[72dvh] items-center overflow-hidden bg-slate-950 text-slate-50"
    >
      {reduced ? <HeroFallback /> : <HeroCanvas reduced={false} />}

      <Container className="relative z-10">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
            {t("eyebrow")}
          </p>
          <h1
            id="hero-title"
            className={cn(
              "mt-4 text-4xl font-semibold leading-tight tracking-tight",
              "md:text-5xl lg:text-6xl",
            )}
          >
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300 md:text-xl">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/iletisim"
              className="rounded bg-slate-50 px-6 py-3 font-medium text-slate-950 transition hover:bg-slate-200"
            >
              {t("primaryCta")}
            </Link>
            <Link
              href="/sektorler"
              className="rounded border border-slate-600 px-6 py-3 font-medium text-slate-100 transition hover:border-slate-400"
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Manuel browser smoke**

Dev server'da `http://localhost:3000/tr` aç. Kontrol et:
- Canvas yüklendiğinde atmosferik renk dalgalanması görünüyor mu
- Mouse hareketiyle parallax olyor mu
- OS'da reduce-motion açıksa fallback gradient görünüyor mu (System Settings > Accessibility > Display)
- Network throttling "Slow 3G" ve saveData açıkken fallback görünür mü

- [ ] **Step 4: Bundle size doğrulaması**

```bash
pnpm build 2>&1 | grep -E "(First Load|hero|three)" | head -20
```

Hero chunk ≤120 KB (gzipped) olmalı (spec §6.4). Aşarsa shader/drei ağaç ayıklaması gerekir — bu plan kapsamında drei zaten kullanılmıyor (yanlızca Canvas), bu yüzden sınırda olmalı. Aşım durumu flag'le ve task raporunda bildir.

- [ ] **Step 5: Commit**

```bash
git add components/home/Hero.tsx
git commit -m "feat(home): integrate atmospheric 3D canvas into Hero with reduce-motion fallback"
```

---

## Task 22: /sektorler hub sayfası

**Files:**
- Create: `app/[locale]/sektorler/page.tsx`

**Template pattern (tüm sayfalarda aynı iskelet):**
1. `async function generateMetadata({params})` — title + description + alternates
2. `export default async function Page({params})` — `setRequestLocale` + `getTranslations`
3. Hero başlık bloğu (eyebrow + h1 + subtitle)
4. Sayfa-özel section(lar)

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "sectors.hub.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/sektorler`,
      languages: buildAlternates("/sektorler", origin).languages,
    },
  };
}

const SECTORS = [
  { slug: "cam-yikama", nsKey: "camYikama" },
  { slug: "kapak", nsKey: "kapak" },
  { slug: "tekstil", nsKey: "tekstil" },
] as const;

export default async function SectorsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sectors.hub");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {SECTORS.map((sector) => (
          <Link
            key={sector.slug}
            href={`/sektorler/${sector.slug}`}
            className="border-border/60 hover:border-foreground/40 group flex flex-col gap-3 rounded-lg border p-6 transition"
          >
            <h2 className="text-xl font-semibold">{t(`${sector.nsKey}.title`)}</h2>
            <p className="text-muted-foreground">{t(`${sector.nsKey}.description`)}</p>
            <span className="text-muted-foreground group-hover:text-foreground mt-auto pt-2 font-mono text-xs uppercase">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Smoke test + commit**

```bash
curl -sI http://localhost:3000/tr/sektorler | head -3
curl -sI http://localhost:3000/en/sektorler | head -3
git add app/[locale]/sektorler/page.tsx
git commit -m "feat(pages): add /sektorler hub page"
```

---

## Task 23: /sektorler/cam-yikama alt sayfası

**Files:**
- Create: `app/[locale]/sektorler/cam-yikama/page.tsx`

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

const ROUTE = "/sektorler/cam-yikama";
const NS = "sectors.camYikama";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${NS}.hero` });
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

export default async function CamYikamaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(NS);
  const tCta = await getTranslations("common.cta");

  const solutions = t.raw("solutions.items") as ReadonlyArray<{ title: string; description: string }>;
  const materials = t.raw("materials.items") as ReadonlyArray<string>;

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold">{t("solutions.title")}</h2>
          <ul role="list" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {solutions.map((item) => (
              <li key={item.title} className="border-border/60 rounded-lg border p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside>
          <h2 className="text-2xl font-semibold">{t("materials.title")}</h2>
          <ul role="list" className="mt-6 space-y-2 font-mono text-sm">
            {materials.map((mat) => (
              <li key={mat} className="border-border/60 rounded border px-3 py-2">
                {mat}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="mt-16 flex flex-wrap gap-4">
        <Link
          href="/iletisim"
          className="rounded bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90"
        >
          {tCta("requestQuote")}
        </Link>
        <Link
          href="/sektorler"
          className="rounded border border-border px-6 py-3 font-medium transition hover:border-foreground/40"
        >
          ← {tCta("exploreSectors")}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/sektorler/cam-yikama/page.tsx
git commit -m "feat(pages): add /sektorler/cam-yikama sector page"
```

---

## Task 24: /sektorler/kapak alt sayfası

**Files:**
- Create: `app/[locale]/sektorler/kapak/page.tsx`

- [ ] **Step 1: Task 23'teki cam-yikama sayfasını birebir kopyala, sadece 2 sabiti değiştir:**

```typescript
const ROUTE = "/sektorler/kapak";
const NS = "sectors.kapak";
```

Dosya ismi `app/[locale]/sektorler/kapak/page.tsx`. Function adı `KapakPage`. Geri kalan kod (metadata, render, solutions, materials, CTA) Task 23'teki pattern'i tekrarlar — aynı skeleton + aynı i18n namespace structure. Tüm kodu kopyala, yukarıdaki 2 sabiti değiştir, function adını değiştir.

Tam kod:

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

const ROUTE = "/sektorler/kapak";
const NS = "sectors.kapak";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `${NS}.hero` });
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

export default async function KapakPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(NS);
  const tCta = await getTranslations("common.cta");

  const solutions = t.raw("solutions.items") as ReadonlyArray<{ title: string; description: string }>;
  const materials = t.raw("materials.items") as ReadonlyArray<string>;

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold">{t("solutions.title")}</h2>
          <ul role="list" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {solutions.map((item) => (
              <li key={item.title} className="border-border/60 rounded-lg border p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <aside>
          <h2 className="text-2xl font-semibold">{t("materials.title")}</h2>
          <ul role="list" className="mt-6 space-y-2 font-mono text-sm">
            {materials.map((mat) => (
              <li key={mat} className="border-border/60 rounded border px-3 py-2">
                {mat}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="mt-16 flex flex-wrap gap-4">
        <Link
          href="/iletisim"
          className="rounded bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90"
        >
          {tCta("requestQuote")}
        </Link>
        <Link
          href="/sektorler"
          className="rounded border border-border px-6 py-3 font-medium transition hover:border-foreground/40"
        >
          ← {tCta("exploreSectors")}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/sektorler/kapak/page.tsx
git commit -m "feat(pages): add /sektorler/kapak sector page"
```

---

## Task 25: /sektorler/tekstil alt sayfası

**Files:**
- Create: `app/[locale]/sektorler/tekstil/page.tsx`

- [ ] **Step 1: Task 24'teki kapak sayfasının kod tabanını birebir kopyala, 2 sabit + function adı değiştir:**

```typescript
const ROUTE = "/sektorler/tekstil";
const NS = "sectors.tekstil";
```
Function adı: `TekstilPage`

Tam kod Task 24 ile aynı skeleton — sadece yukarıdaki 2 sabit ve function adı değişir. Kısaltmak için burada tekrar yazmıyorum; executor Task 24'teki dosyayı kopyalayıp yeni path'e koyar, 3 stringi değiştirir.

```bash
cp app/[locale]/sektorler/kapak/page.tsx app/[locale]/sektorler/tekstil/page.tsx
```

Sonra Edit ile:
- `const ROUTE = "/sektorler/kapak"` → `const ROUTE = "/sektorler/tekstil"`
- `const NS = "sectors.kapak"` → `const NS = "sectors.tekstil"`
- `function KapakPage` → `function TekstilPage`

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/sektorler/tekstil/page.tsx
git commit -m "feat(pages): add /sektorler/tekstil sector page"
```

---

## Task 26: /urunler sayfası (MVP placeholder notice)

**Files:**
- Create: `app/[locale]/urunler/page.tsx`

Spec §17.1: MVP'de ürün kataloğu sınırlı — Plan 2 placeholder, tam katalog Plan 3'te Supabase tablosundan gelecek.

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.products.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/urunler`,
      languages: buildAlternates("/urunler", origin).languages,
    },
  };
}

export default async function UrunlerPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.products");
  const tCta = await getTranslations("common.cta");

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <aside className="border-border/60 bg-muted/30 mt-12 rounded-lg border p-6">
        <p className="text-muted-foreground">{t("notice")}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/iletisim"
            className="rounded bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90"
          >
            {tCta("requestQuote")}
          </Link>
          <Link
            href="/sektorler"
            className="rounded border border-border px-6 py-3 font-medium transition hover:border-foreground/40"
          >
            {tCta("exploreSectors")}
          </Link>
        </div>
      </aside>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/urunler/page.tsx
git commit -m "feat(pages): add /urunler placeholder page with RFQ CTA"
```

---

## Task 27: /muhendislik sayfası

**Files:**
- Create: `app/[locale]/muhendislik/page.tsx`

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.engineering.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/muhendislik`,
      languages: buildAlternates("/muhendislik", origin).languages,
    },
  };
}

export default async function MuhendislikPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.engineering");
  const tCta = await getTranslations("common.cta");

  const steps = t.raw("process.steps") as ReadonlyArray<{ title: string; description: string }>;
  const capabilities = t.raw("capabilities.items") as ReadonlyArray<{ label: string; value: string }>;

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <div className="mt-16">
        <h2 className="text-2xl font-semibold">{t("process.title")}</h2>
        <ol role="list" className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.title} className="border-border/60 rounded-lg border p-5">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-semibold">{t("capabilities.title")}</h2>
        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {capabilities.map((cap) => (
            <div key={cap.label} className="border-border/40 border-b pb-3">
              <dt className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                {cap.label}
              </dt>
              <dd className="mt-1 font-medium">{cap.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <aside className="border-border/60 bg-muted/30 mt-16 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">{t("confidentiality.title")}</h2>
        <p className="text-muted-foreground mt-2">{t("confidentiality.body")}</p>
      </aside>

      <div className="mt-16">
        <Link
          href="/iletisim"
          className="rounded bg-foreground px-6 py-3 font-medium text-background transition hover:opacity-90"
        >
          {tCta("requestQuote")}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/muhendislik/page.tsx
git commit -m "feat(pages): add /muhendislik custom engineering page"
```

---

## Task 28: /atolye sayfası

**Files:**
- Create: `app/[locale]/atolye/page.tsx`

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.workshop.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/atolye`,
      languages: buildAlternates("/atolye", origin).languages,
    },
  };
}

export default async function AtolyePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.workshop");

  const stats = [
    { label: "area", value: t("stats.area") },
    { label: "machines", value: t("stats.machines") },
    { label: "capacity", value: t("stats.capacity") },
    { label: "staff", value: t("stats.staff") },
  ];

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <dl className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-border/60 bg-card rounded-lg border p-6">
            <dt className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
              {s.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/atolye/page.tsx
git commit -m "feat(pages): add /atolye workshop page with capacity stats"
```

---

## Task 29: /kalite sayfası

**Files:**
- Create: `app/[locale]/kalite/page.tsx`

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.quality.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/kalite`,
      languages: buildAlternates("/kalite", origin).languages,
    },
  };
}

export default async function KalitePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.quality");

  const certificates = t.raw("certificates.items") as ReadonlyArray<{ name: string; description: string }>;
  const processItems = t.raw("process.items") as ReadonlyArray<string>;

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl font-semibold">{t("certificates.title")}</h2>
          <ul role="list" className="mt-6 space-y-4">
            {certificates.map((cert) => (
              <li key={cert.name} className="border-border/60 rounded-lg border p-5">
                <h3 className="font-semibold">{cert.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{cert.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">{t("process.title")}</h2>
          <ol role="list" className="mt-6 space-y-3">
            {processItems.map((step, idx) => (
              <li key={step} className="flex gap-4">
                <span className="text-muted-foreground font-mono text-sm">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/kalite/page.tsx
git commit -m "feat(pages): add /kalite quality page with certificates and process"
```

---

## Task 30: /hakkimizda sayfası

**Files:**
- Create: `app/[locale]/hakkimizda/page.tsx`

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.about.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/hakkimizda`,
      languages: buildAlternates("/hakkimizda", origin).languages,
    },
  };
}

export default async function HakkimizdaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.about");

  const values = t.raw("values.items") as ReadonlyArray<{ title: string; description: string }>;

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <article className="prose-invert mt-16 max-w-3xl">
        <h2 className="text-2xl font-semibold">{t("story.title")}</h2>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("story.body")}</p>
      </article>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">{t("values.title")}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="border-border/60 rounded-lg border p-6">
              <h3 className="font-semibold">{v.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{v.description}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/hakkimizda/page.tsx
git commit -m "feat(pages): add /hakkimizda about page with story and values"
```

---

## Task 31: /iletisim sayfası

**Files:**
- Create: `app/[locale]/iletisim/page.tsx`

- [ ] **Step 1: Dosya içeriği**

```typescript
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.contact.hero" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/iletisim`,
      languages: buildAlternates("/iletisim", origin).languages,
    },
  };
}

export default async function IletisimPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");

  const rows = [
    { label: t("details.addressLabel"), value: t("details.address") },
    { label: t("details.phoneLabel"), value: t("details.phone"), href: "tel:+90224" },
    { label: t("details.emailLabel"), value: t("details.email"), href: "mailto:info@kitaplastik.com" },
    { label: t("details.hoursLabel"), value: t("details.hours") },
  ];

  return (
    <section className="container mx-auto px-6 py-16 md:py-24">
      <header className="max-w-3xl">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{t("hero.subtitle")}</p>
      </header>

      <dl className="mt-16 max-w-2xl divide-y divide-border/60">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 gap-4 py-4">
            <dt className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
              {row.label}
            </dt>
            <dd className="col-span-2">
              {row.href ? (
                <a href={row.href} className="underline underline-offset-4">
                  {row.value}
                </a>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <aside className="border-border/60 bg-muted/30 mt-12 max-w-2xl rounded-lg border p-6">
        <p className="text-muted-foreground text-sm">{t("formNotice")}</p>
      </aside>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/iletisim/page.tsx
git commit -m "feat(pages): add /iletisim contact page with address and phone/email"
```

---

## Task 32: Cilalı logo SVG

**Files:**
- Create: `public/logo/kita-logo.svg`
- Delete: `public/logo/kita-logo-placeholder.svg`
- Modify: `components/layout/Header.tsx` (logo referansı + wordmark)
- Modify: `components/layout/Footer.tsx` (eğer placeholder logo referansı varsa)

**Yön:** Spec §5.1 + brainstorm "logo direction B — hafif rötuş". Monogram "K" + wordmark "kıta" — sans-serif, geometrik, endüstriyel. Dış daire yerine hafif açılı (chamfered) köşeli kare içinde stilize K.

- [ ] **Step 1: `public/logo/kita-logo.svg` oluştur**

Final SVG, `currentColor` kullanımıyla (Header'da text rengini alır):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 32" fill="none" aria-label="Kıta Plastik">
  <g fill="currentColor">
    <!-- Monogram: chamfered square with stylized K -->
    <path d="M4 4 L26 4 L30 8 L30 28 L8 28 L4 24 Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <path d="M11 10 L11 22 M11 16 L18 10 M11 16 L19 22" stroke="currentColor" stroke-width="2" stroke-linecap="square"/>
  </g>
  <!-- Wordmark -->
  <text x="38" y="22" font-family="var(--font-inter), system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="-0.02em" fill="currentColor">
    kıta
  </text>
  <text x="38" y="31" font-family="var(--font-mono), monospace" font-size="7" font-weight="500" letter-spacing="0.15em" fill="currentColor" opacity="0.6">
    PLASTİK · 1989
  </text>
</svg>
```

- [ ] **Step 2: Placeholder'ı sil**

```bash
rm public/logo/kita-logo-placeholder.svg
```

- [ ] **Step 3: Header'daki logo referansını güncelle**

Mevcut Header.tsx'te text "Kıta Plastik" olabilir veya placeholder SVG import'u olabilir. Her iki durumda da:

```typescript
import Image from "next/image";
import kitaLogo from "@/public/logo/kita-logo.svg";

// ...
<Link href="/" className="flex items-center">
  <Image
    src={kitaLogo}
    alt="Kıta Plastik"
    height={32}
    priority
    className="h-8 w-auto text-foreground"
  />
</Link>
```

**Not:** Next.js SVG import'ları `next/image` ile `currentColor` boyamayı koruyamayabilir. Alternatif — inline SVG component:

```typescript
export function KitaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" className={className} aria-label="Kıta Plastik">
      {/* yukarıdaki SVG içeriğinin inline'i */}
    </svg>
  );
}
```

Executor bu 2 yaklaşımdan inline component yolunu tercih etmeli (currentColor RTL'de ve tema değişiminde tutarlı çalışır). `components/layout/KitaLogo.tsx` olarak ayrı dosya, Header'da import.

- [ ] **Step 4: Footer'da placeholder referansı varsa güncelle**

```bash
grep -r "kita-logo-placeholder" components/ app/ || true
```

Çıktı varsa aynı değişikliği Footer için de yap.

- [ ] **Step 5: Commit**

```bash
git add public/logo/ components/layout/
git commit -m "feat(brand): replace placeholder logo with polished wordmark SVG"
```

---

## Task 33: README + .env.example güncelleme

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: `.env.example` — `ANTHROPIC_API_KEY` satırını kaldır**

Mevcut `.env.example`'da `ANTHROPIC_API_KEY=` ve yorum satırı varsa:

```bash
# Bu satırları sil (Plan 2 revize: Python çeviri pipeline iptal edildi, Claude session'da elle çevrildi):
# Anthropic (Plan 2 — translate.py için CI'da)
ANTHROPIC_API_KEY=
```

Edit ile kaldır. Onun yerine Task 6'da eklenen `NEXT_PUBLIC_SITE_URL` satırının varlığını doğrula.

- [ ] **Step 2: README.md'ye i18n + 3D bölümü ekle**

README'nin sonuna (mevcut bölümlerden sonra) şu başlıkları ekle:

```markdown
## Uluslararasılaştırma (i18n)

Site 4 dili destekler: **TR** (kaynak), **EN**, **RU**, **AR** (RTL). Tüm public sayfalar `app/[locale]/` altındadır ve middleware kök isteği `/tr`'ye redirect eder.

- **Kaynak dil:** TR (`messages/tr/*.json`)
- **Çeviriler:** EN/RU/AR JSON'ları `messages/{lang}/*.json`. İçerik güncellemesi için TR'yi düzenleyip Claude session'ı ile kalan dilleri güncelleyiniz. `glossary.json` teknik terim rehberidir.
- **RTL:** Arapça locale'de `<html dir="rtl">`, Tailwind logical utilities (`ms-/me-/ps-/pe-`) otomatik davranır. `rtl-flip` utility'si ile ikonları aynalayın.
- **Sitemap / hreflang:** `app/sitemap.ts` otomatik 4 dil alternatifleri üretir.

## 3D Atmosferik Hero

Anasayfa Hero'da custom GLSL shader — `react-three-fiber` + özel perlin noise + flow + light particles. Kritik detaylar:

- `dynamic({ ssr: false })` ile lazy-load (bundle ~100 KB gzip).
- **Fallback tetikleyicileri:** `prefers-reduced-motion: reduce`, `navigator.connection.saveData`, `hardwareConcurrency < 4`, WebGL yokluğu → CSS gradient fallback (`HeroFallback`).
- Perf bütçesi: <120 KB hero bundle, 60fps desktop / 30fps mobile.
- Shader dosyaları: `components/three/shaders/index.ts` içinde TS template literal.

## Referanslar

Anasayfa above-the-fold'da **ReferencesStrip** (8 müşteri logosu) + `/referanslar` detay sayfası. Veri şu an `lib/references/data.ts`'de mock — Plan 3'te Supabase `clients` tablosuna taşınır (interface aynı kalır).

## Yeni İçerik Ekleme

1. Sadece `messages/tr/*.json` dosyasını düzenleyin (kaynak dil).
2. `glossary.json`'u kontrol edin — yeni teknik terim varsa ekleyin.
3. Claude session açıp `messages/{en,ru,ar}/*.json`'u TR'ye göre güncellemesini isteyin.
4. Değişiklikleri commit edin. CI testlerini çalıştırın (`pnpm test`, `pnpm typecheck`).
```

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: document i18n, 3D hero, references pipeline and remove ANTHROPIC_API_KEY"
```

---

## Task 34: E2E testleri — i18n + referanslar + pages smoke

**Files:**
- Create: `tests/e2e/i18n.spec.ts`
- Create: `tests/e2e/references.spec.ts`
- Create: `tests/e2e/pages-smoke.spec.ts`
- Modify: mevcut e2e testleri locale-aware yap (URL'leri `/tr` prefix ile)

- [ ] **Step 1: Mevcut e2e testlerini incele**

```bash
ls tests/e2e/
```

Plan 1'de eklenen e2e testleri muhtemelen `/` path'ini kullanıyordu. Middleware artık `/tr`'ye redirect ediyor — mevcut testler ya otomatik redirect üzerinden geçer ya da URL assertion'ı düzeltilmelidir.

```bash
grep -rn 'page.goto' tests/e2e/ | head
```

Her `.goto('/')` → `.goto('/tr')` olarak güncelle (veya `{ waitUntil: 'networkidle' }` ile redirect'i kabul et).

- [ ] **Step 2: `tests/e2e/i18n.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

test.describe("i18n routing", () => {
  test("root redirects to /tr", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.url()).toMatch(/\/tr\/?$/);
  });

  for (const locale of LOCALES) {
    test(`homepage renders for ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const expectedDir = locale === "ar" ? "rtl" : "ltr";
      await expect(page.locator("html")).toHaveAttribute("dir", expectedDir);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("LocaleSwitcher navigates to selected locale", async ({ page }) => {
    await page.goto("/tr");
    await page.getByRole("link", { name: "EN" }).click();
    await expect(page).toHaveURL(/\/en/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
```

- [ ] **Step 3: `tests/e2e/references.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("references", () => {
  test("ReferencesStrip visible above the fold on 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tr");

    const strip = page.getByRole("heading", { name: /Bizi seçen markalar/ });
    await expect(strip).toBeVisible();

    const box = await strip.boundingBox();
    expect(box).not.toBeNull();
    // Strip heading must sit within viewport (y + height ≤ viewport height)
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(900);
  });

  test("clicking 'Tümü' navigates to /referanslar", async ({ page }) => {
    await page.goto("/tr");
    await page.getByRole("link", { name: /Tümü/ }).click();
    await expect(page).toHaveURL(/\/referanslar/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/referanslar lists 8 client cards", async ({ page }) => {
    await page.goto("/tr/referanslar");
    const cards = page.locator("article");
    await expect(cards).toHaveCount(8);
  });
});
```

- [ ] **Step 4: `tests/e2e/pages-smoke.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/sektorler",
  "/sektorler/cam-yikama",
  "/sektorler/kapak",
  "/sektorler/tekstil",
  "/urunler",
  "/muhendislik",
  "/atolye",
  "/kalite",
  "/hakkimizda",
  "/iletisim",
  "/referanslar",
];

const LOCALES = ["tr", "en", "ru", "ar"];

test.describe("public pages smoke", () => {
  for (const locale of LOCALES) {
    for (const route of PUBLIC_ROUTES) {
      test(`${locale}${route} returns 200 and has h1`, async ({ page }) => {
        const response = await page.goto(`/${locale}${route === "/" ? "" : route}`);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1").first()).toBeVisible();
      });
    }
  }
});
```

- [ ] **Step 5: E2E çalıştır**

```bash
pnpm test:e2e
```

Expected: Tüm testler yeşil. CI'da headless modunda çalıştığı için performans farklarını hesaba kat. Eğer ReferencesStrip viewport testi başarısızsa Hero `min-h` değerini düşür.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): add i18n routing, references and pages smoke suites"
```

---

## Task 35: Final smoke test + CI doğrulama + özet commit

**Files:**
- (doğrulama task'ı — kod değişikliği yok)

- [ ] **Step 1: Temizlik — gereksiz placeholder dosya var mı?**

```bash
find app public components -type f -name "*.placeholder*" -o -name "*-placeholder*" 2>/dev/null
```

Expected: boş (hepsi kaldırılmış olmalı).

- [ ] **Step 2: Type + lint + test tam suite**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

Expected: Hepsi yeşil.

- [ ] **Step 3: Production build doğrulaması**

```bash
pnpm build
```

Expected: Build başarılı, bundle size rapor edilmeli. Ana sayfa "First Load JS" ≤ 250 KB olmalı (3D zip'lemeden sonra). Aşarsa:
- drei kullanmadığımızı teyit et
- `@react-three/fiber`'ın sadece Canvas'tan import edildiğini teyit et
- Shader string'lerinin minify edilmesini bekle

- [ ] **Step 4: Dev server'da manuel smoke**

Her 4 dilde anasayfa + referanslar sayfası + rastgele bir sektör sayfası açılsın, görsel kontrol:
- TR: Latin karakterler doğru
- EN: Latin
- RU: Kiril harfler Inter'de doğru render
- AR: RTL layout, nav sağa hizalı, text Arabic font'ta
- Mobile (375×812 viewport): Hero, strip ve kartlar responsive

```bash
# Desktop check
curl -s http://localhost:3000/tr | grep -o 'dir="ltr"'
curl -s http://localhost:3000/ar | grep -o 'dir="rtl"'
```

- [ ] **Step 5: Git log özet**

```bash
git log --oneline origin/main..HEAD | wc -l
```

Expected: ~30+ commit (task başına 1-2 commit).

- [ ] **Step 6: Plan dökümanına "Tamamlandı" notu**

Bu plan dosyasının en üstündeki başlık altına:

```markdown
> **Status:** ✅ Completed YYYY-MM-DD (commit range `acd0cae..HEAD`)
```

- [ ] **Step 7: Final commit**

```bash
git add docs/superpowers/plans/2026-04-17-faz1-plan2-i18n-3d-pages.md
git commit -m "docs(plan): mark Plan 2 (i18n + 3D + references + public pages) complete"
git push origin main
```

- [ ] **Step 8: CI yeşilini bekle**

```bash
gh run watch
```

Expected: GitHub Actions build + lint + test + e2e yeşil.

- [ ] **Step 9: Memory + RESUME.md güncelle (orchestrator)**

Plan 2 bittikten sonra orchestrator:
1. `docs/superpowers/RESUME.md`'de "Plan 1 / Plan 2 tamamlandı, Plan 3 sıradaki (RFQ + Supabase tabloları + admin paneli)" olarak güncelle.
2. Memory: `project_kitaplastik.md`'de "Plan 2 ✅" ekle.

Bu adım plan execution scope'u dışında ama tamamlandığında kullanıcının bir sonraki session'ı düzgün başlatabilmesi için orchestrator tarafından yapılmalı.

---

## Plan Sonrası Durum

Plan 2 tamamlandığında:
- Site 4 dilli, kök `/` → `/tr` redirect eder
- Anasayfa above-the-fold'da atmosferik 3D hero + "Bizi seçen markalar" strip + SectorGrid
- 12 public route (4 dil × 12 = 48 statik sayfa)
- 8 mock müşteri referansı, Plan 3'te Supabase'e taşınacak şekilde interface sabitlenmiş
- Cilalı logo, RTL Arapça desteği, hreflang sitemap
- E2E + unit test kapsamı 30+ suite
- Plan 3 hazırlığı: RFQ formları + Supabase tabloları + admin paneli

**Plan 3'te ele alınacaklar (bu plan kapsamı DEĞİL):**
- RFQ formları (custom + standart) + Supabase `rfqs` tablosu + dosya upload
- Admin paneli (inbox, status update, ayarlar)
- Supabase Auth (magic link)
- Resend bildirim e-postaları
- Cloudflare Turnstile spam koruma
- `lib/references/data.ts` mock → Supabase `clients` tablosu migration

