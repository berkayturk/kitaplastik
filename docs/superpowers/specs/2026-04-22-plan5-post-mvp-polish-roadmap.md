# Plan 5 — Post-MVP Polish (multi-session roadmap)

**Tarih:** 2026-04-22
**Durum:** Roadmap — spec + plan her batch'in kendi session'ında yazılır
**Kapsam:** MVP launch sonrası operasyonel olgunluk + güvenlik borcu + admin genişletme + upgrade borcu
**Toplam tahmini:** 15-22 saat, 3-4 oturuma bölünür

---

## Scope

MVP site `https://kitaplastik.com` canlı ve tam işlevsel (Plan 1+2+3+4a+4b+4c+4d ✅). Bu roadmap, launch sonrası "%90 → %100" gap'ini kapatır:

- **Observability** — runtime hata görünürlüğü, analytics
- **Security/infra debt** — CF proxy + SSL Full (strict), chat-leak token rotate, DNS-01 migration, GWS inbox
- **Legal content** — KVKK + Gizlilik (TR B2B yasal zorunlu)
- **Admin scope genişletme** — sektör CRUD, site-wide settings, catalog request analytics
- **Upgrade borcu** — next-intl v4 (GHSA-8f24 fix), Upstash Redis multi-instance ready

**Scope DIŞI (user tarafında):** Catalog PDF placeholder'ları gerçek 4 dil PDF ile replace. İçerik hazırlığı Berkay + tasarımcı.

---

## Neden multi-session?

Tek oturum 4-6 saat. Bu roadmap 15-22 saat iş. Zorlamak 3 riski doğurur:

1. **Context yorgunluğu** → 6. saatte refactor hatası
2. **Kategori karmaşması** → infra + legal + CRUD + upgrade aynı anda düşünülünce cross-contamination
3. **Prereq bloklama** → GWS account kurulumu, CF API token, legal metin user tarafı bekliyor — paralel çalışmalı

Çözüm: 4 logical batch, her biri bağımsız bir session. Bazıları paralel user prereq topladığı sırada yapılır.

---

## Batch sırası + gerekçe

| Batch | İsim | Süre | Risk | Why this order |
|---|---|---|---|---|
| **5a** | Observability + infra config | ~4 saat | Düşük | Hızlı kazanımlar; Sentry sonraki batch'lerde regresyon görünürlüğü sağlar |
| **5d** | Upgrade borcu (next-intl v4 + Upstash) | ~3-4 saat | Orta | Sentry canlı olduktan sonra yap; yeni CRUD kodu v4 üstünde yazılsın (5c'den önce) |
| **5c** | Admin CRUD genişletme | ~5-7 saat | Orta | Stack stabilize olduktan sonra en büyük batch; 5c.1 ve 5c.2 alt-oturumlara bölünebilir |
| **5b** | Legal pages (KVKK + Gizlilik) | ~3-4 saat | Düşük | User içerik hazırlayınca herhangi bir zamanda yapılabilir; 5a-5d paralel |

**Total:** ~15-19 saat net code work + user prereq topluyor (GWS account, CF API token, legal content).

---

## 5a — Observability + infra config

**Hedef:** Runtime görünürlük + güvenlik borcu temizle + SSL Full (strict).

**Tasks:**

1. **Sentry SDK wiring** (~30dk)
   - `@sentry/nextjs` install + `instrumentation.ts` + `sentry.{client,server,edge}.config.ts`
   - `NEXT_PUBLIC_SENTRY_DSN` Coolify'da zaten var mı doğrula; yoksa Sentry project create
   - `console.error` yerine `Sentry.captureException`

2. **Plausible analytics** (~30dk)
   - Self-host (Hetzner VPS üstüne docker-compose) vs plausible.io SaaS — user kararı
   - `<head>` script Next.js layout üzerinden GDPR-compliant + cookie-free
   - Event tracking: catalog form submit, LocaleSwitcher, sector click

3. **Coolify token rotate** (~15dk)
   - Coolify → Keys & Tokens → eski sil + yeni oluştur
   - `gh secret set COOLIFY_TOKEN` (workflow_run auto-deploy çalışmaya devam etsin)
   - Memory: `feedback_coolify_autodeploy_via_gha.md` bu pattern'i zaten dokümante ediyor

4. **Google Workspace `info@kitaplastik.com`** (~45dk)
   - GWS account yoksa `workspace.google.com` Business Starter ($7.2/user/ay)
   - MX kayıtları CF DNS'e (5 rule, priority sırası önemli)
   - Admin Console → user oluştur + MFA aktif
   - Test: contact form'da reply-to `info@` olabilir mi düşün

5. **Birleşik SPF root @** (~15dk)
   - `v=spf1 include:_spf.google.com include:amazonses.com ~all` root TXT'e
   - Mevcut `send.` subdomain SPF bozulmaz — Resend mail delivery regresyon test

6. **CF proxy + DNS-01 migration** (~25dk)
   - CF API token create: Zone:DNS:Edit scope, `kitaplastik.com` zone only
   - Coolify Traefik ACME provider HTTP-01 → DNS-01 (Cloudflare): `traefik.yml` edit
   - CF A record orange cloud (Proxied) → CF SSL mode "Full (strict)"
   - Fallback plan: DNS-01 migration fail ederse HTTP-01'e geri dön (orange → DNS only)

**User prereq (oturum başlamadan önce):**
- [ ] CF API token oluştur (Zone:DNS:Edit, kitaplastik.com only) — Coolify'a gireceğiz
- [ ] GWS hesap kararı: yeni Business Starter mı yoksa mevcut bir hesap mı?
- [ ] Plausible tercihi: self-host Hetzner mı, plausible.io SaaS mı ($9/ay)
- [ ] Sentry hesap oluştur veya mevcut varsa DSN hazır

**Starter prompt (oturum başında):**
```
Plan 5a — Observability + infra config. docs/superpowers/specs/2026-04-22-plan5-post-mvp-polish-roadmap.md
"5a" bölümünü oku. 6 task (Sentry, Plausible, Coolify token, GWS, SPF, CF proxy DNS-01).
brainstorming skill ile eksik karar varsa sor, ardından spec + plan yaz, subagent-driven execute.
Prereq'ler hazır: CF API token, GWS kararı, Plausible tercihi, Sentry DSN.

ultrathink
```

---

## 5d — Upgrade borcu

**Hedef:** next-intl v4 (open redirect fix + long-term maintenance) + Upstash Redis (multi-instance ready).

**Tasks:**

1. **next-intl v3.26.5 → v4** (~2-3 saat)
   - Changelog oku (breaking changes: `createLocalizedPathnamesNavigation` deprecated, `defineRouting` API stabil ama helper adları değişti)
   - GHSA-8f24-v5vv-gm5j open redirect vuln düzelir (mevcut CSP + auth callback fix saldırı yüzeyini zaten kapatmış durumda, ama defense-in-depth)
   - Breaking pointleri tara: `i18n/routing.ts`, `i18n/navigation.ts`, `i18n/request.ts`, middleware, LocaleSwitcher, alternates
   - Tam regresyon: 139 unit + 60 E2E yeşil kalmalı
   - Plan 4d'deki pathnames config + `getPathname({href,locale})` v4 API'siyle uyumlu mu teyit

2. **Upstash Redis rate limit** (~1-1.5 saat)
   - Mevcut `lib/rate-limit.ts` in-memory Map. Multi-instance deploy'da (Coolify scale-out) her container kendi map'i tutar → rate limit bypass riski
   - `@upstash/ratelimit` + `@upstash/redis` install
   - Upstash free tier Redis DB create
   - env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Coolify + .env.local + CI placeholder
   - Migrate: contact, rfq (yok artık), catalog limiters
   - Unit test mock + E2E regression

**User prereq:**
- [ ] Upstash hesap + Redis DB create (free tier 10K req/gün yeterli başlangıç için)
- [ ] REST URL + token değerleri hazır

**Starter prompt:**
```
Plan 5d — Upgrade borcu: next-intl v3→v4 + Upstash Redis. Roadmap dosyası "5d" bölümü.
next-intl changelog + Upstash SDK docs research'ten başla (context7 MCP + WebFetch).
Spec yaz, plan yaz, subagent-driven execute. next-intl v4 migration TDD kritik — pathnames
config + alternates + LocaleSwitcher davranışları unit test + E2E ile assert et.

ultrathink
```

---

## 5c — Admin CRUD genişletme

**Hedef:** Hard-coded sektör content'i admin'den yönetilsin + site-wide settings + catalog analytics.

**Alt-oturumlar (gerekirse 5c.1 ve 5c.2'ye bölünür):**

### 5c.1 — `/admin/sectors` CRUD (~3 saat)

- Migration `sectors` table:
  ```sql
  slug text PK, name jsonb (tr/en/ru/ar), description jsonb,
  hero_spec text, image_path text, order_index int, is_active bool,
  created_at, updated_at, soft-delete deleted_at
  ```
- Mevcut static content seed: `messages/*` + `lib/sectors/*` → migration data
- Admin pages: list + create + edit + delete + restore (Plan 4b pattern'i ile uyumlu)
- Public sector page dynamic hale gel: `app/[locale]/sectors/[slug]/page.tsx` table'dan çekilsin (mevcut 3 hard-coded page + dynamic fallback)
- Storage bucket `sector-images` + RLS (is_admin write, anon read)
- E2E: sector create → public görünür, deactivate → public gizli

### 5c.2 — `/admin/settings/company` + catalog request analytics (~3 saat)

- Migration `site_settings` singleton (veya `key/value` pattern):
  ```sql
  id bool PK DEFAULT true CHECK (id = true), -- singleton enforce
  company_name text, company_address jsonb (4 locale),
  phone text, email text, social_links jsonb, kvkk_contact jsonb,
  updated_at
  ```
- Admin form: tek settings page (company tab + social tab)
- Footer + Contact page bu tabloyu okusun (mevcut `messages/*/site.json` yerine)
- Catalog request analytics dashboard (`app/admin/catalog-requests/page.tsx` enhance):
  - Per-locale grouped count (last 30 gün)
  - Daily trend chart (recharts basit line chart)
  - CSV export

**User prereq:**
- [ ] Mevcut sektör görselleri (cam yıkama, kapak, tekstil) yüksek çözünürlük — admin'e yükleyeceğiz
- [ ] Şirket bilgileri tam: adres, telefon, sosyal medya URL'leri

**Starter prompt (5c.1 için):**
```
Plan 5c.1 — /admin/sectors CRUD. Roadmap "5c.1" bölümü. Plan 4b `/admin/products` pattern'i
birebir örnek. Migration + RLS + seed + admin pages + public dynamic route + Storage bucket.
Brainstorm skill ile belirsiz karar topla (slug formatı, image order, hero spec ne olacak
her sektör için, yeni sektör eklenince anasayfa nav güncellemesi otomatik mi?),
ardından spec + plan + subagent-driven execute.

ultrathink
```

---

## 5b — Legal pages

**Hedef:** KVKK Aydınlatma Metni + Gizlilik Politikası + Çerez Politikası (birleşik) — 4 dilde.

**Tasks:**

1. **KVKK Aydınlatma Metni** `app/[locale]/kvkk/page.tsx`
   - Veri sorumlusu kimliği, VERBIS kayıt bilgisi
   - Veri işleme amaçları (contact form, catalog request)
   - Aktarım + hukuki sebep
   - İlgili kişi hakları (KVKK md. 11)

2. **Gizlilik Politikası** `app/[locale]/gizlilik/page.tsx`
   - Çerez tablosu (Turnstile, analytics, session)
   - Üçüncü taraf servisler (Supabase, Resend, Cloudflare, Plausible)
   - Veri saklama süresi
   - İletişim bilgisi (data.privacy@kitaplastik.com veya info@)

3. 4 dil çeviri (`messages/{tr,en,ru,ar}/legal.json`)

4. Footer link'ler + sitemap + hreflang entegrasyonu

5. Canonical URL pattern (pathnames config'e ekle): `/kvkk`, `/privacy`, `/cookies`
   - TR: `/kvkk`, `/gizlilik`, `/cerezler`
   - EN: `/privacy-notice`, `/privacy-policy`, `/cookies`
   - RU + AR: uygun native slug

6. E2E smoke + accessibility audit (uzun prose + heading hierarchy)

**User prereq (EN ÖNEMLİ, oturum başlamadan önce):**
- [ ] Tüzel kişilik tam ünvan: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti." doğru mu?
- [ ] VERBIS kayıt numarası (varsa)
- [ ] Mersis no
- [ ] Veri sorumlusu/DPO iletişim: email + telefon
- [ ] Hukuk müşaviri onayı (şiddetle önerilir — placeholder template kullanıp sonra review yerine, önce legal review aldıktan sonra publish et)

**Starter prompt:**
```
Plan 5b — KVKK + Gizlilik Politikası + Çerez Politikası, 4 dilde. Roadmap "5b" bölümü.
Legal text hazır: [user paste etsin ya da dosya yolu verir].
TR legal text base, EN/RU/AR çeviri Claude session'da doğrudan (script yok, Plan 2 pattern).
pathnames config'e 3 yeni canonical ekle, native slug'lar belirle (brainstorm bu kararları).
Subagent-driven execute.

ultrathink
```

---

## Tamamlandığında proje durumu

Plan 5 bitince site:

- **Observability:** Sentry + Plausible canlı, runtime hata + kullanıcı davranışı görünür
- **Security:** CF proxy + SSL Full (strict), token'lar temiz, GHSA-8f24 fix, multi-instance rate limit
- **Legal:** KVKK/Gizlilik 4 dilde, B2B TR yasal uyumlu
- **Admin:** Sektör + site settings + catalog analytics admin'den yönetilir
- **Stack:** next-intl v4, Upstash Redis, Node 22, Next 15, TS strict

MVP %100 sayılır. Next iterations: growth/product work (ürün katalog genişletme, yeni sektör, yeni dil, B2B quote engine, vb.).

---

## Rollback + safety

- **5a CF proxy fail:** `traefik.yml` HTTP-01'e geri al + CF A record DNS only. SSL kesintisi olmaz (mevcut cert 90 gün geçerli)
- **5d next-intl v4 regresyon:** feature branch'te yap, E2E full suite yeşil olana kadar main'e merge etme. 10 commit öncesine git reset mümkün ama pathnames config değişirse user-facing URL'ler broken olur; dikkat.
- **5c admin CRUD migration:** `20260423*` + rollback SQL (`DROP TABLE sectors` vb.) hazırda olsun. Prod migration apply öncesi Supabase dashboard'dan manuel backup al.
- **5b legal pages:** Soft-launch — footer link'i placeholder "Yakında" ile başla, legal review bitince gerçek sayfayı publish et. Kullanıcı yanlış legal text'e maruz kalmasın.

---

## Not to self (Claude sıradaki session'da)

- Her batch kendi spec + plan dosyasını session başında üretir — bu roadmap yol haritası, detaylı task listesi değil
- User prereq checklist'i session başında mutlaka doğrula
- Plan 4d pattern'i referans: 9 task subagent-driven, pragmatik mod (mekanik combined, logic single-implementer + combined review)
- `pnpm verify` her push öncesi (memory: `feedback_verify_before_push.md`)
- Commit style: `feat(area):`, `fix(area):`, `docs(area):`, `test(area):`, `chore(area):`
- Co-Authored-By footer globally disabled (`.claude/settings.json`)
