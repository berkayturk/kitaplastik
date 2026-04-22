# Plan 5a Infra Runbook

**Tarih:** 2026-04-22
**Amaç:** MVP observability + SSL Full strict migration
**Sahip:** Berkay (execute) + Claude (verify)

## Pre-flight checklist

- [x] Coolify admin access
- [x] CF dashboard + API token yetkisi
- [ ] GWS trial için kredi kartı (Faz 3 için)
- [ ] VPS SSH erişimi (Faz 4 için)

## Snapshot (rollback reference)

- Root TXT (önce, 2026-04-22 12:xx UTC):
  - `"google-site-verification=dFV0OwtqNXG4904uFwnKvgEzwSbc5FVEuWDHSgw1PEY"`
  - **SPF yok** — Faz 1.3 yeni record CREATE edecek (rollback = SPF TXT'i sil, google-site-verification dokunulmaz)

## Faz 1 — Düşük risk temel

### 1.1 Coolify token rotate

- [x] Delete old COOLIFY_TOKEN in Coolify UI
- [x] Create new token `gha-autodeploy-v2` (Read+Write scope)
- [x] `gh secret set COOLIFY_TOKEN --repo berkayturk/kitaplastik --body '<token>'`
- [x] Verify: next push triggers auto-deploy (pending Faz 1 push)
- [x] Done: 2026-04-22

### 1.3 Birleşik SPF root @

- [x] CF DNS → root `@` TXT → CREATE `v=spf1 include:_spf.google.com include:amazonses.com ~all` (no pre-existing SPF)
- [x] Verify: `dig TXT kitaplastik.com +short | grep spf1` ✅ canlıda
- [ ] Verify: mail-tester score ≥ 9/10 (contact form test mail) — post-deploy check
- [x] Done: 2026-04-22

### 1.4 Stable Server Action encryption key

**Problem (2026-04-23):** Plan 5a Faz 2 deploy sonrası `/admin/products/new` POST → 404 `"Server action not found"`. Root cause: `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` unset → her build yeni rastgele key üretiyor → deploy sırasında açık olan admin session'ları invalidate oluyor. Inline server action'lar (`new/page.tsx:26-29`, `[id]/edit/page.tsx:36-43`) en hassas pattern.

Tek seferlik hard refresh semptomu geçirir; kalıcı fix = stable key.

- [ ] Generate: `openssl rand -base64 32`
- [ ] Coolify env (kitaplastik app): `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<generated>` (Available at Runtime ✅ — Nixpacks build-time'da da geçirir)
- [x] `.env.example` placeholder + doc comment (bu commit)
- [ ] Redeploy — bu deploy sırasında açık session'lar son kez invalidate olur, sonrasında stable
- [ ] Verify: deploy sonrası admin tek sekmede önce fresh load, sonra `pnpm build` tekrar tetikle (dummy commit) → açık sekmede POST hâlâ çalışıyor mu (eski ID'ler artık geçerli olmalı)
- [ ] Done: _____

## Faz 2 — Plausible

### 2.1–2.3 Runtime (Coolify deploy + DNS + SSL) — ⏸️ PENDING (next session)

- [ ] Coolify template → Plausible Community Edition deploy (Postgres + ClickHouse + app)
- [ ] CF DNS A `plausible.kitaplastik.com` → `188.245.42.178` (DNS only, grey cloud)
- [ ] Let's Encrypt HTTP-01 SSL (Coolify auto) + Plausible admin wizard (user: berkaytrk6@gmail.com + site `kitaplastik.com`)
- [ ] Coolify env (kitaplastik app): `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com` + `NEXT_PUBLIC_PLAUSIBLE_HOST=https://plausible.kitaplastik.com` (Available at Runtime ✅)
- [ ] Redeploy to pick up env → canlıda script tag'i ve realtime event akışı doğrula
- [ ] Done: _____

### 2.4 Code (Task 15–22) — ✅ commit `ce37fc4`, push 2026-04-22

- [x] `components/PlausibleScript.tsx` env-guarded `<Script>` injector
- [x] `lib/analytics/plausible.ts` type-safe wrapper (discriminated union, SSR + ad-block safe)
- [x] `tests/unit/analytics/plausible.test.ts` 4 unit test (TDD Red→Green)
- [x] `app/[locale]/layout.tsx` — `<head>` altı `<PlausibleScript />` inject
- [x] `components/home/SectorCardLink.tsx` client wrapper (SectorGrid refactor)
- [x] 4 event wired: Contact Submitted, Catalog Requested (locale), Locale Changed (to), Sector Clicked (slug)
- [x] `pnpm verify` full CI-mirror (typecheck+lint+format+60 E2E) ✅
- [x] Push + GHA CI dispatch + Coolify deploy dispatch
- [x] Done: 2026-04-22

## Faz 3 — GWS ⏸️ PENDING (next session)

### 3.1 GWS trial + domain verify

- [ ] Google Workspace Business Starter trial start (kredi kartı, berkaytrk6@gmail.com sign-up)
- [ ] Admin Console domain verify TXT → CF DNS root `@` TXT upsert
- [ ] Done: _____

### 3.2 MX + user + MFA

- [ ] CF DNS → MX records (ASPMX.L.GOOGLE.COM priority 1, ALT1/ALT2 priority 5, ALT3/ALT4 priority 10)
- [ ] Admin Console → user create `info@kitaplastik.com` + password + password manager
- [ ] MFA enforcement (admin policy → 2SV required)
- [ ] Done: _____

### 3.3 Reply-to E2E verify

- [ ] Test contact form submit → info@ inbox arrival (via Resend team mail with replyTo: user.email)
- [ ] Reply from info@ → user email delivery ✅
- [ ] mail-tester score ≥ 9/10 (birleşik SPF Faz 1.3 + GWS sender = pass)
- [ ] Done: _____

## Faz 4 — CF proxy + DNS-01 ⏸️ PENDING (RISKY, next session)

### 4.1 CF API token

- [ ] CF dashboard → My Profile → API Tokens → Create Token
- [ ] Template: Custom / Permissions: `Zone:Zone:Read` + `Zone:DNS:Edit`
- [ ] Zone Resources: Include → Specific zone → `kitaplastik.com` (least privilege)
- [ ] Token → Coolify Traefik service env `CF_DNS_API_TOKEN`
- [ ] Done: _____

### 4.2 Traefik DNS-01 config (VPS SSH)

- [ ] Backup `traefik.yml` / dynamic config
- [ ] Add `certificatesResolvers.letsencrypt.acme.dnsChallenge.provider: cloudflare`
- [ ] Coolify proxy env `CF_DNS_API_TOKEN` visible to Traefik container
- [ ] Smoke: `traefik` log `acme: use dns-01 challenge`
- [ ] Trigger cert renewal (delete acme.json or set short validity) → verify new cert issued via DNS-01
- [ ] Rollback plan: revert YAML + delete TXT records → HTTP-01 resumes (90 günlük existing cert hala geçerli, 0 downtime)
- [ ] Done: _____

### 4.3 CF A Proxied + SSL Full (strict)

- [ ] CF DNS → A `@` + `www` → turuncu (Proxied) OPEN
- [ ] CF SSL/TLS → mode **Full (strict)**
- [ ] 5dk observation window: http://kitaplastik.com 301→HTTPS, HSTS preloaded
- [ ] Rollback: orange cloud OFF + SSL mode `Full` (strict değil) → HTTP-01 resumes
- [ ] Done: _____

### 4.4 E2E smoke across 4 locales

- [ ] `curl -sI https://kitaplastik.com | grep -i cf-ray` → cf-ray header present (Proxied ✅)
- [ ] `pnpm test:e2e -- prod` 4 locale homepage + contact + catalog smoke
- [ ] Sentry test error (throw in admin page) → dashboard'da görünür
- [ ] Plausible realtime dashboard → live event akışı
- [ ] Done: _____

## Post-deploy verification (Plan 5a final gate)

- [ ] kitaplastik.com HTTPS + cf-ray header ✅
- [ ] plausible.kitaplastik.com realtime event ✅
- [ ] Sentry test error visible ✅
- [ ] info@ inbox test mail ✅
- [ ] Resend contact form delivers ✅
- [ ] mail-tester score ≥ 9/10 ✅
