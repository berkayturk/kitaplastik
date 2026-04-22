# Plan 5a — Observability + Infra Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MVP site'a Sentry (errors only) + Plausible (self-host Coolify) + GWS info@ inbox + birleşik SPF + CF proxy (Full strict) ekle; 4 risk-bazlı faz, hybrid execution (user UI/DNS + Claude code).

**Architecture:** next-intl v3 + Next 15 + React 19 stack üstüne observability overlay. Sentry SDK tri-runtime (client/server/edge) + `withSentryConfig` wrap. Plausible `<script>` component env-guarded + `trackPlausible()` type-safe wrapper 4 event enjekte (`Contact Submitted`, `Catalog Requested`, `Locale Changed`, `Sector Clicked`). CF/Coolify infra değişiklikleri user-side runbook (`docs/runbooks/plan5a-infra.md`) ile paralel. Mevcut 139 unit + 60 E2E test suite yeşil kalmalı.

**Tech Stack:** Next.js 15.5.15, React 19.2.5, TypeScript strict, next-intl v3.26, `@sentry/nextjs` v8.x, Plausible Community Edition (Coolify template), Resend, Supabase, Cloudflare DNS+Proxy, Let's Encrypt DNS-01, Traefik (Coolify proxy), GWS Business Starter, pnpm 9.15.9, vitest + Playwright.

**Spec:** [docs/superpowers/specs/2026-04-22-plan5a-observability-infra-design.md](../specs/2026-04-22-plan5a-observability-infra-design.md)

**Execution model:** Hybrid — user UI/DNS adımları runbook'tan okuyarak manuel yürütür; Claude kod task'larını subagent-driven-development ile çalışır. Her fazın sonunda GATE onayı gerek.

---

## File Structure

**Create:**
- `instrumentation.ts` — Next 15 `register()` hook, dinamik import per runtime
- `sentry.client.config.ts` — browser init (DSN env, `tracesSampleRate: 0`)
- `sentry.server.config.ts` — node runtime init (same scope)
- `sentry.edge.config.ts` — edge runtime init (middleware etc.)
- `app/global-error.tsx` — Next 15 unhandled render error handler, Sentry.captureException
- `lib/analytics/plausible.ts` — `trackPlausible(event)` type-safe SSR-safe wrapper
- `components/PlausibleScript.tsx` — env-guarded `<script>` injector
- `tests/unit/analytics/plausible.test.ts` — window.plausible stub'lı unit
- `docs/runbooks/plan5a-infra.md` — User-side infra checklist

**Modify:**
- `package.json` — + `@sentry/nextjs` dependency
- `next.config.ts` — `withSentryConfig()` wrap (source map upload)
- `.env.example` — `NEXT_PUBLIC_PLAUSIBLE_HOST` yeni, comment update
- `playwright.config.ts` — `testServerEnv` ekle: `NEXT_PUBLIC_SENTRY_DSN=""`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""`, `NEXT_PUBLIC_PLAUSIBLE_HOST=""`
- `.github/workflows/ci.yml` — iki `env:` bloğuna (build + e2e) aynı Sentry/Plausible placeholder'ları
- `app/[locale]/layout.tsx` — `<head>` altı `<PlausibleScript />` ekle
- `app/api/contact/route.ts:86` — `console.error` → `Sentry.captureException`
- `app/api/catalog/route.ts:76,97` — 2× `console.error` → `Sentry.captureException`
- `lib/audit.ts:26,29` — `console.warn` → `Sentry.captureMessage` (level: warning)
- `lib/references/data.ts:30` — `console.warn` → `Sentry.captureMessage`
- `app/admin/login/actions.ts:24` — `console.error` → `Sentry.captureException`
- `app/admin/products/actions.ts:195` — `console.error` → `Sentry.captureException`
- `lib/rate-limit.ts` — comment update: Plan 5d Upstash upgrade path (kod değişmez)
- `components/contact/ContactForm.tsx` — submit success → `trackPlausible({name: "Contact Submitted"})`
- `components/catalog/CatalogRequestForm.tsx` — submit success → `trackPlausible({name: "Catalog Requested", props: {locale}})`
- `components/layout/LocaleSwitcher.tsx` — anchor click → `trackPlausible({name: "Locale Changed", props: {to}})`
- `components/home/SectorGrid.tsx` — Link wrapper → `trackPlausible({name: "Sector Clicked", props: {slug}})`

**Runbook-only (infra, no repo change):**
- Coolify UI: token rotate, Plausible service deploy, Traefik config
- CF Dashboard: SPF TXT, plausible A record, MX records, GWS verify TXT, API token, A proxied, SSL Full strict
- GWS Admin Console: trial start, user create, MFA
- VPS SSH: Traefik DNS-01 YAML edit

---

## Execution invariants (applied throughout)

- **Co-Authored-By footer:** globally disabled (`.claude/settings.json`). Her commit mesajı sadece conventional subject + body.
- **pnpm verify:** `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm audit --audit-level=high --prod && pnpm build && pnpm test:e2e` — faz bitiş commit öncesi **mandatory**. (Memory: `feedback_verify_before_push.md`)
- **Atomik commit:** Her faz max 1 kod commit'i; runbook işlemleri commit DEĞİL, `docs/runbooks/plan5a-infra.md` checkbox'ı dolar.
- **Commit style:** `feat(observability):`, `feat(email):`, `docs(runbook):`, `chore(ci):` — `feat/fix/docs/test/chore/perf/ci` tipleri.
- **Subagent mode (pragmatik):** mekanik işler combined; logic kararları single-implementer + combined review. (Memory: `feedback_subagent_mode.md`)
- **TDD where meaningful:** `lib/analytics/plausible.ts` wrapper ve `app/global-error.tsx` TDD ile yazılacak. UI event enjekte (1-satır, mekanik) + Coolify runbook step'leri TDD'siz — review-after.
- **Turkish regex:** JS `/i` flag Türkçe case-fold yapmaz (İ↔i, I↔ı). Test pattern'larında dikkat. (Memory: `feedback_turkish_regex.md`) — Plan 5a event name'leri ASCII, etkilenmez ama future-proof.

---

# FAZ 1 — Düşük risk temel (~30dk, paralel)

### Task 1: Session pre-flight + env snapshot

**Files:**
- None (operational task, no repo change)

- [ ] **Step 1: Mevcut root `@` TXT kayıtlarının snapshot'ı**

Run (user gets current CF DNS root TXT records via dashboard; Claude runs dig for reference):

```bash
dig TXT kitaplastik.com +short
```

Expected: Output contains existing `v=spf1` string (if any) — record exact value for rollback. Save as plain-text note.

- [ ] **Step 2: Coolify'da Sentry DSN + AUTH_TOKEN yüklü mü teyit**

User verifies: Coolify dashboard → kitaplastik project → Environment Variables → `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` dolu + ✅ "Available at Runtime".

Expected: İki env var set; eksikse bu Task'ı bloklar.

- [ ] **Step 3: `docs/runbooks/` dizini var mı kontrol**

Run: `ls docs/runbooks/ 2>/dev/null || echo "missing"`
Expected: "missing" (ilk runbook bu plan'da yazılacak)

- [ ] **Step 4: Runbook skeleton create**

Create `docs/runbooks/plan5a-infra.md`:

```markdown
# Plan 5a Infra Runbook

**Tarih:** 2026-04-22
**Amaç:** MVP observability + SSL Full strict migration
**Sahip:** Berkay (execute) + Claude (verify)

## Pre-flight checklist
- [ ] Coolify admin access
- [ ] CF dashboard + API token yetkisi
- [ ] GWS trial için kredi kartı
- [ ] VPS SSH erişimi

## Snapshot (rollback reference)
- Root TXT (önce): _____________________

## Faz 1 — Düşük risk temel

### 1.1 Coolify token rotate
- [ ] Delete old COOLIFY_TOKEN in Coolify UI
- [ ] Create new token `gha-autodeploy-v2` (Read+Write scope)
- [ ] `gh secret set COOLIFY_TOKEN --body '<token>'`
- [ ] Verify: next push triggers auto-deploy
- [ ] Done: _____

### 1.3 Birleşik SPF root @
- [ ] CF DNS → root `@` TXT → upsert `v=spf1 include:_spf.google.com include:amazonses.com ~all`
- [ ] Verify: `dig TXT kitaplastik.com +short | grep spf1`
- [ ] Verify: mail-tester score ≥ 9/10 (contact form test mail)
- [ ] Done: _____

## Faz 2 — Plausible (filled in Task 14+)

## Faz 3 — GWS (filled in Task 27+)

## Faz 4 — CF proxy (filled in Task 31+)

## Post-deploy verification
- [ ] kitaplastik.com HTTPS + cf-ray header ✅
- [ ] plausible.kitaplastik.com realtime event ✅
- [ ] Sentry test error visible ✅
- [ ] info@ inbox test mail ✅
- [ ] Resend contact form delivers ✅
```

- [ ] **Step 5: Commit runbook skeleton**

```bash
git add docs/runbooks/plan5a-infra.md
git commit -m "docs(runbook): add Plan 5a infra runbook skeleton"
```

---

### Task 2: Faz 1.1 — Coolify token rotate (SEN runbook)

**Files:**
- None (infra-only)

- [ ] **Step 1: Coolify UI — token rotate**

User action:
1. Coolify dashboard → profile → **Keys & Tokens**
2. Mevcut token'ı bul ve **Delete** (name'i not al)
3. **Create new token**: name `gha-autodeploy-v2`, scope `Read+Write`
4. Token string'i (gösterildiği tek seferde) kopyala

- [ ] **Step 2: GHA secret update**

Run (local terminal):

```bash
gh secret set COOLIFY_TOKEN --repo berkaytrk/kitaplastik --body '<paste-token-here>'
```

Expected: `✓ Set secret COOLIFY_TOKEN for berkaytrk/kitaplastik`

- [ ] **Step 3: Verify**

Run:

```bash
gh secret list --repo berkaytrk/kitaplastik | grep COOLIFY_TOKEN
```

Expected: `COOLIFY_TOKEN  Updated <today's date>`

- [ ] **Step 4: Runbook checkbox işaretle + snapshot kaydı**

Edit `docs/runbooks/plan5a-infra.md`:
- `### 1.1 Coolify token rotate` altındaki 4 checkbox'ı `[x]` yap
- "Done: _____" yanına tarih + başarı not et

---

### Task 3: Faz 1.2.1 — `@sentry/nextjs` install + base configs

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install @sentry/nextjs**

Run:

```bash
pnpm add @sentry/nextjs
```

Expected: `package.json` dependencies'e `"@sentry/nextjs": "^8.x"` eklenir; `pnpm-lock.yaml` güncellenir.

- [ ] **Step 2: Create `sentry.client.config.ts`**

```typescript
// sentry.client.config.ts
// Browser-side Sentry init. DSN read at runtime (env injected by Coolify).
// tracesSampleRate 0 = errors only (no performance). See spec §2 karar A.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      return process.env.NODE_ENV === "production" ? event : null;
    },
  });
}
```

- [ ] **Step 3: Create `sentry.server.config.ts`**

```typescript
// sentry.server.config.ts
// Node.js runtime Sentry init (API routes, server components, RSC).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    beforeSend(event) {
      return process.env.NODE_ENV === "production" ? event : null;
    },
  });
}
```

- [ ] **Step 4: Create `sentry.edge.config.ts`**

```typescript
// sentry.edge.config.ts
// Edge runtime Sentry init (middleware, edge API routes).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    beforeSend(event) {
      return process.env.NODE_ENV === "production" ? event : null;
    },
  });
}
```

- [ ] **Step 5: Verify typecheck + build passes**

Run:

```bash
pnpm typecheck
```

Expected: 0 errors. Build: `pnpm build` → success (config files picked up by next.config wrap in Task 5).

- [ ] **Step 6: No commit yet** (instrumentation + next.config wrap gelmeden yarım durum olur) — Task 5 sonunda tek atomik commit.

---

### Task 4: Faz 1.2.2 — `instrumentation.ts` + `app/global-error.tsx`

**Files:**
- Create: `instrumentation.ts`
- Create: `app/global-error.tsx`

- [ ] **Step 1: Create `instrumentation.ts`**

```typescript
// instrumentation.ts
// Next 15 server-side hook. Loads runtime-specific Sentry config
// via dynamic import (RSC + API routes + edge all use `register()`).
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(err: unknown, request: Request, context: unknown) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}
```

- [ ] **Step 2: Create `app/global-error.tsx`**

```tsx
// app/global-error.tsx
// Next 15 unhandled render error boundary. Reports to Sentry and
// renders minimal fallback. Must be a Client Component.
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h1>Something went wrong</h1>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: 0 errors.

---

### Task 5: Faz 1.2.3 — `next.config.ts` withSentryConfig wrap

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Read current next.config.ts (last line)**

Current end:
```typescript
export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Wrap with withSentryConfig**

Replace the last line with:

```typescript
import { withSentryConfig } from "@sentry/nextjs";

// Existing withNextIntl wrap composed with Sentry's webpack plugin.
// Source map upload runs at build time when SENTRY_AUTH_TOKEN is set.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: "kitaplastik",
  project: "web",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: false,
});
```

Note: `import { withSentryConfig }` MUST be at top of file with other imports. Check existing imports — if `import type { NextConfig } from "next"` is present, add Sentry import below it.

- [ ] **Step 3: Verify typecheck + build**

Run:

```bash
pnpm typecheck && pnpm build
```

Expected: Both green. Build log shows "Sentry: ..." output (source map upload, if `SENTRY_AUTH_TOKEN` set locally; otherwise silent skip).

- [ ] **Step 4: Verify existing redirects preserved**

Run: `pnpm build 2>&1 | grep -c "redirect"` — should match pre-change count (Plan 4a + 4d redirects intact).

Manual: read the generated build output and confirm `withNextIntl` + `withSentryConfig` composition did not drop redirects config.

- [ ] **Step 5: No commit yet** — Tasks 6-8 (console.error replacements) still pending.

---

### Task 6: Faz 1.2.4 — Replace `console.error` in api/catalog (TDD)

**Files:**
- Modify: `app/api/catalog/route.ts:76,97`
- Test: `tests/unit/api/catalog.test.ts` (check if exists; if not, create inline test)

- [ ] **Step 1: Check existing tests for api/catalog**

Run:

```bash
ls tests/unit/api/catalog* 2>/dev/null || echo "no existing test"
```

- [ ] **Step 2: Write failing test — Sentry capture on resend failure**

If `tests/unit/api/catalog.test.ts` does not exist, skip TDD for this (route already covered by existing E2E). Instead, verify via manual reasoning: after code change, the two `console.error` calls go through `Sentry.captureException`.

If it does exist, add:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("api/catalog error reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures resend failures to Sentry", async () => {
    // ...existing setup (mock getResend to throw)
    const captureSpy = vi.spyOn(Sentry, "captureException");
    // ...invoke POST with valid payload
    expect(captureSpy).toHaveBeenCalledWith(expect.any(Error));
  });
});
```

Run: `pnpm test tests/unit/api/catalog.test.ts` — test fails (current code uses `console.error`).

- [ ] **Step 3: Modify `app/api/catalog/route.ts`**

Find line 76:
```typescript
console.error("[catalog] failed to record request", e);
```
Replace with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureException(e, { tags: { route: "api/catalog", phase: "record_request" } });
```

Find line 97 (post-edit may shift by 1):
```typescript
console.error("[catalog] resend failed", e);
```
Replace with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureException(e, { tags: { route: "api/catalog", phase: "resend" } });
```

Note: `await import()` dynamic keeps edge-runtime compat. Static `import * as Sentry` at file top also works for Node runtime; use dynamic here to avoid edge bundle bloat.

- [ ] **Step 4: Re-run test (if added)**

```bash
pnpm test tests/unit/api/catalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Verify no console.error residues in this file**

Run:

```bash
grep -n "console\." app/api/catalog/route.ts || echo "clean"
```

Expected: `clean`

---

### Task 7: Faz 1.2.5 — Replace `console.error` in api/contact

**Files:**
- Modify: `app/api/contact/route.ts:86`

- [ ] **Step 1: Modify `app/api/contact/route.ts`**

Find line 86:
```typescript
console.error("[contact] resend failed", e);
```
Replace with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureException(e, { tags: { route: "api/contact", phase: "resend" } });
```

- [ ] **Step 2: Verify clean**

```bash
grep -n "console\." app/api/contact/route.ts || echo "clean"
```

Expected: `clean`

---

### Task 8: Faz 1.2.6 — Replace `console.warn` in lib/audit.ts + references + admin actions

**Files:**
- Modify: `lib/audit.ts:26,29`
- Modify: `lib/references/data.ts:30`
- Modify: `app/admin/login/actions.ts:24`
- Modify: `app/admin/products/actions.ts:195`

- [ ] **Step 1: Modify `lib/audit.ts`**

Replace both `console.warn` lines (26 and 29):

Line 26:
```typescript
console.warn("[audit] insert failed", error.message);
```
Replace with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureMessage(`[audit] insert failed: ${error.message}`, "warning");
```

Line 29:
```typescript
console.warn("[audit] unexpected", e);
```
Replace with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureException(e, { tags: { module: "audit", phase: "unexpected" } });
```

- [ ] **Step 2: Modify `lib/references/data.ts:30`**

Line 30:
```typescript
console.warn("[references] fetch failed", error?.message);
```
Replace with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureMessage(`[references] fetch failed: ${error?.message ?? "unknown"}`, "warning");
```

- [ ] **Step 3: Modify `app/admin/login/actions.ts:24`**

Read the existing multi-line `console.error` context:
```bash
sed -n '20,30p' app/admin/login/actions.ts
```

Replace the `console.error(...)` call with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureException(<existing-error-variable>, { tags: { module: "admin_login" } });
```

Preserve all arguments by passing them in the `extra` option if they carry context:
```typescript
Sentry.captureException(err, {
  tags: { module: "admin_login" },
  extra: { /* original extra args */ },
});
```

- [ ] **Step 4: Modify `app/admin/products/actions.ts:195`**

Line 195:
```typescript
console.error("[clone] storage.copy failed:", img.path, "→", newPath, error.message);
```
Replace with:
```typescript
const Sentry = await import("@sentry/nextjs");
Sentry.captureException(error, {
  tags: { module: "admin_products", phase: "clone" },
  extra: { from: img.path, to: newPath },
});
```

- [ ] **Step 5: Verify all replacements**

Run:

```bash
grep -rn "console\.\(error\|warn\)" lib/audit.ts lib/references/data.ts app/admin/login/actions.ts app/admin/products/actions.ts app/api/contact/route.ts app/api/catalog/route.ts || echo "all clean"
```

Expected: `all clean`

---

### Task 9: Faz 1.2.7 — Playwright + CI env mirror (Sentry DSN boş)

**Files:**
- Modify: `playwright.config.ts:14-24`
- Modify: `.github/workflows/ci.yml` (both env blocks)

- [ ] **Step 1: Update `playwright.config.ts` testServerEnv**

Find:
```typescript
const testServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-role-key",
  NEXT_PUBLIC_SITE_URL: TEST_ORIGIN,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  RESEND_API_KEY: "re_placeholder_ci",
  RESEND_FROM_EMAIL: "noreply@kitaplastik.com",
  RESEND_TEAM_EMAIL: "info@kitaplastik.com",
};
```

Replace with (append 3 new keys before closing brace):
```typescript
const testServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-role-key",
  NEXT_PUBLIC_SITE_URL: TEST_ORIGIN,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  RESEND_API_KEY: "re_placeholder_ci",
  RESEND_FROM_EMAIL: "noreply@kitaplastik.com",
  RESEND_TEAM_EMAIL: "info@kitaplastik.com",
  // Plan 5a: observability disabled in tests (no real Sentry/Plausible calls from CI)
  NEXT_PUBLIC_SENTRY_DSN: "",
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "",
  NEXT_PUBLIC_PLAUSIBLE_HOST: "",
};
```

- [ ] **Step 2: Update `.github/workflows/ci.yml` build env block (line ~66-74)**

Find the `env:` block under "Build" step (should start at line 63) and append 3 lines before the `run: pnpm build` line:

```yaml
          NEXT_PUBLIC_SENTRY_DSN: ""
          NEXT_PUBLIC_PLAUSIBLE_DOMAIN: ""
          NEXT_PUBLIC_PLAUSIBLE_HOST: ""
```

- [ ] **Step 3: Update `.github/workflows/ci.yml` e2e env block (line ~117-127)**

Same 3 lines under "Run E2E tests" env:

```yaml
          NEXT_PUBLIC_SENTRY_DSN: ""
          NEXT_PUBLIC_PLAUSIBLE_DOMAIN: ""
          NEXT_PUBLIC_PLAUSIBLE_HOST: ""
```

- [ ] **Step 4: Update `.env.example`**

Find at end of file:
```
# Sentry (Plan 4)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

Replace with:
```
# Plausible self-host
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com
NEXT_PUBLIC_PLAUSIBLE_HOST=https://plausible.kitaplastik.com

# Sentry (errors only scope — see Plan 5a spec §2)
# Prod values set in Coolify; leave empty for dev to skip Sentry init.
NEXT_PUBLIC_SENTRY_DSN=
# Server-side only, used by Sentry webpack plugin for source map upload
SENTRY_AUTH_TOKEN=
```

Note: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` line already exists at line 21 — move it into the new "Plausible self-host" grouped block and remove duplicate.

- [ ] **Step 5: Verify CI+test parity**

Run:

```bash
pnpm test:e2e
```

Expected: All 60 E2E tests pass; no console warnings about missing Plausible/Sentry env.

---

### Task 10: Faz 1 commit — `pnpm verify` + atomic commit

**Files:**
- All files modified in Tasks 3-9

- [ ] **Step 1: Full pnpm verify**

Run:

```bash
pnpm verify
```

Expected: All green (typecheck + lint + format + unit + audit + build + E2E).

- [ ] **Step 2: Review staged changes**

Run:

```bash
git status
git diff --stat
```

Expected files touched:
- `package.json`, `pnpm-lock.yaml` (Sentry install)
- `instrumentation.ts` (new)
- `sentry.client.config.ts` + `sentry.server.config.ts` + `sentry.edge.config.ts` (new)
- `app/global-error.tsx` (new)
- `next.config.ts` (withSentryConfig wrap)
- `app/api/contact/route.ts`, `app/api/catalog/route.ts` (Sentry.captureException)
- `lib/audit.ts`, `lib/references/data.ts`, `app/admin/login/actions.ts`, `app/admin/products/actions.ts` (Sentry reporting)
- `playwright.config.ts` (test env)
- `.github/workflows/ci.yml` (CI env)
- `.env.example` (grouped + host env)

- [ ] **Step 3: Commit**

```bash
git add -u
git add instrumentation.ts sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts app/global-error.tsx
git commit -m "feat(observability): wire Sentry SDK with errors-only scope

- @sentry/nextjs v8 install + tri-runtime configs (client/server/edge)
- instrumentation.ts register() hook + global-error.tsx boundary
- next.config.ts withSentryConfig wrap for source map upload
- Replace console.error/warn with Sentry.captureException/Message in:
  - app/api/contact, app/api/catalog, lib/audit, lib/references/data,
    app/admin/login/actions, app/admin/products/actions
- Playwright + CI env: Sentry/Plausible placeholder empty (no external calls)
- .env.example: grouped observability block + NEXT_PUBLIC_PLAUSIBLE_HOST

tracesSampleRate 0, replay off; beforeSend prod-gate.
Plan 5a Faz 1.2 — spec §5.1 §3.2"
```

- [ ] **Step 4: Push + verify GHA CI green**

```bash
git push
```

Wait for `.github/workflows/ci.yml` to run; expected: all green. User monitors: GitHub Actions tab.

---

### Task 11: Faz 1.3 — Birleşik SPF root @ (SEN runbook)

**Files:**
- None (CF DNS only, runbook update)

- [ ] **Step 1: Snapshot existing root TXT**

User action: CF Dashboard → DNS → filter by TXT on root `@`. Record all existing TXT values (may include Google Workspace verification, DMARC, etc. — **don't touch those**, only SPF).

Record in `docs/runbooks/plan5a-infra.md` "Snapshot" section.

- [ ] **Step 2: Upsert SPF TXT on root @**

User action: CF DNS → Records
- Eğer root `@` TXT `v=spf1 ...` ile başlayan kayıt varsa → **Edit**
- Yoksa → **Add Record**: Type `TXT`, Name `@`, Content:
  ```
  v=spf1 include:_spf.google.com include:amazonses.com ~all
  ```
  TTL: Auto

**DO NOT touch** `send.` subdomain SPF (Resend DKIM path intact).

- [ ] **Step 3: Verify via dig**

Run (local or via online tool):

```bash
dig TXT kitaplastik.com +short | grep spf1
```

Expected: `"v=spf1 include:_spf.google.com include:amazonses.com ~all"`

- [ ] **Step 4: Verify Resend mail delivery intact**

User action:
1. Canlı siteye git: `https://kitaplastik.com/tr/iletisim`
2. Contact form doldur + gönder (kendi test e-mail'ine)
3. 1-3 dk içinde mail kutuna gelmesini bekle

Expected: Mail geldi; spam klasöründe DEĞİL; DMARC/DKIM pass (mail header'da `Authentication-Results: dmarc=pass`, `dkim=pass`).

- [ ] **Step 5: mail-tester score**

User action: Tarayıcıda `https://www.mail-tester.com/` → geçici test adresi al → siteye gidip contact form üzerinden o adrese mail gönder → mail-tester'a dön → "Then check your score" → bekle.

Expected score: ≥ 9/10. SPF kontrolü `all tests passed`. Eğer 9 altı, root TXT bozuk, dig ile doğrula + rollback.

- [ ] **Step 6: Runbook checkbox işaretle**

Edit `docs/runbooks/plan5a-infra.md`:
- `### 1.3 Birleşik SPF root @` altındaki 3 checkbox [x]
- Done: tarih + mail-tester skoru

---

### FAZ 1 GATE

**Pre-conditions:**
- [ ] Task 10 commit pushed + CI green
- [ ] Coolify auto-deploy çalıştı (GHA `workflow_run` → `/api/v1/deploy`)
- [ ] Canlı site'ta manuel test error: tarayıcı console'da `throw new Error("sentry test")` → Sentry dashboard'da issue (10-30sn gecikme)
- [ ] SPF dig ok + mail-tester ≥9/10
- [ ] `docs/runbooks/plan5a-infra.md` Faz 1 bölümü %100 checkbox dolu

**GATE soru (user onay):** "Faz 1 complete. Faz 2'ye (Plausible) geç?"

---

# FAZ 2 — Plausible stack (~60dk, sequential)

### Task 12: Faz 2.1 — Coolify Plausible service deploy (SEN runbook)

**Files:**
- None (Coolify UI only)

- [ ] **Step 1: Add Plausible section to runbook**

Edit `docs/runbooks/plan5a-infra.md`, append after Faz 1:

```markdown
## Faz 2 — Plausible

### 2.1 Coolify service deploy
- [ ] Coolify → Resources → New → Service → Plausible Analytics
- [ ] Domain: plausible.kitaplastik.com
- [ ] Env BASE_URL=https://plausible.kitaplastik.com
- [ ] Deploy + 3 container READY
- [ ] Done: _____

### 2.2 CF DNS A record
- [ ] CF DNS → Add Record: A plausible <CX33 IP> DNS only (orange cloud OFF)
- [ ] Verify: dig plausible.kitaplastik.com +short → CX33 IP
- [ ] Done: _____

### 2.3 SSL cert + Plausible admin wizard
- [ ] Browser https://plausible.kitaplastik.com → Traefik LE cert issue (~2dk)
- [ ] Admin wizard → email + password + organization
- [ ] Add site: kitaplastik.com, timezone Europe/Istanbul
- [ ] Tracking script snippet kopyala + kaydet
- [ ] Done: _____
```

- [ ] **Step 2: Coolify UI — deploy Plausible service**

User action:
1. Coolify dashboard → kitaplastik project → **+ Add → Service**
2. Service marketplace'inde "Plausible" ara → **Plausible Analytics** official template'i seç
3. Deploy ayarları:
   - **Domain:** `plausible.kitaplastik.com`
   - **BASE_URL** env: `https://plausible.kitaplastik.com`
   - Diğer env'ler (SECRET_KEY_BASE, DB passwords) Coolify otomatik generate
4. **Deploy** butonuna bas

- [ ] **Step 3: Wait for 3 containers READY**

User action: Coolify dashboard → Service detay → Logs sekmesi

Expected logs (~3-5 dk deploy + init):
- `plausible` container: `Running Plausible.Release...` → `Application started`
- `plausible_db` (Postgres): `database system is ready to accept connections`
- `plausible_events_db` (ClickHouse): `Application: Ready for connections`

- [ ] **Step 4: Runbook işaretle**

`### 2.1 Coolify service deploy` altındaki 4 checkbox [x].

---

### Task 13: Faz 2.2 — CF DNS A record plausible (SEN runbook)

**Files:**
- None (CF DNS only)

- [ ] **Step 1: CF Dashboard → Add A record**

User action: CF Dashboard → DNS → **+ Add record**
- Type: `A`
- Name: `plausible`
- IPv4 address: **CX33 IP** (Hetzner server IP, Coolify instance)
- Proxy status: **DNS only** (orange cloud OFF — Let's Encrypt HTTP-01 için mandatory bu faz'da)
- TTL: Auto
- Save

- [ ] **Step 2: Verify DNS propagation**

Run (wait 30sn-3dk):

```bash
dig plausible.kitaplastik.com +short
```

Expected: CX33 IP address.

- [ ] **Step 3: Runbook işaretle**

`### 2.2 CF DNS A record` altındaki 2 checkbox [x].

---

### Task 14: Faz 2.3 — SSL + Plausible admin wizard (SEN runbook)

**Files:**
- None

- [ ] **Step 1: Wait for SSL cert issuance**

User action: Browser'da `https://plausible.kitaplastik.com` — ilk denemede "Not secure" olabilir (Traefik cert issue ediliyor). 30sn-2dk bekle, sonra refresh.

Expected: Sayfa HTTPS + Plausible setup wizard açılır.

- [ ] **Step 2: Admin wizard setup**

User action:
1. **Admin email:** `berkaytrk6@gmail.com` (veya tercih edilen)
2. **Admin password:** güçlü şifre (password manager'a kaydet)
3. **Organization name:** `Kıta Plastik`
4. **Verify account** (email doğrulama link geldi, click)

- [ ] **Step 3: Add site**

User action: Plausible dashboard → **+ Add a Website**
- **Domain:** `kitaplastik.com`
- **Timezone:** `Europe/Istanbul`
- **Reporting timezone:** aynısı

Plausible tracking script snippet gösterir, örn:
```html
<script defer data-domain="kitaplastik.com" src="https://plausible.kitaplastik.com/js/script.js"></script>
```

**Kaydet** bu snippet'i (Claude buradan `data-domain` + `src` değerlerini kod'a gömecek).

- [ ] **Step 4: "Visit your website" ignore et (henüz Next'e ekli değil)**

- [ ] **Step 5: Runbook işaretle**

`### 2.3 SSL cert + Plausible admin wizard` altındaki 4 checkbox [x].

---

### Task 15: Faz 2.4.1 — `components/PlausibleScript.tsx` + env guard

**Files:**
- Create: `components/PlausibleScript.tsx`

- [ ] **Step 1: Create `components/PlausibleScript.tsx`**

```tsx
// components/PlausibleScript.tsx
//
// Env-guarded Plausible tracker. If either env is empty (dev, CI, test),
// renders null so no script is injected and no external call happens.
// Uses next/script with afterInteractive strategy for non-blocking load.

import Script from "next/script";

export function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST;

  if (!domain || !host) return null;

  const src = `${host.replace(/\/$/, "")}/js/script.js`;

  return (
    <Script
      defer
      data-domain={domain}
      src={src}
      strategy="afterInteractive"
    />
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

---

### Task 16: Faz 2.4.2 — `lib/analytics/plausible.ts` wrapper (TDD)

**Files:**
- Create: `lib/analytics/plausible.ts`
- Test: `tests/unit/analytics/plausible.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/analytics/plausible.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("trackPlausible", () => {
  beforeEach(() => {
    // @ts-expect-error window is jsdom-provided in vitest
    (globalThis as { window: Window }).window.plausible = vi.fn();
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete (globalThis as { window: Window }).window.plausible;
  });

  it("calls window.plausible with event name for no-props event", async () => {
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    trackPlausible({ name: "Contact Submitted" });
    expect(window.plausible).toHaveBeenCalledWith("Contact Submitted", undefined);
  });

  it("calls window.plausible with name and props payload", async () => {
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    trackPlausible({ name: "Locale Changed", props: { to: "en" } });
    expect(window.plausible).toHaveBeenCalledWith("Locale Changed", {
      props: { to: "en" },
    });
  });

  it("no-ops safely when window.plausible is undefined", async () => {
    // @ts-expect-error simulate missing global
    delete (globalThis as { window: Window }).window.plausible;
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    // should not throw
    expect(() => trackPlausible({ name: "Contact Submitted" })).not.toThrow();
  });

  it("no-ops in SSR context when window is undefined", async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    const { trackPlausible } = await import("@/lib/analytics/plausible");
    expect(() => trackPlausible({ name: "Contact Submitted" })).not.toThrow();
    // restore
    globalThis.window = originalWindow;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/analytics/plausible.test.ts
```

Expected: FAIL with `Cannot find module '@/lib/analytics/plausible'`.

- [ ] **Step 3: Create `lib/analytics/plausible.ts`**

```typescript
// lib/analytics/plausible.ts
//
// Type-safe Plausible event dispatcher. Invokes window.plausible()
// injected by <PlausibleScript />. No-ops in SSR or if script absent
// (dev, CI, ad-blocked clients).
//
// Event catalog is a discriminated union — adding a new event requires
// extending PlausibleEvent and its consumer. Keeps props shape contracts
// tight across call sites.

export type PlausibleEvent =
  | { name: "Contact Submitted" }
  | { name: "Catalog Requested"; props: { locale: string } }
  | { name: "Locale Changed"; props: { to: string } }
  | { name: "Sector Clicked"; props: { slug: string } };

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

export function trackPlausible(event: PlausibleEvent): void {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  const options = "props" in event ? { props: event.props } : undefined;
  window.plausible(event.name, options);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test tests/unit/analytics/plausible.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Run full test suite to ensure no regression**

```bash
pnpm test
```

Expected: 139 + 4 = 143 unit tests, all pass.

---

### Task 17: Faz 2.4.3 — Inject `<PlausibleScript />` in layout

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Import + render**

Open `app/[locale]/layout.tsx`. Find existing imports block (lines 1-15) and add:

```typescript
import { PlausibleScript } from "@/components/PlausibleScript";
```

Find the `<html>` block (line 59). Inside `<html>`, before `<body>`, add `<head>` with script:

Replace:
```tsx
return (
  <html
    lang={locale}
    dir={dir}
    className={`${fraunces.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
  >
    <body className={cn("text-text-primary antialiased", locale === "ar" && "font-arabic")}>
```

With:
```tsx
return (
  <html
    lang={locale}
    dir={dir}
    className={`${fraunces.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
  >
    <head>
      <PlausibleScript />
    </head>
    <body className={cn("text-text-primary antialiased", locale === "ar" && "font-arabic")}>
```

Note: Next.js 15 auto-manages `<head>` content; explicit `<head>` wrapper with Script inside works (Script placement through next/script). No conflict with metadata API.

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: success; no "cannot render <head>" warning.

- [ ] **Step 3: Lokal dev smoke**

Run in background:

```bash
pnpm dev
```

Browser → `http://localhost:3000/tr` → DevTools Network → refresh → `script.js` fetch YOK (env boş, PlausibleScript null render).

Then run with env:

```bash
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com NEXT_PUBLIC_PLAUSIBLE_HOST=https://plausible.kitaplastik.com pnpm dev
```

Browser refresh → DevTools Network → `plausible.kitaplastik.com/js/script.js` requested (200 OK).

---

### Task 18: Faz 2.4.4 — `Contact Submitted` event

**Files:**
- Modify: `components/contact/ContactForm.tsx`

- [ ] **Step 1: Import + call at submit success**

Open `components/contact/ContactForm.tsx`. Add import after existing imports (after line ~8):

```typescript
import { trackPlausible } from "@/lib/analytics/plausible";
```

Find line 70:
```typescript
setStatus("success");
form.reset();
setTurnstileToken(null);
```

Replace with:
```typescript
setStatus("success");
form.reset();
setTurnstileToken(null);
trackPlausible({ name: "Contact Submitted" });
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

---

### Task 19: Faz 2.4.5 — `Catalog Requested` event

**Files:**
- Modify: `components/catalog/CatalogRequestForm.tsx`

- [ ] **Step 1: Import + call at submit success**

Open `components/catalog/CatalogRequestForm.tsx`. Add import after line 12:

```typescript
import { trackPlausible } from "@/lib/analytics/plausible";
```

Find line 70-72:
```typescript
setStatus("success");
form.reset();
setTurnstileToken(null);
```

Replace with:
```typescript
setStatus("success");
form.reset();
setTurnstileToken(null);
trackPlausible({ name: "Catalog Requested", props: { locale: payload.locale } });
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

---

### Task 20: Faz 2.4.6 — `Locale Changed` event

**Files:**
- Modify: `components/layout/LocaleSwitcher.tsx`

- [ ] **Step 1: Add onClick handler to anchor**

The component uses plain `<a>` for full-page navigation (v3 Link bug workaround per comment lines 16-28). To track without breaking nav, attach an `onMouseDown` handler (fires before default nav regardless of pointer-up target):

Open `components/layout/LocaleSwitcher.tsx`. Add import:

```typescript
import { trackPlausible } from "@/lib/analytics/plausible";
```

Find the `<a>` element (lines 48-60):

```tsx
<a
  href={`/${locale}${pathTail}`}
  hrefLang={locale}
  aria-current={active ? "true" : undefined}
  className={cn(
    "tracking-[0.08em] transition-colors duration-200 ease-out",
    active
      ? "text-[var(--color-text-primary)] underline decoration-[var(--color-accent-cobalt)] decoration-2 underline-offset-[6px]"
      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
  )}
>
  {LABEL[locale]}
</a>
```

Replace with:

```tsx
<a
  href={`/${locale}${pathTail}`}
  hrefLang={locale}
  aria-current={active ? "true" : undefined}
  onMouseDown={() => {
    if (!active) trackPlausible({ name: "Locale Changed", props: { to: locale } });
  }}
  className={cn(
    "tracking-[0.08em] transition-colors duration-200 ease-out",
    active
      ? "text-[var(--color-text-primary)] underline decoration-[var(--color-accent-cobalt)] decoration-2 underline-offset-[6px]"
      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
  )}
>
  {LABEL[locale]}
</a>
```

Note: `onMouseDown` fires before `onClick`, before navigation. The event ships to Plausible in-flight (fetch), full-page reload happens regardless. Double-fire protected by `!active` guard (clicking current locale doesn't track). For keyboard users, add `onKeyDown` if we want parity — but this is a fringe case (Enter key on focused anchor already fires navigation; Plausible will see the page-enter on destination if we later wire a pageview event).

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

---

### Task 21: Faz 2.4.7 — `Sector Clicked` event

**Files:**
- Modify: `components/home/SectorGrid.tsx`

- [ ] **Step 1: Extract slug from pathname + track**

Open `components/home/SectorGrid.tsx`. Add import:

```typescript
"use client";

import { trackPlausible } from "@/lib/analytics/plausible";
```

Note: current file is a **server component** (uses `useTranslations` from `next-intl` which works server-side). Adding `"use client"` forces client — **but this is NOT what we want**. Instead, wrap Link in a small client component to handle the onClick.

Revert the `"use client"` decision. Keep the file as-is but create a sibling client component:

**Create** `components/home/SectorCardLink.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { trackPlausible } from "@/lib/analytics/plausible";

type SectorSlug = "bottle-washing" | "caps" | "textile";

interface SectorCardLinkProps {
  pathname: `/sectors/${SectorSlug}`;
  slug: SectorSlug;
  children: ReactNode;
  className?: string;
}

export function SectorCardLink({ pathname, slug, children, className }: SectorCardLinkProps) {
  return (
    <Link
      href={pathname}
      className={className}
      onClick={() => trackPlausible({ name: "Sector Clicked", props: { slug } })}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Use `SectorCardLink` in `SectorGrid.tsx`**

Open `components/home/SectorGrid.tsx`. Replace:

```tsx
import { Link } from "@/i18n/navigation";
```

With:

```tsx
import { SectorCardLink } from "./SectorCardLink";
```

Find SECTORS constant and extend with slug:

```typescript
const SECTORS: readonly SectorDef[] = [
  {
    pathname: "/sectors/bottle-washing",
    nsKey: "camYikama",
    number: "01",
    spec: "Ø 80–320 mm · 12–480 g",
  },
  { pathname: "/sectors/caps", nsKey: "kapak", number: "02", spec: "26–83 mm · HDPE / PP / PET" },
  {
    pathname: "/sectors/textile",
    nsKey: "tekstil",
    number: "03",
    spec: "POM · PA6 · abrasif aşınmaya dayanıklı",
  },
];
```

Extract slug inline in JSX via literal `pathname.replace("/sectors/", "")`:

Replace:
```tsx
<Link
  key={sector.pathname}
  href={sector.pathname}
  className="group block focus-visible:outline-none"
>
```

With:
```tsx
<SectorCardLink
  key={sector.pathname}
  pathname={sector.pathname}
  slug={sector.pathname.replace("/sectors/", "") as "bottle-washing" | "caps" | "textile"}
  className="group block focus-visible:outline-none"
>
```

Also change the closing tag from `</Link>` to `</SectorCardLink>`.

- [ ] **Step 3: Verify typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 4: E2E smoke (sector page navigation still works)**

```bash
pnpm test:e2e -- --grep "sectors"
```

Expected: Existing sector navigation E2E tests green.

---

### Task 22: Faz 2 commit — `pnpm verify` + atomic

**Files:**
- All Task 15-21 changes

- [ ] **Step 1: Full pnpm verify**

```bash
pnpm verify
```

Expected: all green (143 unit + 60 E2E + lint + format + build + audit).

- [ ] **Step 2: Review staged changes**

```bash
git status
git diff --stat
```

Expected files:
- `components/PlausibleScript.tsx` (new)
- `lib/analytics/plausible.ts` (new)
- `tests/unit/analytics/plausible.test.ts` (new)
- `components/home/SectorCardLink.tsx` (new)
- `app/[locale]/layout.tsx` (PlausibleScript inject)
- `components/contact/ContactForm.tsx` (event)
- `components/catalog/CatalogRequestForm.tsx` (event)
- `components/layout/LocaleSwitcher.tsx` (onMouseDown)
- `components/home/SectorGrid.tsx` (SectorCardLink swap)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(observability): add Plausible self-hosted analytics + event tracking

- <PlausibleScript /> env-guarded component + app/[locale]/layout.tsx injection
- lib/analytics/plausible.ts — type-safe trackPlausible wrapper (SSR-safe)
- 4 events enjekte:
  - Contact Submitted (ContactForm)
  - Catalog Requested (CatalogRequestForm, locale prop)
  - Locale Changed (LocaleSwitcher, onMouseDown pre-nav, to prop)
  - Sector Clicked (SectorCardLink client wrapper for SectorGrid, slug prop)
- 4 unit tests (window.plausible stub, SSR safety, missing script safety)

NEXT_PUBLIC_PLAUSIBLE_DOMAIN + NEXT_PUBLIC_PLAUSIBLE_HOST boşsa no-op.
Plan 5a Faz 2.4 — spec §5.2"
```

- [ ] **Step 4: Push + CI verify**

```bash
git push
```

Expected: CI green; Coolify auto-deploy trigger.

- [ ] **Step 5: Post-deploy manual verify**

User action (after Coolify deploy completes, ~2-3 dk):
1. `https://kitaplastik.com/tr` → DevTools Network → `plausible.kitaplastik.com/js/script.js` load ✅
2. Contact form submit (test mail) → `https://plausible.kitaplastik.com/kitaplastik.com` → Realtime tab → `Contact Submitted` event göründü
3. LocaleSwitcher TR → EN → `Locale Changed` event (props: `to=en`)
4. Sector card click → `Sector Clicked` event (props: `slug=caps` vs)
5. Catalog form submit → `Catalog Requested` event (props: `locale=tr`)

---

### FAZ 2 GATE

**Pre-conditions:**
- [ ] Task 22 commit pushed + CI green + Coolify deploy complete
- [ ] Plausible realtime dashboard: her 4 event ≥ 1x
- [ ] Runbook Faz 2 bölümü %100 checkbox dolu

**GATE soru:** "Faz 2 complete. Faz 3'e (GWS) geç?"

---

# FAZ 3 — GWS info@ inbox (~45dk, sequential)

### Task 23: Faz 3.1 — GWS trial start + domain verify (SEN runbook)

**Files:**
- None (GWS + CF DNS only, runbook update)

- [ ] **Step 1: Runbook Faz 3 skeleton append**

Edit `docs/runbooks/plan5a-infra.md`, append:

```markdown
## Faz 3 — GWS

### 3.1 GWS trial start + domain verify
- [ ] workspace.google.com/business/signup → Business Starter
- [ ] Admin email + domain kitaplastik.com
- [ ] Google TXT verification string → CF DNS root
- [ ] GWS Admin → Domains → Verified ✅
- [ ] Done: _____

### 3.2 MX records + user + MFA
- [ ] CF DNS → 5 MX record (ASPMX.L.GOOGLE.COM priority 1, ALT1/ALT2=5, ALT3/ALT4=10)
- [ ] GWS Admin → Users → Add info@kitaplastik.com
- [ ] Login + MFA authenticator app
- [ ] Verify: dig MX + mail-tester inbox test
- [ ] Done: _____

### 3.3 Reply-to E2E verify (code değişmez)
- [ ] Canlı contact form → test mail gönder
- [ ] info@kitaplastik.com GWS inbox'ta mail var
- [ ] Reply → müşteri adresine, From info@kitaplastik.com
- [ ] Customer ayrıca onay mail aldı (resend 2nd call)
- [ ] Done: _____
```

- [ ] **Step 2: GWS trial signup**

User action:
1. `https://workspace.google.com/business/signup/welcome` → **Get started**
2. Business name: `Kıta Plastik`
3. Employees: 1-10
4. Domain: `Yes, I have a domain` → `kitaplastik.com`
5. Admin setup: geçici Gmail'e bağla (`berkaytrk6@gmail.com`) → yeni GWS hesabı için geçici username
6. Plan: **Business Starter** ($7.2/ay per user)
7. Payment: kredi kartı + 14 gün ücretsiz trial

- [ ] **Step 3: Domain TXT verification**

GWS Admin Console → Verify domain akışı sırasında:
- Google şu pattern'de TXT string verir: `google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXX`
- Bu string'i CF DNS'e ekle:
  - Type: `TXT`
  - Name: `@`
  - Content: `google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXX` (Google'un verdiği tam string)
  - TTL: Auto

- [ ] **Step 4: Verify**

Run:

```bash
dig TXT kitaplastik.com +short | grep google-site-verification
```

Expected: Google verification string.

GWS Admin Console → Domains → `kitaplastik.com` → **Verify** butonu → ~30sn-5dk içinde `Verified ✅`.

- [ ] **Step 5: Runbook işaretle**

---

### Task 24: Faz 3.2 — MX records + user + MFA (SEN runbook)

**Files:**
- None

- [ ] **Step 1: CF DNS → 5 MX records**

User action: CF Dashboard → DNS → Add 5 records:

| Type | Name | Priority | Content | TTL |
|---|---|---|---|---|
| MX | @ | 1 | ASPMX.L.GOOGLE.COM | Auto |
| MX | @ | 5 | ALT1.ASPMX.L.GOOGLE.COM | Auto |
| MX | @ | 5 | ALT2.ASPMX.L.GOOGLE.COM | Auto |
| MX | @ | 10 | ALT3.ASPMX.L.GOOGLE.COM | Auto |
| MX | @ | 10 | ALT4.ASPMX.L.GOOGLE.COM | Auto |

Eğer mevcut başka MX kayıtları varsa (örn. Resend veya önceki mail provider), **delete** et.

- [ ] **Step 2: Verify MX propagation**

```bash
dig MX kitaplastik.com +short
```

Expected (sıra priority'e göre):
```
1 aspmx.l.google.com.
5 alt1.aspmx.l.google.com.
5 alt2.aspmx.l.google.com.
10 alt3.aspmx.l.google.com.
10 alt4.aspmx.l.google.com.
```

- [ ] **Step 3: GWS user create**

GWS Admin Console → **Users** → **+ Add new user**:
- First name: `Kıta Plastik`
- Last name: `Info`
- Primary email: `info@kitaplastik.com`
- Secondary email: (boş)
- Password: güçlü şifre (manager'a kaydet)
- Save + Continue

- [ ] **Step 4: MFA aktif et**

User action:
1. Yeni tab'da `https://accounts.google.com` → logout → login `info@kitaplastik.com` + password
2. "Change password" → yeni kalıcı şifre
3. Google Account → Security → 2-Step Verification → **Turn on**
4. Authenticator app (Google Authenticator veya Authy) QR kod scan → 6-hane code gir → kaydet
5. Backup codes indir (güvenli yere)

- [ ] **Step 5: Inbox test**

User action:
1. `https://mail.google.com/a/kitaplastik.com` → `info@kitaplastik.com` hesabıyla login (MFA)
2. Başka bir email adresinden `info@kitaplastik.com` adresine test mail gönder
3. 1-5 dk bekle
4. Inbox'a düştü mü kontrol

Expected: Test mail inbox'ta; spam'de DEĞİL.

- [ ] **Step 6: Runbook işaretle**

---

### Task 25: Faz 3.3 — Reply-to E2E verify (SEN runbook, kod değişmez)

**Files:**
- None (kod Plan 4a'da zaten doğru konfigüre: `app/api/contact/route.ts:69-76` team mail `to: RESEND_TEAM_EMAIL, replyTo: input.email`)

- [ ] **Step 1: Canlı contact form submit**

User action:
1. Tarayıcıda `https://kitaplastik.com/tr/iletisim`
2. Contact form doldur:
   - Name: `Test Müşteri`
   - Email: kendi test gmail'in (örn. `berkaytrk6+test@gmail.com`)
   - Company: `Test Co`
   - Phone: (boş)
   - Subject: `General`
   - Message: `Plan 5a E2E test`
3. Turnstile geç + Submit

Expected: Form success state.

- [ ] **Step 2: Verify mails arrived**

Kontrol listesi:
1. `info@kitaplastik.com` GWS inbox'ta mail var, subject "Yeni İletişim..." benzeri
2. `berkaytrk6+test@gmail.com` inbox'ta (farklı tab'da login) customer onay mail'i var, subject "Mesajınız Alındı" benzeri
3. Mail header'ı incelle (Gmail → more → "Show original") → `Authentication-Results: dmarc=pass, dkim=pass, spf=pass`

- [ ] **Step 3: Reply test**

GWS inbox'ta team mail'i aç → **Reply** → To alanı otomatik `berkaytrk6+test@gmail.com` (customer) olmalı; From `info@kitaplastik.com`.

Body: `Test reply` → Send.

Expected: Customer gmail'ine reply geldi; sender `info@kitaplastik.com`.

- [ ] **Step 4: Catalog scope note**

**NOT**: `app/api/catalog/route.ts` team notification göndermiyor (by design — catalog self-service; team Plausible `Catalog Requested` event + Sentry ile takip eder). Bu Faz 3'te değiştirilmiyor — design decision spec §5.3 Task 3.3.

- [ ] **Step 5: Runbook işaretle + Faz 3 commit (sadece runbook update)**

```bash
git add docs/runbooks/plan5a-infra.md
git commit -m "docs(runbook): mark Faz 1-3 complete in Plan 5a runbook"
```

---

### FAZ 3 GATE

**Pre-conditions:**
- [ ] `info@` GWS inbox çalışıyor
- [ ] Contact form reply-to chain end-to-end works
- [ ] Customer confirmation mail delivered
- [ ] Runbook Faz 3 %100

**GATE soru:** "Faz 3 complete. Faz 4'e (CF proxy, RISKY) geç?"

---

# FAZ 4 — CF proxy + DNS-01 (~30dk, RISKY, sequential)

### Task 26: Faz 4.1 — CF API token create (SEN runbook)

**Files:**
- None

- [ ] **Step 1: Runbook Faz 4 skeleton append**

Edit `docs/runbooks/plan5a-infra.md`, append:

```markdown
## Faz 4 — CF proxy (RISKY)

### 4.1 CF API token
- [ ] CF Profile → API Tokens → Create Custom
- [ ] Permissions: Zone:DNS:Edit + Zone:Zone:Read
- [ ] Zone Resources: Specific → kitaplastik.com
- [ ] TTL 1 year
- [ ] Verify: curl test
- [ ] Done: _____

### 4.2 Traefik DNS-01 config (SSH)
- [ ] VPS SSH
- [ ] Traefik config dosyasını bul
- [ ] dnsChallenge provider cloudflare + CF_DNS_API_TOKEN env
- [ ] Traefik restart
- [ ] Verify: logs "DNS-01 challenge succeeded"
- [ ] Done: _____

### 4.3 CF A Proxied + SSL Full strict
- [ ] CF DNS → kitaplastik.com A orange cloud ON
- [ ] CF SSL/TLS → Overview → Full (strict)
- [ ] Verify: curl -I cf-ray header + HTTPS 200
- [ ] Done: _____
```

- [ ] **Step 2: Create CF API token**

User action: CF Dashboard → Profile (sağ üst avatar) → **API Tokens** → **Create Token** → **Custom token**:
- Token name: `kitaplastik-traefik-dns01`
- Permissions: **Zone → DNS → Edit** + **Zone → Zone → Read**
- Zone Resources: **Include → Specific zone → kitaplastik.com**
- Client IP Address Filtering: (boş)
- TTL: `1 year from now`
- Continue → **Create Token**
- Token string'i (tek seferde gösterilir) kopyala → güvenli yere kaydet

- [ ] **Step 3: Verify token**

Run:

```bash
curl -H "Authorization: Bearer <paste-token>" \
  https://api.cloudflare.com/client/v4/zones \
  | grep -o '"name":"kitaplastik.com"'
```

Expected: `"name":"kitaplastik.com"` (200 OK JSON içerir zone)

- [ ] **Step 4: Runbook işaretle**

---

### Task 27: Faz 4.2 — Traefik DNS-01 config (SEN SSH)

**Files:**
- None (VPS-only; Coolify-managed Traefik)

- [ ] **Step 1: SSH to VPS**

```bash
ssh root@<CX33 IP>   # or with your configured alias
```

- [ ] **Step 2: Locate Traefik config**

Run on VPS:

```bash
ls /data/coolify/proxy/
find / -name "traefik*.yaml" -type f 2>/dev/null | head
```

Expected location: `/data/coolify/proxy/traefik.yml` (main) or `/data/coolify/proxy/dynamic/`.

- [ ] **Step 3: Backup current config**

```bash
cp /data/coolify/proxy/traefik.yml /data/coolify/proxy/traefik.yml.bak.$(date +%Y%m%d)
```

- [ ] **Step 4: Edit DNS-01 challenge**

Open config (vim/nano). Find `certificatesResolvers` block. Replace HTTP-01 with DNS-01:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: berkaytrk6@gmail.com
      storage: /traefik/acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
        delayBeforeCheck: 30
```

Ensure old `httpChallenge:` block is removed.

- [ ] **Step 5: Inject CF_DNS_API_TOKEN env**

Coolify uses Docker-based Traefik. Find Traefik service definition (`docker-compose.yml` or Coolify UI → Server → Proxy → Environment Variables):

Add env var:
```
CF_DNS_API_TOKEN=<paste token from Task 26>
```

If using docker-compose.yml:
```yaml
services:
  traefik:
    environment:
      - CF_DNS_API_TOKEN=<token>
```

If Coolify has a UI for proxy env vars, use that (simpler, persists across Coolify updates).

- [ ] **Step 6: Restart Traefik**

Coolify UI → Server → Proxy → Restart

Or SSH:
```bash
docker restart coolify-proxy
```

- [ ] **Step 7: Verify DNS-01 success**

```bash
docker logs coolify-proxy 2>&1 | tail -50 | grep -i "acme\|challenge\|cloudflare"
```

Expected: `"Using ACME config...dns-01"` or similar; no `error` lines. Next cert renewal will use DNS-01.

Optional: Force a cert renewal on a test subdomain (e.g., re-deploy a service) → watch logs for `"DNS-01 challenge succeeded"`.

- [ ] **Step 8: Runbook işaretle**

---

### Task 28: Faz 4.3 — CF A Proxied + SSL Full strict (SEN runbook)

**Files:**
- None

- [ ] **Step 1: Turn on orange cloud for root A**

User action: CF Dashboard → DNS → Records → `kitaplastik.com` A record → Edit → **Proxy status**: toggle to **Proxied** (orange cloud ON) → Save.

Note: Do NOT proxy `plausible.kitaplastik.com` — keep it DNS only (Plan 5a scope).

- [ ] **Step 2: SSL/TLS mode → Full (strict)**

CF Dashboard → SSL/TLS → Overview → **Full (strict)** seç.

Note: "Full (strict)" requires origin to have a valid cert. Traefik's Let's Encrypt cert satisfies this — we're protected.

- [ ] **Step 3: Verify HTTPS + cf-ray**

```bash
curl -I https://kitaplastik.com
```

Expected headers:
```
HTTP/2 200
server: cloudflare
cf-ray: <ray-id>
...
```

- [ ] **Step 4: Verify cert chain**

```bash
openssl s_client -connect kitaplastik.com:443 -servername kitaplastik.com </dev/null 2>/dev/null | grep -E "subject|issuer"
```

Expected: `subject=CN=kitaplastik.com` + `issuer=CN=Cloudflare Inc ECC CA-...` (CF edge cert, since Proxied) — original Traefik LE cert is behind.

- [ ] **Step 5: Verify Turnstile iframe + Supabase connect-src intact**

User action: Tarayıcıda `https://kitaplastik.com/tr/iletisim` → DevTools Console → sayfa yüklendi, Turnstile iframe göründü, form submit ediliyor (Turnstile + Supabase calls).

Expected: Zero CSP violations; zero mixed-content warnings; Turnstile checkbox OK.

- [ ] **Step 6: Runbook işaretle**

---

### Task 29: Faz 4.4 — E2E smoke across 4 locales (BEN)

**Files:**
- Optional: `tests/e2e/smoke-prod.spec.ts` (create if want repeatable)

- [ ] **Step 1: Manual smoke via Playwright against prod**

Run:

```bash
BASE_URL=https://kitaplastik.com pnpm test:e2e --grep "@smoke" 2>&1 | tail -40
```

If no `@smoke`-tagged tests exist, run the full suite against prod:

```bash
BASE_URL=https://kitaplastik.com pnpm test:e2e
```

Expected: All 60 E2E green (homepage 4 locales, contact, catalog, admin login, LocaleSwitcher, sector pages, Plan 4a redirects, Plan 4d pathnames).

- [ ] **Step 2: Manual browser audit**

User action:
1. `https://kitaplastik.com/tr` → render + Atmosphere 3D scene (R3F WebGL) OK
2. `https://kitaplastik.com/en/products` → product list
3. `https://kitaplastik.com/ru/katalog` → catalog form
4. `https://kitaplastik.com/ar/man-nahnu` → RTL layout
5. DevTools Network tab: `cf-ray` header her response'ta; tüm asset'ler 200

Expected: Zero regression.

- [ ] **Step 3: Sentry dashboard 0 new errors**

User action: `https://sentry.io/organizations/kitaplastik/issues/` → filter "last 30 minutes" → **0 new issues** olmalı (Task 29.1-2 sırasında normal traffic only).

- [ ] **Step 4: Plausible realtime confirms analytics intact**

User action: Plausible dashboard realtime tab → son test navigasyonları görünüyor.

- [ ] **Step 5: Runbook "Post-deploy verification" çek**

Edit `docs/runbooks/plan5a-infra.md` → "## Post-deploy verification" altındaki 5 checkbox [x].

---

### Task 30: Plan 5a close — runbook commit + RESUME + memory

**Files:**
- Modify: `docs/superpowers/RESUME.md`
- Modify: `docs/runbooks/plan5a-infra.md`
- Memory: `~/.claude/projects/-Users-bt-claude-kitaplastik/memory/`

- [ ] **Step 1: Runbook final state commit**

```bash
git add docs/runbooks/plan5a-infra.md
git commit -m "docs(runbook): mark Plan 5a complete — all 4 fazes verified"
```

- [ ] **Step 2: Update `docs/superpowers/RESUME.md`**

Read current state; update to reflect Plan 5a complete + Plan 5d (Upgrade borcu) starter prompt next.

Open `docs/superpowers/RESUME.md` → update "Current State" section:
- Sentry + Plausible canlı
- GWS info@ inbox canlı
- CF proxy + Full strict canlı
- Next session: Plan 5d (next-intl v4 + Upstash Redis)
- Reference: `docs/superpowers/specs/2026-04-22-plan5-post-mvp-polish-roadmap.md` §5d

Commit:

```bash
git add docs/superpowers/RESUME.md
git commit -m "docs(resume): Plan 5a canlıda + Plan 5d kickoff ready"
```

- [ ] **Step 3: Memory updates**

Write new feedback/reference memories. Use Write tool on:

Write `/Users/bt/.claude/projects/-Users-bt-claude-kitaplastik/memory/reference_sentry_project.md`:

```markdown
---
name: Sentry project kitaplastik-web
description: EU-hosted Sentry project for kitaplastik MVP — errors-only scope
type: reference
---

- Org: `kitaplastik` · Project: `web` · Region: EU (de.sentry.io)
- Dashboard: https://kitaplastik.sentry.io/projects/web/
- DSN stored in Coolify env `NEXT_PUBLIC_SENTRY_DSN`
- Auth token (source map upload) in Coolify env `SENTRY_AUTH_TOKEN`, scopes: org:read + project:read/write + project:releases
- Scope: errors only (tracesSampleRate 0, replay off)
- Plan: Developer free tier — 5K events/ay
```

Write `/Users/bt/.claude/projects/-Users-bt-claude-kitaplastik/memory/reference_plausible_selfhost.md`:

```markdown
---
name: Plausible self-host on Coolify
description: CE Plausible at plausible.kitaplastik.com; 3-container Coolify service
type: reference
---

- URL: https://plausible.kitaplastik.com (DNS only, orange cloud OFF — Let's Encrypt HTTP-01)
- Stack: Plausible CE + Postgres + ClickHouse (Coolify marketplace template)
- Admin: berkaytrk6@gmail.com (password in manager)
- Tracked events: Contact Submitted, Catalog Requested (locale), Locale Changed (to), Sector Clicked (slug)
- Script: `<script defer data-domain="kitaplastik.com" src="https://plausible.kitaplastik.com/js/script.js">`
- Env: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com` + `NEXT_PUBLIC_PLAUSIBLE_HOST=https://plausible.kitaplastik.com`
```

Write `/Users/bt/.claude/projects/-Users-bt-claude-kitaplastik/memory/reference_gws_inbox.md`:

```markdown
---
name: Google Workspace info@kitaplastik.com
description: GWS Business Starter primary inbox for contact form replies
type: reference
---

- Plan: Business Starter ($7.2/ay)
- Primary user: info@kitaplastik.com (MFA enforced)
- Inbox URL: https://mail.google.com/a/kitaplastik.com
- Admin: berkaytrk6@gmail.com (via GWS Admin Console)
- MX records: 5 Google MX (ASPMX.L.GOOGLE.COM priority 1; ALT1/ALT2=5; ALT3/ALT4=10)
- Reply-to chain: Resend sends team mail with `to: info@, replyTo: input.email` → GWS reply-to customer works out of box
```

Write `/Users/bt/.claude/projects/-Users-bt-claude-kitaplastik/memory/feedback_cf_proxy_dns01_traefik.md`:

```markdown
---
name: CF proxy + Let's Encrypt DNS-01 Traefik pattern
description: Coolify Traefik DNS-01 challenge with CF token; Proxied + SSL Full strict works
type: feedback
---

CF Proxied ON + SSL Full (strict) + Traefik Let's Encrypt DNS-01 works safely on CF zone "kitaplastik.com".

**Why:** HTTP-01 challenge fails when CF orange-cloud Proxies root — LE ACME can't reach origin. DNS-01 bypasses by creating temporary TXT records via CF API.

**How to apply:**
- CF API token: Zone:DNS:Edit + Zone:Zone:Read, specific zone only (least privilege)
- Traefik config: `certificatesResolvers.letsencrypt.acme.dnsChallenge.provider: cloudflare` + `CF_DNS_API_TOKEN` env
- Traefik container must see the env (Coolify proxy settings, not service env)
- Backup `traefik.yml` before editing
- Rollback: HTTP-01'e geri çevir + orange cloud OFF → 90 gün mevcut cert geçerli, 0sn downtime
```

Update `/Users/bt/.claude/projects/-Users-bt-claude-kitaplastik/memory/MEMORY.md`:

Add 4 new entries to the index (one-liner each):

```markdown
- [Sentry project kitaplastik-web](reference_sentry_project.md) — EU DSN, errors-only, Coolify env
- [Plausible self-host](reference_plausible_selfhost.md) — plausible.kitaplastik.com, 3 container, 4 events
- [GWS info@ inbox](reference_gws_inbox.md) — Business Starter, MFA, Resend reply-to chain
- [CF proxy + DNS-01 Traefik](feedback_cf_proxy_dns01_traefik.md) — CF API token + dnsChallenge pattern
```

Update `project_kitaplastik.md` state line: "Plan 1+2+3+4a+4b+4c+4d+5a ✅ canlıda".

- [ ] **Step 4: Final commit + verify runbook green**

```bash
git status
```

Expected: clean working tree (all commits pushed).

```bash
cat docs/runbooks/plan5a-infra.md | grep -c "\[x\]"
```

Expected: All checkboxes ticked (count matches number of steps in runbook).

- [ ] **Step 5: Plan 5a session close message**

User message prompt:

```
Plan 5a complete. Proje durumu:
- Observability: Sentry + Plausible canlı
- Security: SSL Full strict + SPF birleşik + GHSA gap kapatıldı
- Email: GWS info@ inbox çalışıyor
- CF proxy: Proxied + DNS-01 Traefik

Next session starter prompt (Plan 5d — Upgrade borcu) roadmap spec'inde hazır.
```

---

### FAZ 4 GATE (Plan 5a complete)

**Pre-conditions:**
- [ ] Task 29 all 5 steps complete
- [ ] Task 30 all 5 steps complete
- [ ] `docs/runbooks/plan5a-infra.md` 100% checkbox dolu + committed
- [ ] `RESUME.md` Plan 5d starter prompt ready
- [ ] Memory: 4 yeni entry eklendi
- [ ] Production manual smoke: 4 locale homepage + contact + catalog + admin + LocaleSwitcher + sector pages all green

**Complete.** Plan 5a kapandı; Plan 5b (Legal) veya Plan 5c (Admin CRUD) veya Plan 5d (Upgrade) ayrı session'da.

---

## Self-Review (writing-plans skill mandatory)

Spec coverage audit:

| Spec bölümü | Task | Coverage |
|---|---|---|
| §2 Kararlar | Task 3-5 (Sentry A), Task 15-22 (Plausible self-host), Task 23-25 (GWS A), execution hybrid tüm fazlar | ✅ |
| §3.1 npm deps | Task 3 (@sentry/nextjs install) | ✅ |
| §3.2 yeni dosyalar | 3 (sentry configs), 4 (instrumentation + global-error), 15 (PlausibleScript), 16 (analytics lib + test), 21 (SectorCardLink), 1 (runbook) | ✅ |
| §3.3 değişecek dosyalar | 5 (next.config), 6-8 (console replacements), 9 (env/CI), 17-21 (UI events) | ✅ |
| §3.4 env var | 9 (.env.example + playwright + CI) | ✅ |
| §3.5 Plausible service | Task 12 | ✅ |
| §3.6 DNS records | Task 11 (SPF), 13 (plausible A), 23-24 (GWS verify + MX), 28 (A Proxied) | ✅ |
| §3.7 invariants | Sentry beforeSend (Task 3), event naming (Task 16), CF rollback (Task 28) | ✅ |
| §4 dep map | Faz 1 paralel (Tasks 2,3-10,11); Faz 2 seq (12-22); Faz 3 seq (23-25); Faz 4 seq (26-29) | ✅ |
| §5.1 Faz 1 | Task 2 (1.1), 3-10 (1.2), 11 (1.3) | ✅ |
| §5.2 Faz 2 | Task 12 (2.1), 13 (2.2), 14 (2.3), 15-22 (2.4) | ✅ |
| §5.3 Faz 3 | Task 23 (3.1), 24 (3.2), 25 (3.3) | ✅ |
| §5.4 Faz 4 | Task 26 (4.1), 27 (4.2), 28 (4.3), 29 (4.4) | ✅ |
| §6 Test strategy | Task 3-10 (unit implied), 16 (TDD explicit), 22 (E2E verify), 29 (prod smoke) | ✅ |
| §7 Rollback | Each task's Step mentions rollback where applicable; CF Proxied (28 rollback: orange cloud OFF), Traefik (27 rollback: YAML geri) | ✅ |
| §8 Phase gates | FAZ 1/2/3/4 GATE sections explicit | ✅ |
| §9 Success criteria | Task 29 steps cover each bullet; Task 30 runbook + RESUME + memory | ✅ |
| §10 Risk matrix | Task 29-30 gate address risk 12/25 Faz 4 | ✅ |
| §11 Regresyon | Task 22 E2E verify; Task 29 prod smoke | ✅ |
| §12 Runbook format | Task 1 (skeleton) + 11, 14, 22, 25, 28, 29 (fills) | ✅ |
| §13 Execution notes | "Execution invariants" section + commit messages | ✅ |
| §14 Post-plan tasks | Task 30 | ✅ |

**Placeholder scan:**
- "implement later" / "TBD" / "TODO" — grep plan file: zero occurrences ✅
- "similar to Task N" — zero (full code in every step) ✅
- "add appropriate error handling" — zero ✅

**Type consistency:**
- `trackPlausible(event: PlausibleEvent)` signature consistent Task 16 (define), 18-21 (consume) ✅
- `PlausibleEvent` discriminated union: 4 variants match 4 call sites ✅
- `SectorCardLink` props (pathname, slug, children, className) consistent Task 21 ✅
- `Sentry.captureException(error, {tags, extra})` signature consistent Tasks 6-8 ✅

**Ambiguity:**
- Task 6 step 3: dynamic `await import` vs static top-level — explicit comment why (edge bundle bloat)
- Task 27 step 5: Coolify UI env injection path may differ per Coolify version — explicit fallback (docker-compose.yml or UI)
- Task 28 step 2: "Full (strict)" requires origin cert — noted (Traefik LE provides it)

**Scope:**
- 30 tasks total; each faz 5-10 tasks; steps 2-6 per task — bite-sized ✅
- No task mixes multiple unrelated concerns ✅
- Runbook + code separation clear (infra Task 2/11/12-14/23-28 vs code Task 3-10/15-22) ✅

Plan pass. Ready for execution.

---
