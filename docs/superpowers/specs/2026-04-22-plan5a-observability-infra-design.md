# Plan 5a — Observability + Infra Config (Design Spec)

**Tarih:** 2026-04-22
**Durum:** Spec approved — implementation plan next
**Parent roadmap:** [2026-04-22-plan5-post-mvp-polish-roadmap.md](./2026-04-22-plan5-post-mvp-polish-roadmap.md) §5a
**Tahmini süre:** ~3.5-4 saat (hybrid execute: user UI/DNS + Claude code/verify)
**Execution model:** B — Hybrid (user manuel UI değişiklikleri, Claude code + runbook + step-by-step verify)

---

## 1. Scope

MVP launch sonrası "runtime görünürlük + güvenlik borcu temizle + SSL Full strict" hedefi. 6 logical task, 4 faza bölünür:

| Faz | Task'lar | Süre | Risk |
|---|---|---|---|
| **1** — Düşük risk temel | 1.1 Coolify token rotate + 1.2 Sentry SDK + 1.3 Birleşik SPF | ~30dk | Düşük, paralel |
| **2** — Plausible stack | 2.x Coolify Plausible service + script + event tracking | ~60dk | Orta, sequential |
| **3** — GWS info@ inbox | 3.x Business Starter + MX + user + reply-to test | ~45dk | Orta, sequential |
| **4** — CF proxy + DNS-01 | 4.x API token + Traefik DNS-01 + Proxied + Full strict | ~30dk | **Yüksek (risk 12/25)**, sequential |

**Scope dışı (bilinçli):**
- Sentry tracing + session replay (A config — errors only)
- Upstash Redis migration (Plan 5d)
- Plausible script proxy pattern (`/js/script.js` same-origin) — gelecek iteration, adblock atlatma
- GWS group mailbox / multi-user / custom signatures — yıl sonu
- KVKK contact email live legal text — Plan 5b

---

## 2. Kararlar (brainstorm özeti)

| Konu | Karar | Rationale |
|---|---|---|
| Plausible | Self-host Coolify (marketplace template) | CX33 8GB RAM rahat; $9/ay tasarruf; tam veri ownership |
| Sentry scope | A — Minimum (errors only, `tracesSampleRate: 0`) | MVP trafiği düşük; free tier 5K/ay rahat; 1 satır upgrade path |
| Sentry DSN | EU region (`de.sentry.io`), Coolify env yüklü | KVKK lokalizasyon bonus |
| Sentry auth token | `org:read project:read project:write project:releases` | Source map upload için minimum sufficient scope |
| GWS | A — Business Starter ($7.2/ay) | `info@` B2B TR professional presence; MFA + future multi-user |
| Execution | B — Hybrid | CF API token dışarı vermek gereksiz; paralel user+Claude; step verify |

---

## 3. Architecture

### 3.1 Yeni bağımlılıklar

```json
// package.json dependencies
"@sentry/nextjs": "^8.x"   // Next 15 + React 19 compat
```

### 3.2 Yeni dosyalar (repo)

```
instrumentation.ts                         # Next 15 server-side Sentry hook
sentry.client.config.ts                    # Browser Sentry init
sentry.server.config.ts                    # Node.js runtime Sentry init
sentry.edge.config.ts                      # Edge runtime Sentry init
app/global-error.tsx                       # Next 15 unhandled render error → Sentry
lib/analytics/plausible.ts                 # plausible() event wrapper, SSR-safe, type-safe
components/PlausibleScript.tsx             # <script> injector layout'a
docs/runbooks/plan5a-infra.md              # User-side infra runbook (GWS, CF, Coolify)
tests/unit/analytics/plausible.test.ts     # Event wrapper unit test
```

### 3.3 Değişecek dosyalar (repo)

```
package.json                               # + @sentry/nextjs
next.config.ts                             # withSentryConfig wrap + sourcemap config
.env.example                               # Plausible host env + comment update
app/[locale]/layout.tsx                    # <PlausibleScript /> ekle
components/contact/ContactForm.tsx         # plausible("Contact Submitted") event
components/catalog/CatalogForm.tsx         # plausible("Catalog Requested", {locale})
components/LocaleSwitcher.tsx              # plausible("Locale Changed", {to})
components/home/SectorGrid.tsx             # plausible("Sector Clicked", {slug}) on card click
lib/rate-limit.ts                          # console.error → Sentry.captureException
app/api/contact/route.ts                   # try/catch → Sentry.captureException
app/api/catalog/route.ts                   # try/catch → Sentry.captureException
playwright.config.ts                       # test env: Plausible domain boş, Sentry DSN boş
```

### 3.4 Env var ekleri

Yeni env var (Coolify prod + `.env.local` dev + CI placeholder — memory `feedback_local_ci_e2e_parity.md`):

```bash
# Zaten Coolify'da set (bu session'da):
NEXT_PUBLIC_SENTRY_DSN=https://c69f1d69b19e770c47eaa1e2f7dd86de@o4508012496158720.ingest.de.sentry.io/4511264609337424
SENTRY_AUTH_TOKEN=<set in Coolify>

# Zaten .env.example'da placeholder var:
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com

# YENİ (bu session eklenecek):
NEXT_PUBLIC_PLAUSIBLE_HOST=https://plausible.kitaplastik.com
```

Env-guard pattern: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` boş → `<PlausibleScript />` null render. `NEXT_PUBLIC_SENTRY_DSN` boş → Sentry init skip.

### 3.5 Yeni infra servisler (Coolify)

- **`plausible-analytics`** service (Coolify marketplace template)
  - 3 container: `plausible` (app) + `plausible_db` (Postgres) + `plausible_events_db` (ClickHouse)
  - Domain: `plausible.kitaplastik.com`
  - RAM footprint: ~730MB total (app 150 + pg 80 + ch 500)
  - Coolify otomatik volume + backup + Let's Encrypt SSL

### 3.6 Yeni DNS kayıtları (Cloudflare)

```
plausible.kitaplastik.com   A    <CX33 IP>   DNS only (Let's Encrypt cert için; Plan 5a scope'unda Proxied DEĞİL)
@                           MX 1   ASPMX.L.GOOGLE.COM
@                           MX 5   ALT1.ASPMX.L.GOOGLE.COM
@                           MX 5   ALT2.ASPMX.L.GOOGLE.COM
@                           MX 10  ALT3.ASPMX.L.GOOGLE.COM
@                           MX 10  ALT4.ASPMX.L.GOOGLE.COM
@                           TXT    v=spf1 include:_spf.google.com include:amazonses.com ~all
@                           TXT    google-site-verification=<dynamic, GWS verify için>
```

**Mevcut `send.` subdomain SPF'i DOKUNULMAZ** — Resend mail delivery path bozulmaz.

### 3.7 Design invariants

1. **Sentry `beforeSend` prod-gate:** `NODE_ENV !== "production"` → event drop; dev'de gürültü yok.
2. **Plausible proxy pattern erteleme:** same-origin `/js/script.js` proxy Plan 5a scope dışı; şu an direkt self-host domain.
3. **Event naming convention:** Plausible `"Pascal Case With Spaces"` (ör. `"Contact Submitted"`, `"Catalog Requested"`, `"Locale Changed"`, `"Sector Clicked"`); props `snake_case` JSON.
4. **CF proxy + DNS-01 safety:** Fail → mevcut 90-gün cert geçerli, 0sn downtime rollback.
5. **Runbook kalıcı artifact:** `docs/runbooks/plan5a-infra.md` session dışı referans.

---

## 4. Task dependency map

```
Faz 1 (paralel):
  Task 1.1 (Coolify token rotate)  ─── SEN ──┐
  Task 1.2 (Sentry code)            ─── BEN ─┼── paralel
  Task 1.3 (SPF root @)             ─── SEN ─┘
  → Faz 1 checkpoint commit (code only)

Faz 2 (sequential):
  Task 2.1 (Coolify Plausible deploy) ─ SEN ─► 2.2 (DNS A) ─ SEN ─► 2.3 (SSL + admin) ─ SEN ─►
  Task 2.4 (code integration + events) ─ BEN ─►
  → Faz 2 checkpoint commit (code only)

Faz 3 (sequential):
  Task 3.1 (GWS trial + verify) ─ SEN ─► 3.2 (MX + user + MFA) ─ SEN ─► 3.3 (Reply-to E2E verify) ─ SEN click ─►
  → Faz 3 checkpoint (code commit yok, runbook işaretli)

Faz 4 (sequential, RISKY):
  Task 4.1 (CF API token) ─ SEN ─► 4.2 (Traefik DNS-01) ─ SEN SSH ─► 4.3 (A Proxied + Full strict) ─ SEN ─►
  Task 4.4 (E2E smoke) ─ BEN ─►
  → Plan 5a complete
```

---

## 5. Faz detayları

Her step formatı:

```
Adım X.N: <başlık>  [SEN | BEN | PARALEL]
  Action — ne yapılacak (komut / UI / file edit)
  Verify — doğrulama (dig / curl / pnpm test / browser)
  Rollback — patlarsa geri al
```

### 5.1 Faz 1 — Düşük risk temel (~30dk)

**1.1 — Coolify token rotate** · SEN · 15dk · paralel
- **Action:** Coolify UI → Keys & Tokens → eski token Delete + yeni `gha-autodeploy-v2` (Read+Write scope) → kopyala → `gh secret set COOLIFY_TOKEN --body '<token>'`
- **Verify:** `gh secret list | grep COOLIFY_TOKEN` güncel timestamp; next push → GHA `workflow_run` → `/api/v1/deploy` → Coolify deploy log çalıştı mı
- **Rollback:** Eski silinmeden önce yeni test et; fail ise Coolify'dan üçüncü token oluştur, gh secret update

**1.2 — Sentry SDK wiring** · BEN · 25dk · paralel
- **Action (mekanik, subagent combined):**
  - `pnpm add @sentry/nextjs`
  - `instrumentation.ts` create (Next 15 pattern: `register()` → dynamic import config)
  - `sentry.client.config.ts` + `sentry.server.config.ts` + `sentry.edge.config.ts` create
  - Config: DSN from env, `tracesSampleRate: 0`, `beforeSend: NODE_ENV==="production" ? event : null`
  - `next.config.ts` → `withSentryConfig(nextConfig, {org, project, authToken, silent: true, sourcemaps: {disable: false}})`
  - `app/global-error.tsx` — Sentry.captureException hook
  - `lib/rate-limit.ts` + `app/api/contact/route.ts` + `app/api/catalog/route.ts` → `console.error` replacements
  - `.env.example` comment update (DSN var olduğunu vurgula)
  - `playwright.config.ts` webServer env: `NEXT_PUBLIC_SENTRY_DSN=""`
- **Verify:** `pnpm verify` green; lokal dev + force error → Sentry.io dashboard'da issue
- **Rollback:** atomik commit → `git revert <sha>`

**1.3 — Birleşik SPF root @** · SEN · 10dk · paralel
- **Action:** CF Dashboard → DNS → root `@` TXT kontrol; varsa edit, yoksa add → `v=spf1 include:_spf.google.com include:amazonses.com ~all`. `send.` subdomain SPF'i dokunma.
- **Verify:** `dig TXT kitaplastik.com +short | grep spf1`; contact form test mail gönder, mail-tester.com score ≥9/10
- **Rollback:** Eski TXT değerini (eğer vardıysa) session başında snapshot al, geri yaz

**Faz 1 gate:** `pnpm verify` green + Sentry test issue visible + dig SPF ok → Faz 2'ye

### 5.2 Faz 2 — Plausible stack (~60dk)

**2.1 — Coolify Plausible service deploy** · SEN · 15dk
- **Action:** Coolify → Resources → New → Service → **Plausible Analytics** official template → domain `plausible.kitaplastik.com` → env `BASE_URL=https://plausible.kitaplastik.com` → Deploy
- **Verify:** Coolify logs → `plausible` container "READY"; 3 container up
- **Rollback:** Service Delete → clean removal (volume + container)

**2.2 — DNS A record** · SEN · 5dk
- **Action:** CF DNS → add `A` `plausible` `<CX33 IP>` **DNS only** (Let's Encrypt için orange cloud OFF)
- **Verify:** `dig plausible.kitaplastik.com +short` → CX33 IP (~1-3dk propagation)
- **Rollback:** CF'de record sil

**2.3 — SSL cert wait + admin wizard** · SEN · 15dk
- **Action:** `https://plausible.kitaplastik.com` → Traefik Let's Encrypt cert (~30sn-2dk) → Plausible setup wizard → admin email + password + organization → "Add site" (domain `kitaplastik.com`, timezone `Europe/Istanbul`) → tracking script snippet kopyala
- **Verify:** Dashboard açık + site listesinde `kitaplastik.com` + snippet elinde
- **Rollback:** Admin reset docker exec veya service redeploy

**2.4 — Code integration + event tracking** · BEN · 25dk
- **Action (mekanik + logic karışık, subagent-driven):**
  - `components/PlausibleScript.tsx` — env-guarded `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` boş → null; `NEXT_PUBLIC_PLAUSIBLE_HOST` ile `<script defer data-domain=... src=.../js/script.js>`
  - `app/[locale]/layout.tsx` `<head>` → `<PlausibleScript />`
  - `lib/analytics/plausible.ts` — type-safe wrapper:
    ```typescript
    type PlausibleEvent =
      | { name: "Contact Submitted" }
      | { name: "Catalog Requested"; props: { locale: string } }
      | { name: "Locale Changed"; props: { to: string } }
      | { name: "Sector Clicked"; props: { slug: string } };

    export function trackPlausible(event: PlausibleEvent): void {
      if (typeof window === "undefined") return;
      window.plausible?.(event.name, "props" in event ? { props: event.props } : undefined);
    }
    ```
  - Event enjekte: ContactForm + CatalogForm + LocaleSwitcher + SectorGrid (card click handler)
  - `tests/unit/analytics/plausible.test.ts` — window.plausible stub'lı
  - `.env.example` + CI placeholder + Playwright webServer env
- **Verify:** `pnpm verify` tam (unit + E2E + lint + typecheck + build + audit); lokal dev + her event manuel → Plausible realtime tab
- **Rollback:** code git revert; Plausible service kalır zararsız

**Faz 2 gate:** Plausible realtime event visible + `pnpm verify` green → Faz 3'e

### 5.3 Faz 3 — GWS info@ inbox (~45dk)

**3.1 — GWS trial start + domain verify** · SEN · 20dk
- **Action:** `workspace.google.com/business/signup` → Business Starter → admin ayarla (geçici Gmail veya `berkay@kitaplastik.com` hesabına kur) → domain `kitaplastik.com` → Google TXT verification → CF DNS root TXT ekle
- **Verify:** GWS Admin Console → Domains → Verified ✅
- **Rollback:** 14 gün trial, cancel OK; TXT record CF'den sil

**3.2 — MX records + user + MFA** · SEN · 15dk
- **Action:**
  - CF DNS 5 MX record (yukarıdaki tabloya göre priority)
  - GWS Admin → Users → Add `info@kitaplastik.com` + güçlü şifre
  - Yeni user'a login + MFA (authenticator app) enforce
- **Verify:** `dig MX kitaplastik.com +short` → 5 Google MX; mail-tester.com'dan test → inbox'a düştü 2-5dk
- **Rollback:** MX'leri CF'den sil (kritik outage senaryosu) — Resend outbound etkilenmez

**3.3 — Contact reply-to chain verify (code DEĞİŞMEZ)** · SEN click · 10dk
- **Context:** `app/api/contact/route.ts:69-76` zaten doğru konfigüre: team mail `to: RESEND_TEAM_EMAIL, replyTo: input.email`. Customer mail ayrı ikinci `resend.emails.send()`. Bu Faz'da kod değişikliği yok — sadece GWS inbox'a geçen real mail'de reply-to chain çalışıyor mu end-to-end doğrula.
- **Action (sen):** Canlı contact form → test mail (kendi gmail'inden veya bir arkadaştan) gönder; "From: Berkay <test@...>" senaryosu kur
- **Verify:** (a) `info@kitaplastik.com` GWS inbox'ında test mail var; (b) mail content'te team subject görünür; (c) "Reply" aç → alıcı otomatik `test@...` (müşteri adresi), `From: info@kitaplastik.com`; (d) customer ayrıca onay mail'i aldı mı (resend 2. call)
- **Catalog kapsam dışı:** `app/api/catalog/route.ts` team notification göndermiyor (by design — catalog self-service). Team'in catalog request'i gördüğü kanal: Plausible `Catalog Requested` event + Sentry error logs. Bu Plan 5a scope'unda değiştirilmez.
- **Rollback:** Kod değişikliği yok; rollback gerekmez. Eğer verify fail ise infra (MX/DNS/GWS) debug.

**Faz 3 gate:** info@ test mail received + Resend contact working → Faz 4'e

### 5.4 Faz 4 — CF proxy + DNS-01 (~30dk, RISKY)

**4.1 — CF API token create** · SEN · 5dk
- **Action:** CF → Profile → API Tokens → Create Custom → `Zone:DNS:Edit` + `Zone:Zone:Read`, Zone Resources `Specific: kitaplastik.com`, TTL 1 year
- **Verify:** `curl -H "Authorization: Bearer <token>" https://api.cloudflare.com/client/v4/zones` → 200 JSON
- **Rollback:** Token Delete

**4.2 — Traefik DNS-01 config** · SEN SSH · 15dk
- **Action:** VPS SSH → Coolify Traefik config (`/data/coolify/proxy/dynamic/*.yaml` veya Coolify UI → Server → Proxy → Settings) → `certificatesResolvers.letsencrypt.acme.dnsChallenge.provider: cloudflare` + resolvers + `CF_DNS_API_TOKEN` env → Traefik restart
- **Verify:** Traefik logs → "DNS-01 challenge succeeded"; mevcut cert renewal forced (opsiyonel, 60gün sonra doğal renewal)
- **Rollback:** YAML HTTP-01'e geri + Traefik restart; mevcut cert 90 gün geçerli

**4.3 — CF A Proxied + SSL Full (strict)** · SEN · 5dk
- **Action:** CF DNS → `kitaplastik.com` A orange cloud ON; SSL/TLS → Overview → "Full (strict)"
- **Verify:** `curl -I https://kitaplastik.com` → 200 + `cf-ray` header; cert error yok; mixed content yok; Turnstile iframe çalışıyor
- **Rollback:** Orange cloud OFF (instant) + SSL mode "Full" (not strict)

**4.4 — E2E smoke** · BEN · 5dk
- **Action:** `pnpm test:e2e` prod URL'e veya manuel 4 locale: homepage, contact submit, catalog submit, admin login, LocaleSwitcher, sector page
- **Verify:** 0 regression; Sentry dashboard 0 new error; Plausible realtime OK
- **Rollback:** Faz 4 adımlarını sırayla geri al

**Plan 5a complete:** runbook 100% checkbox dolu → commit + session close

---

## 6. Test strategy

| Task | Unit | Integration | E2E | Manual smoke |
|---|---|---|---|---|
| 1.1 Token rotate | — | — | — | GHA deploy trigger + Coolify log |
| 1.2 Sentry SDK | `beforeSend` prod-gate | route handler catch → mock capture | — | Force error → Sentry dashboard |
| 1.3 SPF | — | — | — | `dig TXT` + mail-tester ≥9/10 |
| 2.x Plausible infra | — | — | — | Dashboard açılış + site listesi |
| 2.4 Plausible code | `plausible.ts` wrapper SSR-safe | — | Playwright `window.plausible` stub spy | 4 event form test |
| 3.x GWS | — | — | — | `dig MX` + mail-tester + gelen mail |
| 4.x CF proxy | — | — | Playwright prod URL smoke | `curl -I` cf-ray + 4 locale |

**Coverage hedefi:** Yeni kod 80%+ unit coverage; mevcut 139 unit + 60 E2E yeşil kalmalı (regresyon kabul edilmez).

---

## 7. Rollback decision tree

```
Faz 1 fail
  ├─ 1.1 → Coolify'dan yeni token, gh secret update
  ├─ 1.2 → git revert 1 commit (atomik)
  └─ 1.3 → eski TXT geri yaz (session start snapshot)
  → Faz 2-4 bağımsız, devam

Faz 2 fail
  ├─ 2.1 Coolify deploy → Service Delete + clean
  ├─ 2.2 DNS → CF'de record sil
  ├─ 2.3 SSL → 5dk bekle → Redeploy
  └─ 2.4 Code → git revert; Plausible kalır zararsız
  → Faz 3-4 bağımsız, devam

Faz 3 fail
  ├─ 3.1 Verify → TXT propagation bekle (30dk)
  ├─ 3.2 MX → dig doğrula, CF'de düzelt
  └─ 3.3 Reply-to → code revert; inbox sağlam
  → Faz 4 bağımsız, devam

Faz 4 fail (RISKY)
  ├─ 4.1 Token → Delete + retry
  ├─ 4.2 DNS-01 → HTTP-01'e geri (5dk)
  ├─ 4.3 Proxied → orange cloud OFF (instant)
  └─ 4.4 Smoke fail → önceki adımları sırayla geri
  Worst case downtime: 0 sn (CF edge instant rollback)
```

---

## 8. Phase-gate checkpoints (manuel onay)

Her fazın sonunda explicit GATE:

```
Faz 1 done ──► [pnpm verify green] + [Sentry test visible] + [SPF ok] → GATE: "Faz 2'ye geç?"
Faz 2 done ──► [Plausible realtime] + [pnpm verify green] → GATE: "Faz 3'e geç?"
Faz 3 done ──► [info@ inbox test] + [contact form OK] → GATE: "Faz 4'e geç?"
Faz 4 done ──► [HTTPS + cf-ray + 4 locale smoke] → GATE: "Plan 5a complete"
```

Her GATE user explicit confirm alacak; mekanik atla yok.

---

## 9. Success criteria (Plan 5a complete)

- [ ] `pnpm verify` all green (typecheck + lint + format + unit + audit + build + E2E)
- [ ] Sentry dashboard: lokal test error görünür + prod deploy sonrası 0 new error
- [ ] Plausible dashboard: realtime events ≥1x her biri (Contact Submitted, Catalog Requested, Locale Changed, Sector Clicked)
- [ ] Coolify auto-deploy: next push'ta workflow_run → `/api/v1/deploy` bypass çalıştı
- [ ] `dig TXT kitaplastik.com` → birleşik SPF doğru
- [ ] `dig MX kitaplastik.com` → 5 Google MX priority doğru
- [ ] `info@kitaplastik.com` inbox çalışıyor + Resend contact reply-to chain working
- [ ] `https://kitaplastik.com` Proxied (cf-ray header) + SSL "Full strict"
- [ ] `docs/runbooks/plan5a-infra.md` 100% checkbox + commit
- [ ] RESUME.md güncel (next session Plan 5d starter)
- [ ] Memory updates: yeni feedback/reference kayıtları

---

## 10. Risk profili

| Task | Prob | Impact | Score | Mitigation |
|---|---|---|---|---|
| 1.1 token rotate | 1 | 2 | 2 | 2-dk rollback |
| 1.2 Sentry code | 1 | 1 | 1 | atomik commit + verify |
| 1.3 SPF root | 2 | 3 | 6 | mail-tester mandatory |
| 2.x Plausible | 2 | 2 | 4 | Coolify service delete = clean |
| 3.x GWS | 2 | 2 | 4 | 14-day trial cancelable |
| 4.x CF proxy | 3 | 4 | **12** | Orange cloud instant off + HTTP-01 fallback |

Faz 4 kritik → en sonda. Gerekirse micro-session split mümkün.

---

## 11. Regresyon koruması

- **Sentry overhead:** `tracesSampleRate: 0` → negligible; bundle +~40KB gzipped kabul
- **Plausible async defer:** FCP/LCP impact minimum; post-deploy Lighthouse score kontrol
- **Birleşik SPF:** Resend deliverability bozulmaz (test mandatory); mevcut DMARC pass
- **CF Proxied:** WebSocket yok; Turnstile iframe + Supabase connect-src CSP'de izinli; Plan 4a redirect chain etkilenmez

---

## 12. Runbook dosya format

`docs/runbooks/plan5a-infra.md` session sonunda tam dolu artifact:

```markdown
# Plan 5a Infra Runbook

**Tarih:** 2026-04-22
**Amaç:** MVP observability + SSL Full strict
**Sahip:** Berkay (execute) + Claude (verify)

## Pre-flight
- [ ] Coolify admin access
- [ ] CF dashboard + API token yetkisi
- [ ] GWS trial için kredi kartı
- [ ] VPS SSH erişimi

## Faz 1
### 1.1 Coolify token rotate
- [ ] Action: Keys & Tokens → delete old + create `gha-autodeploy-v2`
- [ ] Action: `gh secret set COOLIFY_TOKEN --body '<token>'`
- [ ] Verify: gh secret list timestamp
- [ ] Verify: next push GHA workflow_run → deploy success
- [ ] Done: _____

### 1.3 SPF root @
- [ ] Action: CF DNS root TXT → `v=spf1 include:_spf.google.com include:amazonses.com ~all`
- [ ] Verify: `dig TXT kitaplastik.com +short | grep spf1`
- [ ] Verify: mail-tester score ≥9/10
- [ ] Done: _____

## Faz 2 — Plausible
### 2.1 Coolify service deploy
- [ ] Action: Resources → New → Service → Plausible Analytics
- [ ] Action: Domain plausible.kitaplastik.com
- [ ] Verify: 3 container READY
- [ ] Done: _____

... (tüm fazlar için)

## Post-deploy verification
- [ ] kitaplastik.com HTTPS + cf-ray ✅
- [ ] plausible.kitaplastik.com realtime event ✅
- [ ] Sentry test error visible ✅
- [ ] info@ inbox test mail ✅
- [ ] Resend contact form delivers ✅
```

Session sonunda tüm `Done: _____` satırları user tarafından doldurulmuş + git commit.

---

## 13. Implementation execution notes (Claude için)

- **Subagent mode:** Mekanik işler (SDK install, config file scaffolding, import + export ekle) **combined subagent**. Logic kararı (Plausible event enjekte yerler, Sentry filter edge case) **single-implementer + combined review** (memory `feedback_subagent_mode.md`).
- **pnpm verify her push öncesi** — memory `feedback_verify_before_push.md`
- **Atomik commit:** her faz max 1 commit; hibrit task (kod + infra) → kod commit'li, infra runbook'ta işaretli
- **Commit style:** `feat(observability):`, `feat(email):`, `docs(runbook):`, `chore(ci):`
- **Co-Authored-By footer** globally disabled (`.claude/settings.json`)
- **Plan 4d pattern referans:** 9-task subagent-driven, pragmatik mod — aynı ritim
- **Turkish regex fold:** `/i` flag İ↔i I↔ı yapmaz (test pattern'larına dikkat, memory `feedback_turkish_regex.md`) — Plausible event name'lerinde "İ" yok ama future-proof

---

## 14. Post-plan session tasks

1. Spec committed to git
2. Implementation plan yazılır (superpowers:writing-plans skill)
3. Subagent-driven execute: FAZ 1 → GATE → FAZ 2 → GATE → FAZ 3 → GATE → FAZ 4 → close
4. RESUME.md update (Plan 5d starter prompt)
5. Memory update: yeni feedback kayıtları (CF DNS-01 Traefik pattern, GWS MX set, vb.)
6. Runbook commit final state
