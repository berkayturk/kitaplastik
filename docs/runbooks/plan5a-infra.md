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

- Root TXT (önce, 2026-04-22 12:xx UTC):
  - `"google-site-verification=dFV0OwtqNXG4904uFwnKvgEzwSbc5FVEuWDHSgw1PEY"`
  - **SPF yok** — Faz 1.3 yeni record CREATE edecek (rollback = SPF TXT'i sil, google-site-verification dokunulmaz)

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
