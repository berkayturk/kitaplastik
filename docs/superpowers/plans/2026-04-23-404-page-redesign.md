# 404 Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain `/[locale]/not-found.tsx` with a refined-industrial recovery page (blueprint SVG + 4 localized recovery cards + Sentry 404 breadcrumb), and simplify `app/not-found.tsx` into a minimal 4-language root fallback.

**Architecture:** Server Component orchestrator under `app/[locale]/not-found.tsx` composes three dumb components (`NotFoundHero`, `BlueprintIllustration`, `RecoveryCards`) plus one `"use client"` island (`NotFoundClientSignals`) that handles the pathname-dependent bits (URL echo + Sentry `addBreadcrumb`). i18n via `messages/{tr,en,ru,ar}/common.json`. No animation, no search.

**Tech Stack:** Next.js 15 (app router), next-intl v3.26, TypeScript, Tailwind v4, Vitest + Testing Library (unit), Playwright (E2E), `@sentry/nextjs` v10.

**Spec reference:** `docs/superpowers/plans/../specs/2026-04-23-404-page-redesign-design.md`

---

## File Structure

**New:**
```
components/not-found/BlueprintIllustration.tsx   Pure SVG, no state, aria-hidden
components/not-found/NotFoundClientSignals.tsx   "use client" — usePathname + Sentry
components/not-found/RecoveryCards.tsx           4 localized Link cards (server)
components/not-found/NotFoundHero.tsx            Hero composition (server)
lib/sentry/not-found.ts                          sendNotFoundBreadcrumb helper
tests/unit/components/not-found/BlueprintIllustration.test.tsx
tests/unit/components/not-found/NotFoundClientSignals.test.tsx
tests/unit/components/not-found/RecoveryCards.test.tsx
tests/unit/lib/sentry/not-found.test.ts
```

**Modify:**
```
app/[locale]/not-found.tsx           Rewrite as orchestrator + generateMetadata
app/not-found.tsx                    Simplify to 4-lang minimal fallback (kept short)
messages/tr/common.json              Expand notFound block
messages/en/common.json              Expand notFound block
messages/ru/common.json              Expand notFound block
messages/ar/common.json              Expand notFound block
tests/e2e/not-found.spec.ts          Replace with 4-locale matrix + root fallback test
```

**Rationale — split by responsibility:**
- `BlueprintIllustration` is pure visual (testable in isolation, zero deps).
- `NotFoundClientSignals` isolates the only dynamic/client-side behavior (pathname + telemetry) to one small island — rest stays server-rendered.
- `RecoveryCards` encapsulates the 4-link recovery UX as a single testable unit.
- `NotFoundHero` composes the title block; no logic, only layout — small enough to stay inline but extracted for test isolation and future reuse.
- `lib/sentry/not-found.ts` isolates the telemetry API surface so tests can mock it without touching `@sentry/nextjs` directly.

---

## Task 1: Expand i18n `notFound` keys in all 4 locales

**Files:**
- Modify: `messages/tr/common.json`
- Modify: `messages/en/common.json`
- Modify: `messages/ru/common.json`
- Modify: `messages/ar/common.json`

This task has no automated test — i18n JSON completeness is enforced at build time by next-intl. The payoff is that every later component can safely `useTranslations("common.notFound")`.

The `home` key that existed in the old block is dropped — nothing uses it after Task 7 rewrites the only caller (`app/[locale]/not-found.tsx:12`). No backward-compat shim.

- [ ] **Step 1: Replace the `notFound` block in `messages/tr/common.json`**

Replace the existing `"notFound": { title, description, home }` block with:
```json
  "notFound": {
    "eyebrow": "HATA · 404",
    "title": "Sayfa bulunamadı",
    "description": "Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.",
    "urlEchoLabel": "Aradığınız:",
    "recoveryTitle": "BELKİ BUNLAR?",
    "cards": {
      "products": { "title": "Ürünler", "desc": "Tüm ürün ailesini inceleyin" },
      "sectors": { "title": "Sektörler", "desc": "Cam yıkama · kapak · tekstil" },
      "catalog": { "title": "Katalog iste", "desc": "PDF katalog talep formu" },
      "contact": { "title": "İletişim", "desc": "Bize ulaşın" }
    }
  },
```

- [ ] **Step 2: Replace the `notFound` block in `messages/en/common.json`**

Replace with:
```json
  "notFound": {
    "eyebrow": "ERROR · 404",
    "title": "Page not found",
    "description": "The page you are looking for has moved, been removed, or never existed.",
    "urlEchoLabel": "You requested:",
    "recoveryTitle": "MAYBE THESE?",
    "cards": {
      "products": { "title": "Products", "desc": "Browse the full product family" },
      "sectors": { "title": "Sectors", "desc": "Bottle washing · caps · textile" },
      "catalog": { "title": "Request catalog", "desc": "PDF catalog request form" },
      "contact": { "title": "Contact", "desc": "Get in touch" }
    }
  },
```

- [ ] **Step 3: Replace the `notFound` block in `messages/ru/common.json`**

Replace with:
```json
  "notFound": {
    "eyebrow": "ОШИБКА · 404",
    "title": "Страница не найдена",
    "description": "Запрашиваемая страница перемещена, удалена или никогда не существовала.",
    "urlEchoLabel": "Вы искали:",
    "recoveryTitle": "МОЖЕТ БЫТЬ, ЭТО?",
    "cards": {
      "products": { "title": "Продукция", "desc": "Весь ассортимент продукции" },
      "sectors": { "title": "Отрасли", "desc": "Мойка бутылок · крышки · текстиль" },
      "catalog": { "title": "Запросить каталог", "desc": "Форма запроса PDF-каталога" },
      "contact": { "title": "Контакты", "desc": "Связаться с нами" }
    }
  },
```

- [ ] **Step 4: Replace the `notFound` block in `messages/ar/common.json`**

Replace with:
```json
  "notFound": {
    "eyebrow": "خطأ · 404",
    "title": "الصفحة غير موجودة",
    "description": "الصفحة التي تبحث عنها تم نقلها أو حذفها أو لم تكن موجودة أبداً.",
    "urlEchoLabel": "طلبت:",
    "recoveryTitle": "ربما هذه؟",
    "cards": {
      "products": { "title": "المنتجات", "desc": "تصفح عائلة المنتجات بالكامل" },
      "sectors": { "title": "القطاعات", "desc": "غسيل الزجاجات · الأغطية · المنسوجات" },
      "catalog": { "title": "طلب الكتالوج", "desc": "نموذج طلب كتالوج PDF" },
      "contact": { "title": "اتصل بنا", "desc": "تواصل معنا" }
    }
  },
```

- [ ] **Step 5: Verify JSON parses**

Run: `node -e "['tr','en','ru','ar'].forEach(l=>require('./messages/'+l+'/common.json'))"`
Expected: no output (silent success). If `SyntaxError`, fix the JSON.

- [ ] **Step 6: Commit**

```bash
git add messages/tr/common.json messages/en/common.json messages/ru/common.json messages/ar/common.json
git commit -m "feat(i18n): expand notFound keys for redesigned 404 page (4 locales)"
```

---

## Task 2: Sentry breadcrumb helper

**Files:**
- Create: `lib/sentry/not-found.ts`
- Create: `tests/unit/lib/sentry/not-found.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/sentry/not-found.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const addBreadcrumb = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: (...args: unknown[]) => addBreadcrumb(...args),
}));

import { sendNotFoundBreadcrumb } from "@/lib/sentry/not-found";

describe("sendNotFoundBreadcrumb", () => {
  beforeEach(() => {
    addBreadcrumb.mockReset();
  });

  it("sends a warning-level breadcrumb with the pathname and referrer", () => {
    sendNotFoundBreadcrumb("/tr/urunler/eski-slug", "https://google.com/");

    expect(addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: "navigation.404",
      level: "warning",
      message: "404: /tr/urunler/eski-slug",
      data: { referrer: "https://google.com/" },
    });
  });

  it("passes a null referrer through verbatim", () => {
    sendNotFoundBreadcrumb("/ar/foo", null);

    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: "navigation.404",
      level: "warning",
      message: "404: /ar/foo",
      data: { referrer: null },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/lib/sentry/not-found.test.ts`
Expected: FAIL with `Cannot find module '@/lib/sentry/not-found'` (or similar resolution error).

- [ ] **Step 3: Write minimal implementation**

Create `lib/sentry/not-found.ts`:

```ts
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

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/lib/sentry/not-found.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/sentry/not-found.ts tests/unit/lib/sentry/not-found.test.ts
git commit -m "feat(sentry): add sendNotFoundBreadcrumb helper for 404 telemetry"
```

---

## Task 3: BlueprintIllustration SVG component

**Files:**
- Create: `components/not-found/BlueprintIllustration.tsx`
- Create: `tests/unit/components/not-found/BlueprintIllustration.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/components/not-found/BlueprintIllustration.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BlueprintIllustration } from "@/components/not-found/BlueprintIllustration";

describe("<BlueprintIllustration />", () => {
  it("renders a decorative svg marked aria-hidden", () => {
    const { container } = render(<BlueprintIllustration />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("role", "presentation");
    expect(svg).toHaveAttribute("viewBox", "0 0 240 240");
  });

  it("draws a 12x12 dot grid (144 dots)", () => {
    const { container } = render(<BlueprintIllustration />);
    const gridDots = container.querySelectorAll("svg [data-layer='grid'] circle");
    expect(gridDots).toHaveLength(144);
  });

  it("draws the cobalt arc, cobalt vertical segment, and one jade accent dot", () => {
    const { container } = render(<BlueprintIllustration />);
    expect(container.querySelector("[data-shape='arc']")).not.toBeNull();
    expect(container.querySelector("[data-shape='segment']")).not.toBeNull();
    const accent = container.querySelector("[data-shape='accent']");
    expect(accent).not.toBeNull();
    expect(accent).toHaveAttribute("fill", "#0FA37F");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/not-found/BlueprintIllustration.test.tsx`
Expected: FAIL with `Cannot find module '@/components/not-found/BlueprintIllustration'`.

- [ ] **Step 3: Write minimal implementation**

Create `components/not-found/BlueprintIllustration.tsx`:

```tsx
const GRID_STEP = 20;
const GRID_PADDING = 10;
const GRID_COUNT = 12;

function gridDots(): { cx: number; cy: number }[] {
  const dots: { cx: number; cy: number }[] = [];
  for (let row = 0; row < GRID_COUNT; row++) {
    for (let col = 0; col < GRID_COUNT; col++) {
      dots.push({
        cx: GRID_PADDING + col * GRID_STEP,
        cy: GRID_PADDING + row * GRID_STEP,
      });
    }
  }
  return dots;
}

export function BlueprintIllustration() {
  return (
    <svg
      viewBox="0 0 240 240"
      width="240"
      height="240"
      aria-hidden="true"
      role="presentation"
      className="w-full max-w-[240px]"
    >
      <g data-layer="grid" opacity="0.6">
        {gridDots().map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r="1" fill="#e7e5e0" />
        ))}
      </g>
      <path
        data-shape="arc"
        d="M 60 120 A 60 60 0 0 1 180 120"
        stroke="#1E4DD8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        data-shape="segment"
        d="M 120 60 L 120 180"
        stroke="#1E4DD8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle data-shape="accent" cx="180" cy="120" r="5" fill="#0FA37F" />
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/not-found/BlueprintIllustration.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/not-found/BlueprintIllustration.tsx tests/unit/components/not-found/BlueprintIllustration.test.tsx
git commit -m "feat(404): add BlueprintIllustration SVG (dot grid + cobalt arc + jade accent)"
```

---

## Task 4: NotFoundClientSignals client component

**Files:**
- Create: `components/not-found/NotFoundClientSignals.tsx`
- Create: `tests/unit/components/not-found/NotFoundClientSignals.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/components/not-found/NotFoundClientSignals.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const sendNotFoundBreadcrumb = vi.fn();
const usePathname = vi.fn();

vi.mock("@/lib/sentry/not-found", () => ({
  sendNotFoundBreadcrumb: (...args: unknown[]) => sendNotFoundBreadcrumb(...args),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

import { NotFoundClientSignals } from "@/components/not-found/NotFoundClientSignals";

describe("<NotFoundClientSignals />", () => {
  beforeEach(() => {
    sendNotFoundBreadcrumb.mockReset();
    usePathname.mockReset();
  });

  it("renders the URL echo with label + pathname when pathname present", () => {
    usePathname.mockReturnValue("/tr/urunler/eski");
    render(<NotFoundClientSignals label="Aradığınız:" />);
    expect(screen.getByText("Aradığınız:")).toBeInTheDocument();
    expect(screen.getByText("/tr/urunler/eski")).toBeInTheDocument();
  });

  it("truncates pathnames longer than 250 chars and appends an ellipsis", () => {
    const longPath = "/tr/" + "a".repeat(300);
    usePathname.mockReturnValue(longPath);
    render(<NotFoundClientSignals label="Aradığınız:" />);
    const rendered = screen.getByText(/a{5,}…$/);
    expect(rendered.textContent!.length).toBe(251); // 250 chars + "…"
  });

  it("fires sendNotFoundBreadcrumb exactly once on mount with pathname + referrer", () => {
    usePathname.mockReturnValue("/ar/foo-bar");
    Object.defineProperty(document, "referrer", { value: "https://src.example/", configurable: true });
    render(<NotFoundClientSignals label="X" />);
    expect(sendNotFoundBreadcrumb).toHaveBeenCalledTimes(1);
    expect(sendNotFoundBreadcrumb).toHaveBeenCalledWith("/ar/foo-bar", "https://src.example/");
  });

  it("renders nothing and does not call breadcrumb when pathname is null", () => {
    usePathname.mockReturnValue(null);
    const { container } = render(<NotFoundClientSignals label="X" />);
    expect(container).toBeEmptyDOMElement();
    expect(sendNotFoundBreadcrumb).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/not-found/NotFoundClientSignals.test.tsx`
Expected: FAIL with module resolution error.

- [ ] **Step 3: Write minimal implementation**

Create `components/not-found/NotFoundClientSignals.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendNotFoundBreadcrumb } from "@/lib/sentry/not-found";

const MAX_ECHO_LEN = 250;

interface Props {
  label: string;
}

export function NotFoundClientSignals({ label }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const referrer =
      typeof document !== "undefined" ? document.referrer || null : null;
    sendNotFoundBreadcrumb(pathname, referrer);
  }, [pathname]);

  if (!pathname) return null;

  const display =
    pathname.length > MAX_ECHO_LEN
      ? `${pathname.slice(0, MAX_ECHO_LEN)}…`
      : pathname;

  return (
    <p className="text-text-tertiary mt-6 font-mono text-sm">
      {label} <span className="break-all">{display}</span>
    </p>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/not-found/NotFoundClientSignals.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/not-found/NotFoundClientSignals.tsx tests/unit/components/not-found/NotFoundClientSignals.test.tsx
git commit -m "feat(404): add NotFoundClientSignals (URL echo + Sentry breadcrumb)"
```

---

## Task 5: RecoveryCards server component

**Files:**
- Create: `components/not-found/RecoveryCards.tsx`
- Create: `tests/unit/components/not-found/RecoveryCards.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/components/not-found/RecoveryCards.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { RecoveryCards } from "@/components/not-found/RecoveryCards";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    locale,
    children,
    ...rest
  }: ComponentProps<"a"> & { href: string; locale?: string }) => (
    <a href={locale ? `/${locale}${href}` : href} {...rest}>
      {children}
    </a>
  ),
}));

const messages = {
  common: {
    notFound: {
      recoveryTitle: "BELKİ BUNLAR?",
      cards: {
        products: { title: "Ürünler", desc: "Tüm ürün ailesini inceleyin" },
        sectors: { title: "Sektörler", desc: "Cam yıkama · kapak · tekstil" },
        catalog: { title: "Katalog iste", desc: "PDF katalog talep formu" },
        contact: { title: "İletişim", desc: "Bize ulaşın" },
      },
    },
  },
};

function renderCards() {
  return render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <RecoveryCards />
    </NextIntlClientProvider>,
  );
}

describe("<RecoveryCards />", () => {
  it("renders exactly 4 recovery links", () => {
    renderCards();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("wires each card href to the correct internal route", () => {
    renderCards();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/products", "/sectors", "/request-quote", "/contact"]);
  });

  it("renders translated titles and descriptions for the tr locale", () => {
    renderCards();
    expect(screen.getByText("Ürünler")).toBeInTheDocument();
    expect(screen.getByText("Sektörler")).toBeInTheDocument();
    expect(screen.getByText("Katalog iste")).toBeInTheDocument();
    expect(screen.getByText("İletişim")).toBeInTheDocument();
    expect(screen.getByText("PDF katalog talep formu")).toBeInTheDocument();
  });

  it("labels the nav region with the translated recovery title", () => {
    renderCards();
    const nav = screen.getByRole("navigation", { name: /belki bunlar/i });
    expect(nav).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/not-found/RecoveryCards.test.tsx`
Expected: FAIL with module resolution error.

- [ ] **Step 3: Write minimal implementation**

Create `components/not-found/RecoveryCards.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type CardSlug = "products" | "sectors" | "catalog" | "contact";

const CARD_HREFS: Record<CardSlug, string> = {
  products: "/products",
  sectors: "/sectors",
  catalog: "/request-quote",
  contact: "/contact",
};

const ORDER: CardSlug[] = ["products", "sectors", "catalog", "contact"];

export function RecoveryCards() {
  const t = useTranslations("common.notFound");

  return (
    <nav aria-labelledby="nf-recovery-title" className="mt-16">
      <p id="nf-recovery-title" className="eyebrow">
        {t("recoveryTitle")}
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ORDER.map((slug) => (
          <li key={slug}>
            <Link
              href={CARD_HREFS[slug]}
              className="group focus-visible:ring-accent-cobalt/40 block h-full rounded-sm border border-[var(--color-border-hairline)] bg-[var(--color-bg-elevated)] p-5 transition-colors hover:border-[var(--color-accent-cobalt)] hover:bg-[var(--color-accent-cobalt-tint)] focus-visible:ring-2 focus-visible:outline-none md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-medium text-[var(--color-text-primary)]">
                    {t(`cards.${slug}.title`)}
                  </div>
                  <p className="text-text-secondary mt-1 text-sm">
                    {t(`cards.${slug}.desc`)}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="text-[var(--color-accent-cobalt)] transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                >
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/not-found/RecoveryCards.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/not-found/RecoveryCards.tsx tests/unit/components/not-found/RecoveryCards.test.tsx
git commit -m "feat(404): add RecoveryCards (4 localized navigation recovery links)"
```

---

## Task 6: NotFoundHero composition

**Files:**
- Create: `components/not-found/NotFoundHero.tsx`

No dedicated unit test here — the hero is a thin composition of already-tested units + translated strings. Its behavior is fully covered by the E2E suite in Task 9 (title visible, eyebrow visible, illustration visible, URL echo visible). Adding another unit test would duplicate coverage.

- [ ] **Step 1: Write the component**

Create `components/not-found/NotFoundHero.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { BlueprintIllustration } from "./BlueprintIllustration";
import { NotFoundClientSignals } from "./NotFoundClientSignals";

export function NotFoundHero() {
  const t = useTranslations("common.notFound");

  return (
    <section className="border-b border-[var(--color-border-hairline)]">
      <Container>
        <div className="grid items-center gap-10 py-20 lg:grid-cols-12 lg:gap-8 lg:py-28">
          <div className="lg:col-span-8">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="font-display mt-6 text-[44px] leading-[1.02] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] md:text-[56px] lg:text-[64px]">
              {t("title")}
            </h1>
            <p className="text-text-secondary mt-6 max-w-xl text-lg">
              {t("description")}
            </p>
            <NotFoundClientSignals label={t("urlEchoLabel")} />
          </div>
          <div className="flex justify-center lg:col-span-4 lg:justify-end">
            <BlueprintIllustration />
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck to verify no type errors**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Run the full unit suite to verify nothing regressed**

Run: `pnpm test`
Expected: all tests pass (existing suite + the 13 new ones from Tasks 2-5).

- [ ] **Step 4: Commit**

```bash
git add components/not-found/NotFoundHero.tsx
git commit -m "feat(404): add NotFoundHero composition (eyebrow + title + description + illustration)"
```

---

## Task 7: Rewrite `app/[locale]/not-found.tsx` page + metadata

**Files:**
- Modify: `app/[locale]/not-found.tsx` (full rewrite)

- [ ] **Step 1: Replace the file contents**

Overwrite `app/[locale]/not-found.tsx` with:

```tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotFoundHero } from "@/components/not-found/NotFoundHero";
import { RecoveryCards } from "@/components/not-found/RecoveryCards";
import { Container } from "@/components/layout/Container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.notFound");
  return {
    title: `${t("title")} — Kıta Plastik`,
    robots: { index: false, follow: true },
  };
}

export default function NotFound() {
  return (
    <>
      <NotFoundHero />
      <Container>
        <div className="pb-24">
          <RecoveryCards />
        </div>
      </Container>
    </>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Run the dev server and smoke-check one locale manually**

Run: `pnpm dev --port 3002` (background).
Open: `http://localhost:3002/tr/kesinlikle-yok-boyle-sayfa`
Expected: Big "Sayfa bulunamadı" title, blueprint SVG on the right, URL echo `/tr/kesinlikle-yok-boyle-sayfa`, 4 recovery cards visible.
Stop the dev server afterwards.

(This is a sanity check — the canonical verification comes in Task 9's E2E.)

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/not-found.tsx
git commit -m "feat(404): rewrite [locale]/not-found.tsx as blueprint hero + recovery shell"
```

---

## Task 8: Simplify `app/not-found.tsx` root fallback

**Files:**
- Modify: `app/not-found.tsx` (full rewrite)

The root fallback covers the case where a request arrives without any valid locale prefix and the middleware declines to redirect. It must stand alone without i18n or illustration, because the locale is unknown.

- [ ] **Step 1: Replace the file contents**

Overwrite `app/not-found.tsx` with:

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "404 — Kıta Plastik",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container>
      <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="eyebrow text-[var(--color-accent-cobalt)]">ERROR · 404</p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
          Sayfa bulunamadı <span className="text-[var(--color-text-tertiary)]">·</span> Page not
          found <span className="text-[var(--color-text-tertiary)]">·</span> Страница не найдена{" "}
          <span className="text-[var(--color-text-tertiary)]">·</span> الصفحة غير موجودة
        </h1>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-sm bg-[var(--color-accent-cobalt)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Anasayfa · Home · Главная · الرئيسية
        </Link>
      </section>
    </Container>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat(404): simplify root not-found.tsx as minimal 4-language fallback"
```

---

## Task 9: Update E2E tests — 4-locale matrix + root fallback

**Files:**
- Modify: `tests/e2e/not-found.spec.ts` (full rewrite)

- [ ] **Step 1: Replace the test file with the full matrix**

Overwrite `tests/e2e/not-found.spec.ts` with:

```ts
import { test, expect } from "@playwright/test";

type LocaleCase = {
  locale: "tr" | "en" | "ru" | "ar";
  titleMatch: RegExp;
  eyebrowMatch: RegExp;
  recoveryMatch: RegExp;
  productsLocalizedHref: string;
};

const LOCALES: LocaleCase[] = [
  {
    locale: "tr",
    titleMatch: /sayfa bulunamadı/i,
    eyebrowMatch: /hata · 404/i,
    recoveryMatch: /belki bunlar/i,
    productsLocalizedHref: "/tr/urunler",
  },
  {
    locale: "en",
    titleMatch: /page not found/i,
    eyebrowMatch: /error · 404/i,
    recoveryMatch: /maybe these/i,
    productsLocalizedHref: "/en/products",
  },
  {
    locale: "ru",
    titleMatch: /страница не найдена/i,
    eyebrowMatch: /ошибка · 404/i,
    recoveryMatch: /может быть/i,
    productsLocalizedHref: "/ru/produktsiya",
  },
  {
    locale: "ar",
    titleMatch: /الصفحة غير موجودة/,
    eyebrowMatch: /404/,
    recoveryMatch: /ربما هذه/,
    productsLocalizedHref: "/ar/al-muntajat",
  },
];

for (const c of LOCALES) {
  test(`404 page — ${c.locale} renders blueprint hero + recovery cards + returns 404`, async ({
    page,
  }) => {
    const response = await page.goto(`/${c.locale}/definitely-not-a-real-page`);
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { level: 1, name: c.titleMatch })).toBeVisible();
    await expect(page.getByText(c.eyebrowMatch).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: c.recoveryMatch })).toBeVisible();

    const recoveryNav = page.getByRole("navigation", { name: c.recoveryMatch });
    await expect(recoveryNav.getByRole("link")).toHaveCount(4);

    const productsLink = recoveryNav.getByRole("link").first();
    await expect(productsLink).toHaveAttribute("href", c.productsLocalizedHref);

    const echo = page.getByText(`/${c.locale}/definitely-not-a-real-page`);
    await expect(echo).toBeVisible();

    if (c.locale === "ar") {
      const html = page.locator("html");
      await expect(html).toHaveAttribute("dir", "rtl");
    }
  });
}

test("root 404 (no locale prefix) renders the minimal 4-language fallback", async ({ page }) => {
  const response = await page.goto("/totally-invalid-no-locale-prefix");
  expect(response?.status()).toBe(404);

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText(/sayfa bulunamadı/i);
  await expect(heading).toContainText(/page not found/i);

  const cta = page.getByRole("link", { name: /anasayfa.*home.*главная/i });
  await expect(cta).toHaveAttribute("href", "/");
});
```

- [ ] **Step 2: Run the E2E suite (not-found spec only) to verify it passes**

Run: `pnpm exec playwright test tests/e2e/not-found.spec.ts`
Expected: 5 tests pass (4 locales + root fallback).

If the root fallback test fails because the middleware redirects instead of rendering root `not-found.tsx` (possible with next-intl `localePrefix: "always"`), update the root test to assert the middleware's actual behavior (redirect to `/tr/...` then 404) — document the observed behavior in a comment above the test, and adjust assertions accordingly. Do not skip the test.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/not-found.spec.ts
git commit -m "test(404): expand E2E to 4-locale matrix + root fallback coverage"
```

---

## Task 10: Full CI-mirror verification

**Files:**
- No changes expected. If `pnpm verify` surfaces anything, fix-forward only.

This task enforces the project's "pnpm verify before push" rule (memory feedback `feedback_verify_before_push.md`): full typecheck + lint + format + unit + audit + build + E2E. Any failure must be fixed before calling the feature done.

- [ ] **Step 1: Run the full verification pipeline**

Run: `pnpm verify`
Expected: all stages green (typecheck, lint, format:check, test, audit, build, test:e2e).

- [ ] **Step 2: If any stage fails, fix the root cause and re-run**

Common expected issues and their fix:
- **Prettier failure on new files** — run `pnpm format` and commit the formatting fix as `chore(404): apply prettier formatting to new files`.
- **ESLint warnings** — fix inline; do not disable rules.
- **Build failure** from an untranslated key somewhere — confirm all 4 `messages/*/common.json` files parse and contain the same key shape as in Task 1; add any missing keys.
- **E2E flake on AR RTL assertion** — verify `<html dir="rtl">` comes from the existing layout; if not, this is a pre-existing gap outside this plan's scope — file a follow-up note in memory and mark the AR-specific assertion as `test.skip` **only** if you also open a tracking todo in a separate commit.

- [ ] **Step 3: Final commit (only if fixes were needed)**

```bash
git add -A
git commit -m "chore(404): apply verification fixes from pnpm verify"
```

- [ ] **Step 4: Leave branch ready for push**

No push happens in this plan — the user pushes manually after reviewing the local commit log. The feature is "done" when `pnpm verify` is green on the local branch.

---

## Post-implementation checklist (verify against spec acceptance criteria)

After Task 10 is green, sanity-check each spec AC (§10):

1. Visual: all 4 locales render the redesigned hero + cards → covered by E2E in Task 9.
2. i18n: 36 new keys across 4 locales present → covered by Task 1 + parse check.
3. Telemetry: Sentry `addBreadcrumb` is wired → covered by unit test Task 2 + Task 4.
4. HTTP 404 status → covered by E2E in Task 9.
5. Unit coverage ≥80% on new components → covered by Tasks 2-5 tests.
6. Root fallback documented behavior → covered by E2E root fallback test in Task 9.

Any AC item that cannot be checked off is a plan gap — do not ship.
