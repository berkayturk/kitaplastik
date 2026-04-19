# Resume Guide — Kıta Plastik MVP

> Bu dosya context-clear sonrası yeni Claude session'ın hızlıca devam etmesi için. **Read this first.**

## Proje Özeti

- **Şirket:** Kıta Plastik ve Tekstil San. Tic. Ltd. Şti. (Bursa, 1989'dan beri)
- **Hedef:** 4-dilli (TR/EN/RU/AR) hibrit B2B kurumsal site (vitrin + RFQ funnel + admin paneli)
- **Sektörler:** Cam yıkama · Kapak · Tekstil · Custom mühendislik
- **Repo:** https://github.com/berkayturk/kitaplastik (public, main branch, ~65 commit)
- **Domain:** kitaplastik.com (henüz Vercel'e bağlanmadı)
- **Working dir:** `/Users/bt/claude/kitaplastik`

## Planlama Dökümanları

| Dosya | Durum |
|---|---|
| `docs/superpowers/specs/2026-04-16-kitaplastik-website-design.md` | ✅ Onaylanmış spec (1081 satır, 20 bölüm) |
| `docs/superpowers/plans/2026-04-17-faz1-plan1-foundation.md` | ✅ Plan 1 tamamlandı (28 commit) |
| `docs/superpowers/plans/2026-04-17-faz1-plan2-i18n-3d-pages.md` | ✅ Plan 2 tamamlandı (35 task, ~38 commit) |

## Plan 1 ✅ — Foundation + Design System + Anasayfa İskelet

- Next.js 15.5.15 + React 19 + TS 5.9.3 strict + Tailwind 4.2.2 + shadcn/ui 4.3.0
- Industrial Precision design tokens, self-hosted Inter + JetBrains Mono
- Layout: Container + Header + Footer · Anasayfa: Hero + SectorGrid · 404 sayfası
- Supabase client/server + zod env validation
- Vitest + Playwright + ESLint + Prettier + Husky + lint-staged + GitHub Actions CI
- Vercel config, README

## Plan 2 ✅ — i18n + 3D Hero + Referanslar + 12 Public Sayfa

- **i18n:** next-intl 3.26.5, `[locale]` route segment, middleware, 4 dil (TR/EN/RU/AR, AR RTL), LocaleSwitcher, hreflang sitemap (48 URL), glossary.json (50+ teknik terim)
- **3D Hero:** R3F v9 + custom GLSL shader (perlin + flow + sparkle), lazy-loaded, prefers-reduced-motion/saveData/WebGL fallback → HeroFallback CSS gradient
- **Referanslar:** anasayfada above-the-fold ReferencesStrip (8 müşteri logosu, fold içinde görünür) + `/referanslar` detay sayfası
- **12 public sayfa × 4 dil = 48 statik route:** anasayfa, sektörler hub + 3 alt (cam-yikama, kapak, tekstil), urunler (placeholder notice), muhendislik, atolye, kalite, hakkimizda, iletisim, referanslar
- **Cilalı KitaLogo** inline SVG (placeholder değil)
- **Test:** 41 unit (Vitest) + 62 E2E (Playwright), CI yeşil

**Önemli runtime/version kararları:**
- next-intl **3.26.5** (v4 değil — v4 API breaking changes, plan v3'te kaldı). `hasLocale` v4-only → v3'te inline `isValidLocale` type guard.
- R3F **v9.6** (v8 React 19 ile uyumsuz). `@react-three/fiber@^9.6`, `drei@^10.7`, `three@^0.184`. Drei şu an kullanılmıyor — Plan 3'te veya sonra kaldırılabilir (~50-80 KB bundle tasarrufu).
- Hero `min-h-[72dvh]` (ReferencesStrip fold içinde görünür).
- `vitest.setup.ts`'ye matchMedia stub eklendi (useShouldReduceMotion için).

## Plan 3 ✅ — RFQ + Supabase + Admin Paneli (~35 commit, 2026-04-18 oturumu)

Kod tamamlandı. İki küçük manuel adım kullanıcıya bırakıldı (bkz. "Release — kullanıcı görevleri" alt başlığı).

**Kod özet:**
- **Supabase:** 4 migration (tablolar, RLS + `is_admin`/`is_admin_role` helpers, storage buckets, seed). `supabase/config.toml` + `supabase/README.md` eklendi. Hand-written `lib/supabase/types.ts` (uzak proje link olunca `supabase gen types` ile override edilecek).
- **Env:** `lib/env.ts` artık `env` (PublicEnv) + `serverEnv` (ServerEnv) iki ayrı export — browser bundle leak'i önleniyor. Yeni alanlar: `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_*`, `RESEND_*`. Ayrı iki export implementer adaptasyonu; plan `env.X` yazmıştı.
- **Primitives:** `lib/rate-limit.ts` (in-memory sliding-window), `lib/turnstile.ts` (siteverify), `lib/audit.ts` (error-swallowing), `lib/email/client.ts` (Resend), 4 template (contact/RFQ × team/customer, 4 dil customer).
- **Validation:** `lib/validation/contact.ts`, `lib/validation/rfq.ts` (zod v4, `customRfqSchema` + `standartRfqSchema`).
- **References migration:** `lib/references/data.ts` sync mock → async Supabase `clients` fetch. Interface sabit; `ReferencesStrip` artık async. Test file (`tests/unit/components/ReferencesStrip.test.tsx`) async pattern ile güncellendi; legacy `tests/unit/lib/references.test.ts` silindi.
- **Middleware:** `lib/supabase/middleware.ts` (session refresh) + root `middleware.ts` next-intl + Supabase + `/admin` guard kompozisyonu. `isAdminPublicPath` `/admin/login` ve `/admin/auth/callback` hariç.
- **Contact migration:** `/api/contact/route.ts` + `ContactForm.tsx` mailto → fetch. `TurnstileWidget.tsx` paylaşıldı (`components/rfq/`). i18n'den `fallbackNotice` kaldırıldı, 5 yeni key eklendi (4 dil).
- **RFQ:** `/api/rfq/route.ts` (kind discriminator), `FileUploader` (client-side Storage, UUID rename, 5×10MB), `CustomRfqForm` + `StandartRfqForm` + `ProductPicker` (free-text MVP), `/teklif-iste/*` 3 sayfa, `rfq.json` 4 dil, Header nav link + `nav.json` 4 dil.
- **Admin:** `lib/admin/auth.ts` (`requireAdmin`, `requireAdminRole`), `/admin/login` + server action, `/admin/auth/callback` route, `/admin` TR-only layout + Shell, `/admin/inbox` list + `/admin/inbox/[id]` detail (status change, notes, signed URL ekler), `/admin/ayarlar/bildirimler` CRUD. `/api/rfq` dinamik recipient routing (fallback `serverEnv.RESEND_TEAM_EMAIL`).
- **E2E:** 4 Playwright spec (contact, RFQ custom, RFQ standart, admin login gate); admin authenticated flow `test.skip` (Plan 4'te programatik login hook).
- **CI:** build + E2E job'larına Plan 3 env placeholder'ları eklendi (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, vs.).

**Test özeti:** 73 unit test geçiyor (22 dosya). Typecheck temiz. Build temiz; `/admin`, `/admin/login`, `/admin/auth/callback`, `/admin/inbox`, `/admin/inbox/[id]`, `/admin/ayarlar/bildirimler`, `/api/contact`, `/api/rfq`, `/[locale]/teklif-iste(/ozel-uretim|/standart)` route'ları derlendi.

**Önemli kararlar & caveats:**
- Rate limit in-memory (MVP); Vercel multi-instance'ta kısmi → Plan 4 Upstash Redis upgrade.
- Admin TR-only (`NextIntlClientProvider` manuel TR locale).
- File upload client-side direct Storage; path validation yok (Turnstile + rate limit + audit ile katmanlı).
- `products`/`sectors` tablolar Plan 3'te **oluşturuldu ama CRUD yok** (Plan 4). Şu an public `/urunler` placeholder, içerik Supabase Studio ile manuel eklenebilir.
- Standart RFQ `ProductPicker` free-text MVP; Plan 4'te catalog-backed picker.
- Login page `useSearchParams` → `<Suspense fallback={null}>` wrap edildi (Next 15 static rendering gereksinimi).
- `tests/e2e/*` ve `tests/unit/components/ReferencesStrip.test.tsx` güncellendi/yeniden yazıldı.

### Release — kullanıcı görevleri (manuel)

1. **Supabase uzak proje oluştur** (Plan Task 6):
   - dashboard.supabase.com → new project (region `eu-central-1`, kuvvetli şifre → 1Password)
   - `pnpm exec supabase login`
   - `pnpm exec supabase link --project-ref <ref>`
   - `pnpm exec supabase db push` (4 migration → remote)
   - `pnpm exec supabase gen types typescript --linked > lib/supabase/types.ts` (hand-written dosyayı override eder)
   - `.env.local`'e gerçek `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` yaz
2. **İlk admin kullanıcı** (Plan Task 26):
   - Supabase Dashboard → Authentication → Users → `berkayturk6@gmail.com` ekle (auto-confirm)
   - UUID kopyala, `pnpm exec supabase db psql --linked -c "insert into public.admin_users (user_id, role, display_name) values ('<uuid>', 'admin', 'Berkay') on conflict (user_id) do update set role='admin';"`
   - Dashboard → Auth → Email provider **enable**, Sign ups **disable**
   - Email templates → Magic Link template → `{{ .SiteURL }}/admin/auth/callback?code={{ .TokenHash }}&type=magiclink`
3. **Cloudflare Turnstile prod key'leri** (Plan Task 39):
   - cloudflare.com → Turnstile → new site (domain: kitaplastik.com)
   - Site key + secret key
4. **Resend domain verify** (Plan Task 39):
   - resend.com → Domains → kitaplastik.com (DNS kayıtlarını DNS'e ekle)
   - API key oluştur
5. **Vercel env** (Plan Task 39): Production + Preview'a tüm env'leri gir (gerçek Supabase + Turnstile + Resend değerleri, `RESEND_FROM_EMAIL=noreply@kitaplastik.com`, `RESEND_TEAM_EMAIL=info@kitaplastik.com`).
6. **Supabase Auth Site URL & Redirect URLs:** Settings → Auth → Site URL: `https://kitaplastik.com`; Redirect URLs: `https://kitaplastik.com/admin/auth/callback` + Vercel preview pattern.
7. **Manuel smoke** (Plan Task 41): dev veya preview'da 4 akışı gerçek e-posta ile test et — contact form submit, custom RFQ + file upload, standart RFQ, admin magic link → inbox → status update.

## Redesign: Light "Refined Industrial" ✅ (2026-04-18 aynı oturum, feature branch `redesign/light-refined`)

Dark "Industrial Precision" palette terk edildi. `v0.2-dark-industrial` tag'inde son görüntüsü mevcut.

- **Phase 0** — 5-site WebFetch araştırması (`.planning/research/redesign-inspiration.md`): Hermle AG production template olarak belirlendi; "specificity over emotion" kopya patterni; hero strategy flip (photo-first, Spline ikincil progressive enhancement).
- **Phase 1** — `app/globals.css` v2: 22 token (bg-primary #FAFAF7 warm paper, ink #0A0F1E, cobalt #1E4DD8, jade #0FA37F). Self-hosted `next/font/local` → `next/font/google` variable fonts: **Fraunces (display, opsz axis)** + **Hanken Grotesk (body)** + **JetBrains Mono (mono)**. `/design-debug` internal render-test sayfası (`noindex,nofollow`; 10 bölüm). Cyrillic sınırı: Fraunces next/font types'ta yok → RU locale display serif system fallback.
- **Phase 2** — 8 token-driven primitive (`components/ui/`): Button (4 variant × 3 size + asChild + loading spinner), Badge, Card + CardEyebrow/Title/Body/Footer, Divider, Field helpers + TextField + TextArea + SelectField, Checkbox. Modal/FileUploader/Dropdown/Radio Phase 5+'da.
- **Phase 3** — Shell yeniden tasarımı: `<SiteBackground />` FBM canvas silindi, yerine Tier 1 static CSS mesh gradient + 2% SVG grain (body::before/::after). Header 72px bg-primary hairline bottom; Footer bg-ink 4 kolon Fraunces başlıklar; LocaleSwitcher mono code dot-separated (TR · EN · RU · AR) cobalt underline on active; WhatsAppFab hover:scale kaldırıldı.
- **Phase 4** — Hero Fraunces serif headline + italic cobalt accent + 4-KPI mono tabular figure stack (36 yıl · 3 sektör · 4 dil · ±0.02 mm). SectorGrid `<Card interactive>` ile numbered eyebrow + spec row. ReferencesStrip bg-subtle + grayscale logos + hover-to-color.
- **Phase 5** — `/admin/login` Card + TextField + Button primitive ile; admin `Shell` bg-secondary main, Fraunces lockup, cobalt active nav, mono user strip.
- **Phase 7 cleanup** — `components/three/*` tamamen silindi (6 dosya), `public/fonts/*.woff2` (self-hosted Inter + JBMono) silindi, R3F + drei + three + @types/three pnpm'den kaldırıldı. Bundle `-3 major` (~300KB).

**Regex feedback validated** — Hero test'inde Turkish `İ` için regex `/i` flag kullanılamadığından pattern'e direkt `İ` yazıldı (memory feedback).

**`/design-debug` route hâlâ korunuyor** — internal tool; noindex; ileride istenirse silinir.

**Kalan iş — Plan 4 (backend CRUD + SEO + Analytics) ayrı çalışma:**
- `/admin/urunler` + `/admin/sektorler` CRUD (4-dil tab, görsel upload)
- `/admin/ayarlar/sirket` + `/admin/ayarlar/sablonlar`
- Müşteri RFQ tracking sayfası `/[locale]/rfq/[uuid]/`
- Upstash Redis rate limit upgrade
- SEO: Schema.org Organization/Product, OG image generator
- Plausible analytics, Sentry, Lighthouse audit
- Admin authenticated E2E programatik login hook
- (İsteğe bağlı) Spline frosted polymer cap Tier 2 hero object
- (İsteğe bağlı) Fraunces Cyrillic için Noto Serif / IBM Plex Serif RU fallback

## Stratejik Kararlar (sürdürülecek)

- **Pragmatic batch mode subagent-driven-development:**
  - Mekanik task'lar (config, install, static content): tek implementer batch (birden fazla task) + self-review by controller
  - Medium task'lar (components, pages, integration): tek implementer + combined review (tek reviewer subagent)
  - Logic-heavy task'lar (TDD component, shader, migration): tam 3-stage review (implementer + spec reviewer + quality reviewer)
  - Plan 2'de 35 task ~8 subagent dispatch ile tamamlandı (batch'ler verimli oldu)
- **Her task için:** Context7/latest docs check + best practices + security awareness + TDD discipline + conventional commits
- **Türkçe regex caveat:** JS `/i` flag `İ ↔ i`, `I ↔ ı` case-fold YAPAMAZ. Pattern ve text aynı case'de tutun.
- **Design tokens:** Industrial Precision palette → `bg-bg-primary`, `text-text-primary`, `text-text-secondary`, `border-[var(--color-border-subtle-dark)]`, `bg-[var(--color-accent-red)]`. Generic Tailwind isimleri (`bg-background`, `text-foreground`) KULLANMA.
- **Plan sapmaları:** Implementer plan'dan saparsa (örn. version pin, framework constraint), implementer kendi raporunda flag eder; orchestrator plan dokümanını veya memory'yi günceller.

## Post-Plan-2 Polish (2026-04-18 oturumu)

Plan 2 ve Plan 3 arasında yapıldı:
- **i18n sızıntıları temizlendi:** Footer legal name satırı, Header home aria-label, LocaleSwitcher aria-label, `[locale]/not-found.tsx`, RU/AR iletisim adresleri → tümü 4 dilde
- **Yeni anahtarlar:** `common.footer.legalName`, `nav.home`, `pages.contact.details.cellPhoneLabel`, `pages.contact.whatsapp.*`, `pages.contact.telegram.*`, `pages.contact.form.*`
- **İletişim sayfası komple yeniden yazıldı** (`/iletisim`):
  - Kartvizitten gerçek şirket bilgileri → `lib/company.ts` (single source): adres, sabit tel, cep tel, faks, 2 e-posta, web, WhatsApp, Telegram
  - Layout: 2-col split (5/12 + 7/12), scroll-free tek viewport
  - Sol: 2 messaging kart (WA + TG, yan yana her ekranda) + kompakt ikonlu info listesi (renkli paletle: red/emerald/violet/blue/amber/cyan)
  - Sağ: Compact form (`components/contact/ContactForm.tsx`, mailto tabanlı, Ad+Firma/E-posta+Tel 2-col rows, textarea rows=4)
  - Linkler: 📍 Google Maps, 📞 tel: (phone + cellPhone slash-separated tek satırda), ✉️ mailto:
  - WhatsApp FAB tüm sayfalarda (`components/contact/WhatsAppFab.tsx`, layout'a eklendi, RTL'de sol alt)
  - WhatsApp handle: `905322371324`, Telegram handle: `kitaplastik` (placeholder — gerçek değerlerle güncellenecek)
- **Hero title değişti:** "Projenizi konuşalım" → "Bizimle iletişime geçin" (4 dil)

**Önemli:** Contact form şu an mailto tabanlı — Plan 3'te Resend/SMTP API endpoint'e upgrade olacak. `COMPANY.email.primary = info@kitaplastik.com` form destination.

## Konum: Redesign ✅ + Ambient 3D ✅ + LocaleSwitcher fix ✅ (2026-04-18 son oturum)

**Nerede kaldık:**

- Light Refined Industrial redesign tamamen merge edildi main'e (52 commit origin/main önünde, push yok).
- Tag: `v0.2-dark-industrial` (rollback için dark snapshot).
- 72/72 unit test ✓, typecheck temiz, `/design-debug` canlı internal tool olarak duruyor.
- Ambient 3D şu an 3 orb (cobalt/jade/amber wash) 60sn/tur, görünür ama sakin.
- LocaleSwitcher plain `<a>` ile full-page navigation — root path bug fix.

**Kullanıcının test etmediği / henüz bakmadığı şeyler (yeni session'da geri dönebilir):**

- Gerçek tarayıcıda mobile + tablet + desktop breakpoint'leri
- 4 locale (TR/EN/RU/AR) tam walk-through, özellikle AR RTL
- Tab/keyboard navigation focus ring'leri
- `prefers-reduced-motion` açık → ambient canvas mount olmuyor fallback çalışıyor mu
- `pnpm build` (production build) — lokalde henüz çalıştırılmadı
- `pnpm exec playwright test` — Plan 3 E2E spec'leri redesign sonrası regression var mı belirsiz (text/selector değişmiş olabilir)

**Şu an bloklayan (gerçek creds lazım):** contact submit, RFQ submit, file upload, admin magic-link, admin inbox gerçek data, ReferencesStrip logoları Supabase fetch.

## 2026-04-19 — Config session follow-up (bu oturum)

Admin login aşaması tamamlandı, 5 commit atıldı, branch origin'den 58 commit önde (push yok).

**Yapıldı:**

- **Supabase uzak proje** (Release task 1) — `kitaplastik-prod` ref `sthwxiqtpafyjbevzkiq`, eu-central-1, **free tier**. 4 orijinal migration + 2 identity fix migration uygulandı. TS tipleri `lib/supabase/types.ts` regen edildi. Credentials `.env.local`'da. Dashboard: https://supabase.com/dashboard/project/sthwxiqtpafyjbevzkiq
- **İlk admin kullanıcı** (Release task 2) — `berkaytrk6@gmail.com` (u SUZ — doğru adres; eski RESUME `berkayturk6` yazıyordu, hatalıydı). Admin_users satırı seeded, identity.email_verified=true. Password login'e geçildi (aşağı bkz).
- **Auth config** (Release task 6) — site_url, uri_allow_list (localhost + `*.vercel.app` + prod), disable_signup=true, magic link template custom. Password flow bunlarla çakışmıyor.

**Magic link → password login switch:**

- Sebep: Supabase built-in SMTP free tier 2 mail/saat limit, `admin.createUser({email_confirm:true})` SDK quirk (`identities.identity_data.email_verified` false kalıyor), GoTrue 2.163+ bu flag false ise OTP reddediyor. Tek-kullanıcı admin için password daha pratik.
- Yeni flow: `app/admin/login/{page.tsx,actions.ts}` — `signInWithPassword` + server-side `redirect('/admin/inbox')`. `app/admin/auth/callback/route.ts` hem PKCE `code` hem non-PKCE `token_hash+type` handle ediyor (unused fallback).
- Credentials `.env.local` → `ADMIN_EMAIL`, `ADMIN_PASSWORD` (sadece referans, hash Supabase'de).
- Admin login test edildi, `/admin/inbox` + `/admin/ayarlar/bildirimler` çalışıyor.

**Idempotent Supabase fix migration'ları (proje reset edilse de doğru duruma geliyor):**

- `20260419080000_fix_email_identity_verified.sql` — `identity.email_verified` false satırlarını true yapar.
- `20260419150000_fix_admin_email_and_identity.sql` — `identity.email`'i `users.email` ile sync eder + `notification_recipients` typo fix.

**Diğer fix'ler:**

- `components/layout/KitaLogo.tsx` — SVG `direction="ltr"` (AR RTL'de Latin text flip fix).
- `components/admin/InboxTable.tsx` — empty state'te de kolon başlıkları görünür.
- `messages/{tr,en,ru,ar}/nav.json` + `components/layout/Footer.tsx` — silinmiş `muhendislik/atolye/kalite` ref'leri temizlendi.
- `app/admin/login/actions.ts` — error code-specific Türkçe mesajlar (429 rate limit, invalid_credentials, vb.).

**Test edilmeyen / senin manuel yapacakların:**

- Public site walkthrough (4 locale, AR RTL, responsive, ambient 3D, keyboard nav) — önceki oturum listesi geçerli.
- Release task 3 Cloudflare Turnstile (bloklar contact/RFQ submit'i)
- Release task 4 Resend domain verify (bloklar tüm email gönderimini, Supabase built-in SMTP de zaten yetmez)
- Release task 5 **host seçimi + deploy (Vercel KULLANILMAYACAK — güven sorunu; alternatifler: Cloudflare Pages, self-host VPS, Netlify vs.)** + env transfer
- Release task 7 Manuel smoke (contact form, custom RFQ + file upload, standart RFQ)

## Yeni Session Başlangıç Komutları

### Config devamı (kısa — kalan manuel task'ları koordine etmek için)

```
docs/superpowers/RESUME.md oku — "2026-04-19 follow-up" bölümü güncel. Admin
login çalışıyor, branch pushed. Kalan Release task'ları: Turnstile (3),
Resend (4), host seçimi + deploy (5 — VERCEL KULLANILMAYACAK, güven sorunu),
smoke test (7). Turnstile + Resend hesap kurma benim (berkay) manuel işim,
sen talimat koordine et. Host seçimini birlikte yapıyoruz — top picks:
Cloudflare Pages (Turnstile zaten CF), self-host VPS (Hetzner + Coolify),
Netlify. Önce ben tercih/constraint'lerimi söylerim, sen 2-3 seçeneği
karşılaştır, birlikte karar veririz.

Başlamak için: `pnpm dev` zaten çalışıyor (/tmp/kitaplastik-dev.log) veya
yoksa başlat. Önce `git log origin/main..HEAD --oneline | head -3` ile branch
durumuna bak (push sonrası 0 olmalı). Turnstile ile başla — Cloudflare
hesabı zaten var mı sor.

ultrathink
```

### Plan 4 planlama (büyük — admin CRUD + SEO + analytics için)

```
docs/superpowers/RESUME.md oku. Plan 1-3 + redesign + config aşaması
tamamlandı. Plan 4'ü `superpowers:writing-plans` skill'i ile planla:
`docs/superpowers/plans/<date>-faz1-plan4-admin-crud-seo-analytics.md`.

Kapsam:
- `/admin/urunler` + `/admin/sektorler` CRUD (4-dil tab, görsel upload)
- `/admin/ayarlar/sirket` + `/admin/ayarlar/sablonlar`
- Müşteri RFQ tracking sayfası `/[locale]/rfq/[uuid]/`
- Upstash Redis rate limit upgrade (in-memory → distributed)
- SEO ileri: Schema.org Organization/Product, OG image generator
- Plausible analytics
- Sentry error tracking
- Admin authenticated E2E programatik login hook
- Opsiyonel: Spline frosted polymer cap Tier 2 hero object
- Opsiyonel: Fraunces Cyrillic için Noto Serif / IBM Plex Serif RU fallback

Önce mevcut kod haritasını çıkar (admin layout pattern, RLS, middleware),
sonra writing-plans brainstorm'u — ben cevaplayacağım.

ultrathink
```

## Ortam Notları

- Node 22.22.2 + pnpm 9.15.9 + corepack aktif
- Yerel git: `user.email=berkaytrk6@gmail.com user.name=Berkay` (repo-local)
- `.env.local` lokalde placeholder değerlerle (Plan 3 başında Supabase project oluşturulup gerçek değerler yazılacak)
- `.env.example` güncel — `ANTHROPIC_API_KEY` satırı KALDIRILDI (Plan 2'de çeviriler Claude session'da elle yapıldı, script/CI yok)
- GitHub Actions CI: yeşil (https://github.com/berkayturk/kitaplastik/actions)
- Vercel deploy: henüz yapılmadı

## Dev Server

Lokalde çalıştırma:
```bash
pnpm dev                 # Turbopack
# http://localhost:3000 → 307 /tr
# Diller: /tr, /en, /ru, /ar
# Her dilde 12 route
```

## Memory Hatırlatması

Yeni session açıldığında memory dizini boş — burayı oku, projeye ait kararları öğren. Memory'de `project_kitaplastik.md` + `feedback_subagent_mode.md` + `feedback_turkish_regex.md` dosyaları var.
