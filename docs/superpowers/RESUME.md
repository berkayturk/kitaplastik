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

## 2026-04-20 — İlk production deploy ✅

**Site CANLI:** `https://kitaplastik.com` + `https://www.kitaplastik.com` (307 → `/tr`, HTTP/2 + h3, Let's Encrypt SSL).

- **Domain:** CF Registrar, Berkay hesabında (abi hesabından "Move domain" ile transfer). NS: `denver` + `irma`. A @ + www → `188.245.42.178` (DNS only).
- **Host:** Hetzner cx33 (`188.245.42.178`) + Coolify (`https://coolify.brtapps.dev/`). Nixpacks auto (Node 24 kurdu, 22'ye pin Plan 4).
- **Deploy commit:** `7eadaf1`. `cbc8874` (design-debug prod guard + favicon + robots update) push edildi ama **redeploy bekliyor**.
- **Turnstile prod key:** site + secret CF'de oluşturuldu; Coolify env'de. Secret chat'te paylaşıldı — Plan 4'te rotate.
- **Resend:** şimdiki FROM ile çalışıyor; `noreply@kitaplastik.com` için domain verify sonraki iş.
- **Memory güncellendi:** `project_kitaplastik.md` + 2 yeni feedback (`cf_registrar_same_account`, `coolify_nixpacks_env`).

## 2026-04-21 — Plan 4a URL migration ✅ + Auto-deploy kuruldu

**Durum:** Plan 4a MERGED, canlıda aktif (PR #1 squash → `d01f1bc`). 10 commit + 1 baseline fix + 1 auto-deploy workflow. Coolify auto-deploy GitHub Actions webhook ile kuruldu.

### Plan 4a sonucu (canlıda doğrulandı)

- TR public route'lar → İngilizce slug'lar: `/urunler → /products`, `/sektorler → /sectors`, `/referanslar → /references`, `/hakkimizda → /about`, `/iletisim → /contact`, `/teklif-iste → /request-quote` (+ 3 sektör alt + 2 teklif-iste alt)
- 12 public + 1 admin 308 redirect'i `next.config.ts`'de (eski TR URL'ler → yeni EN slug'lara permanent redirect)
- Admin: `/admin/ayarlar/bildirimler → /admin/settings/notifications`
- `lib/seo/routes.ts` PUBLIC_ROUTES EN slug'lar → sitemap + hreflang otomatik güncel
- Internal `<Link>` tamamen migrated (Header, Footer, LocaleSwitcher, home, teklif-iste, admin Shell, actions.ts)
- E2E `url-redirects.spec.ts` (45 test, GREEN)
- Baseline CI fix: `smoke.spec.ts` `/` → `/tr` explicit, Supabase placeholder koşullu `test.skip` (references/rfq specs)

**Canlı smoke 10/10 geçti** (commit `d01f1bc` deploy sonrası): 6× TR→EN 308, 5× EN 200, admin redirect, sitemap EN slug'lar.

### Auto-deploy kurulumu (bu oturum yeniliği)

**Sorun:** Coolify UI'de "Automatically deploy new commits based on Git webhooks" toggle AÇIK olmasına rağmen `gh api repos/.../hooks` boş dönüyor — Coolify self-hosted, public repo source tipinde **webhook'u GitHub'a fiilen kurmamış**. Toggle effektif değildi.

**Çözüm:** GitHub Actions `workflow_run` → Coolify `/api/v1/deploy` webhook. `.github/workflows/deploy.yml` (commit `e096896`):
- `workflow_run: CI completed on main` → CI success ise Coolify'a curl
- **CI-gated deploy**: kırık commit canlıya gitmez (baseline CI fiyaskosu tekrar etmez)
- GitHub Secrets: `COOLIFY_TOKEN`, `COOLIFY_DEPLOY_URL`
- Coolify webhook URL: `https://coolify.brtapps.dev/api/v1/deploy?uuid=hmvzgaqgqy4ctrjog20laymu&force=false`

**Güvenlik borcu:** Coolify API token chat'e yazıldı (`1|D5aQv8w4...`). **Rotate edilmeli**: Coolify → Keys & Tokens → eski token'ı delete, yeni oluştur → `gh secret set COOLIFY_TOKEN --body '<yeni>'`.

### 2026-04-21 (devam) — Admin login fix + Node pin + Turnstile/Resend + Supabase plugin MCP

**Admin login debug + fix** (SQL reset):
- Canlıda login 400 `invalid_credentials` dönüyordu (berkaytrk6@gmail.com, referer `https://kitaplastik.com`, auth logs'tan teyit)
- Teşhis: user state tamamen sağlıklı (email_confirmed, identity_email sync, admin role) → sadece password hash mismatch (user şifreyi yanlış hatırlıyor/stale not)
- Fix: Dashboard SQL Editor → `UPDATE auth.users SET encrypted_password = crypt('<yeni-şifre>', gen_salt('bf')), updated_at=now() WHERE id = '<uuid>' RETURNING email, updated_at;`
- User şifreyi **kendi** query'de yazdı (chat'e düşmedi), 1Password'e kaydetti, login ✅
- **Öğrenme:** `auth.admin.updateUserById({password})` yerine direct SQL UPDATE + bcrypt `crypt('<pw>', gen_salt('bf'))` pattern hızlı ve chat'e düşmeden uygulanabilir.

**Supabase MCP auth çökmesi** (resolved):
- Default Supabase MCP (Claude Code'un kurduğu) 401 döndü, `mcp-health-check` cooldown ile bloklandı (standard,strict mode)
- CLI `supabase login --linked` da 401 — access token expire
- Non-TTY ortamda `supabase login` interactive OAuth desteklemez
- **Çözüm:** `/plugin` ile `supabase` plugin MCP kuruldu (claude-plugins-official). Plugin'in kendi OAuth akışı sağlıklı çalıştı (localhost callback pattern, user browser onay). Default MCP yerine plugin artık kullanılıyor.
- Pattern: default MCP 401 veriyorsa önce plugin'e geç, OAuth yenile, default MCP'yi silmek opsiyonel.

**Node 22.22.2 pin** (commit `2af9273`):
- `.nvmrc`: `22` → `22.22.2` (tam semver)
- `package.json` engines.node: `>=22` → `>=22.22.2 <23`
- Coolify env: `NIXPACKS_NODE_VERSION=22.22.2` eklendi (redundant safety, primary control)
- Nixpacks artık 24 fallback yerine 22.22.2 indirir; canlıda ETag değişimi doğrulandı

**Turnstile secret rotate** (Coolify env sadece — kod değişikliği yok):
- CF Turnstile dashboard → Rotate → yeni secret → Coolify `TURNSTILE_SECRET_KEY` update → auto-deploy redeploy ile aktif
- Eski (chat'te leak olan) secret CF rotate ile invalidate oldu

**Resend domain verify + branded FROM**:
- Resend → `kitaplastik.com` eklendi, region EU West (Dublin)
- CF DNS: MX `send` → `feedback-smtp.eu-west-1.amazonses.com` (pri 10), TXT `send` SPF (`v=spf1 include:amazonses.com ~all`), TXT `resend._domainkey` DKIM public key
- Resend Verified ✅
- Coolify env `RESEND_FROM_EMAIL` = `noreply@kitaplastik.com`
- Canlıda auto-deploy ile aktif; contact/RFQ mail artık branded sender kullanıyor
- **Not:** Root `@` için SPF TXT EKLENMEDİ — Google Workspace gelince birleşik SPF string olarak (google + amazonses include'ları) root'a eklenecek. Şu an sadece `send.` subdomain için SPF var.

### CF proxy + Let's Encrypt DNS-01 (ERTELENEN İŞ, ~20-25 dk)

Orange cloud + SSL Full (strict) açmak için **önce** Coolify Traefik cert challenge'ını DNS-01'e migrate etmek lazım, yoksa 60-90 gün sonra Let's Encrypt HTTP-01/TLS-ALPN-01 CF proxy tarafından intercept edilir → renewal fail → site HTTPS down.

**Güvenli sıra:**
1. CF → My Profile → API Tokens → "Create" → scope: `Zone:DNS:Edit`, zone: `kitaplastik.com` → token al
2. Coolify Server Settings → Traefik env: `CF_API_TOKEN` + DNS-01 challenge config (Coolify v4 dokümanı: `traefik.acme.dnschallenge.provider=cloudflare`)
3. Traefik'i restart + manuel cert renewal trigger → DNS-01 ile başarılı olduğunu doğrula
4. **Sonra** CF DNS → A records (@ + www) Proxy ON (orange cloud)
5. CF SSL/TLS → Overview → Full (strict)
6. Test: `curl -sI https://kitaplastik.com` → `server: cloudflare`, Next.js 200

Bu bir ayrı "infra session" olarak ele alınacak. Ayrı oturumda ~20-25 dk.

### Next session — Plan 4b başlar

Spec: `docs/superpowers/specs/2026-04-21-plan4b-admin-products-crud-design.md`. `superpowers:writing-plans` → PLAN.md → `superpowers:subagent-driven-development`.

Kapsam: `/admin/products` CRUD (liste + yeni + düzenle + sil/geri yükle) + 4 dil tab (TR zorunlu, EN/RU/AR opsiyonel "boşsa gösterme") + 10 preset özellik + ana görsel + galeri upload + public `/products` grid + `/products/[slug]` detay + RFQ picker catalog-backed. **Auto-translate yok** (user: Türkçe elle yaz, diğer dilleri manuel yapıştır).

## 2026-04-21 (devam 2) — Plan 4b spec + PLAN.md hazır, execution bekliyor

Bu oturumda brainstorm + planlama tamamlandı. Kod değişikliği yok — 2 docs commit.

### Brainstorm (6 soru → 6 karar)

Spec'in "Brainstorm Kararları" bölümü full tabloya sahip. Kısaca:

1. **Slug:** ilk kayıtta TR'den auto, sonra kilitli + opt-in "Slug'ı düzenle" toggle
2. **Spec builder:** preset unique (dropdown'da eklenmiş disabled), çoklu değer tek hücrede virgülle
3. **Alt text:** admin girmez; runtime fallback `name[locale]` + `common.productImageLabel` (4 dilde)
4. **"Benzer ürün ekle":** metin + görseller Storage.copy() yeni UUID path'lere; edit mode'da açılır
5. **Sıralama:** yukarı/aşağı ok butonları (görsel + spec)
6. **RFQ ProductPicker:** katalog-only + empty state → özel üretim formu linki

### Dosyalar

- Spec: `docs/superpowers/specs/2026-04-21-plan4b-admin-products-crud-design.md` (commit `d7f9e62` — brainstorm kararları inline işlendi + consolidation tablosu eklendi)
- **Plan:** `docs/superpowers/plans/2026-04-21-faz1-plan4b-admin-products-crud.md` (commit `84e01b0`, 3202 satır, 28 bite-sized task TDD-per-task)

### Plan task özeti (28 task, ~3-5 gün)

- **Foundations (T1-6):** i18n key + alt-text helper, XSS-safe json-ld helper, slugify (TR-aware), uniqueSlug helper, 10 preset, Zod schemas
- **Server actions (T7-10):** create/update/softDelete/restore/cloneProduct (Storage.copy + rollback)
- **Admin components (T11-17):** SlugField, SpecBuilder, ImageUploader, LocaleTabs, ProductForm, Delete/Restore/Clone buttons, ProductList
- **Admin pages (T18-19):** list + Shell nav update, new + edit
- **Public (T20-23):** ProductCard/Grid, Gallery/SpecTable/Detail, /products grid, /products/[slug] detay
- **RFQ (T24):** ProductPicker catalog autocomplete + empty state
- **E2E (T25-27):** programmatic login helper + 7 spec
- **Deploy (T28):** CI → Coolify auto-deploy → canlı smoke

Her task self-contained: exact file paths, full code blocks, TDD cycle (failing test → implement → passing test → commit), dependency map plan sonunda.

### Kritik bulgular

1. **Coolify "Public Repository" source tipinde webhook otomatik kurulmaz.** Toggle UI'de açık gözükebilir ama GitHub'a gerçek webhook inject etmez. Debug: `gh api repos/<owner>/<repo>/hooks` → boşsa toggle çalışmıyor demek.
2. **GitHub Actions `workflow_run` → Coolify `/api/v1/deploy` pattern'ı** daha iyi: git history'de görünür, CI-gated, secret'lar managed.
3. **Baseline E2E fail'leri** env koşullu `test.skip(!hasRealSupabase)` pattern ile yumuşatıldı. Kalıcı fix CI config'ine gerçek Supabase anon key + public env eklemek (ayrı iş).

### Dosyalar
- PR #1 MERGED (squash `d01f1bc`); feat branch silindi
- Auto-deploy workflow: `.github/workflows/deploy.yml` (commit `e096896`)
- Spec + plan dosyaları: merge içinde (Plan 4a PR)
- Memory: `feedback_basit_scope_split.md` (önceki oturum) + bu oturum yeni: `feedback_coolify_autodeploy_via_gha.md`

## 2026-04-21 (devam 3) — Plan 4b kod canlıda, smoke + security audit aşaması

**Durum:** Plan 4b execute tamamlandı. 38 commit main'e push edildi (`8b64d53..eb2de24`). GHA → Coolify auto-deploy tetiklendi.

### Ne bitti

- 28 task (T1-T28) subagent-driven pattern ile: implementer → spec review → code quality review → fix
- 38 commit: 28 feat/test + 10 fix (code-review bulguları)
- Local green: typecheck ✓, vitest 108/108 ✓, lint clean ✓, build ✓ (4 locale products SSG + dynamic slug + 3 admin routes)
- 5 ürün route'u derlendi: `/[locale]/products` (4 locale SSG), `/[locale]/products/[slug]` (dynamic), `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`
- 10 code-review fix inline: security/a11y/TS strict/i18n/UX düzeltmeleri

### Final fix turu (user: "her şeyi fixle öyle pushla")

4 ek commit (Plan 4b review'larda yakalanan):
- SpecBuilder `role="option"` → `role="menuitem"` (jsx-a11y + ARIA ownership düzeldi)
- `listProducts` search param drop (UI filter client-side zaten yapıyor — dead code temizlik)
- `ProductDetail` "Teknik Özellikler" → `specsLabel` prop + 4 locale translation
- RFQ `ProductPicker` i18n restore (10 yeni key × 4 locale, eskiden hardcoded TR idi)

### Şu an nerede (WIP — smoke bekliyor)

- Deploy ~2-3dk içinde Coolify'da canlı olur
- T28 canlı smoke kalan (plan'da Step 3-4 listesi var — admin CRUD 4 locale × clone × delete/restore × RFQ picker empty state × Schema.org JSON-LD kontrolü)
- RESUME "Plan 4b ✅" entry smoke sonrası (plan'da T28 Step 6 template hazır)

## 2026-04-22 — Plan 4b ✅ TAMAMLANDI — canlıda, smoke geçti

**Durum:** 11 smoke adımı geçti, 2 canlı-tespit bug fix'lendi, 49 commit canlıda + migration prod DB'de.

### Final commit count (Plan 4b tüm saga)

`8b64d53..HEAD` = **49 commit** — 28 task + 10 code-review fix inline + 4 polish + 7 security/CI fix.

### Canlı-tespit bug'lar (user smoke sırasında buldu)

1. **URL 404** (`/tr/request-quote/ozel-uretim` "Sayfa bulunamadı"): ProductPicker empty-state link'inde + ProductDetail CTA'sında locale-aware olmayan hardcoded path. Fix `9f31176`: locale === "tr" ? TR pretty path : EN canonical. next.config Plan 4a redirect'i TR pretty → canonical dönüştürüyor.
2. **Slug edit'te tire girilemiyor**: `slugify()` onChange'te trailing dash'i hemen silerek kullanıcıyı input'a karakter yazdırmaz etmişti. Fix `9f31176`: `slugifyDraft()` yeni export — tire preserve, onChange'te permissive; `slugify()` sadece onBlur'da tam temizlik.

### Coolify deploy saga (aksaklık + workaround)

Deploy webhook URL `force=false` ile kuruluydu (`feedback_coolify_autodeploy_via_gha.md` ref). İlk iki yeni deploy (`9f31176` + `417acf6`) build cache'e çarpıp prod container'ı güncellemedi. Son deploy manuel trigger (veya Coolify cache expire) sonrası oturdu. **TODO (follow-up):** GHA secret `COOLIFY_DEPLOY_URL`'i `force=true` ile güncelle — yoksa her deploy'da bu yaşanabilir.

### Prod DB (migration 20260421200000 applied)

`pnpm exec supabase db push` ile uygulandı:
- Param-less `is_admin()` / `is_admin_role()` — SECURITY DEFINER + `(select auth.uid())` + search_path locked
- 11 RLS policy yeniden kuruldu (memoization)
- `authenticated insert audit_log` dead+dangerous policy drop
- 3 bucket için `file_size_limit` + `allowed_mime_types` (product-images / rfq-attachments / sector-images)
- rfq-attachments path traversal regex (UUID prefix + whitelisted ext)
- 4 perf index (`(active, display_order)`, `sector_id`, `assigned_to`, `notification_recipients(active)`)

### Programmatic smoke sonuçları (anon RLS)

- 4 locale `/products` → 200 ✓
- Security headers aktif (CSP, HSTS, X-Frame, Permissions, Referrer, X-Content-Type) ✓
- Anon sectors read → 200 content-range `0-0/3` ✓
- Anon rfqs/audit_log/admin_users SELECT → `[]` (RLS filter) ✓
- Anon POST audit_log → **401** ✓ (spoof kapandı)
- rfq-attachments badpath.txt → **400** ✓
- rfq-attachments UUID/test.txt (bad ext) → **400** ✓

### Browser smoke sonuçları (user yaptı)

Adım 1-11 hepsi geçti: admin login + Ürünler nav + yeni ürün (TR spec görsel) + liste görünür + JSON-LD var + EN tab + boşsa gösterme (ru/ar'da görünmez) + clone (-kopya suffix) + slug toggle uyarı + sil/restore + autocomplete + empty-state → özel üretim link ✓

### Plan 4b kapsam DIŞI (Plan 4c / follow-up adayları)

1. **Custom RFQ form (özel üretim)** end-to-end re-smoke — Plan 3 feature, theoretically migration'dan etkilenmedi ama end-to-end validation yapılmadı
2. **next-intl v3 → v4** breaking upgrade (GHSA-8f24-v5vv-gm5j open redirect). Mevcut CSP + auth callback fix attack surface'i büyük ölçüde kapattı. Defer.
3. **Structured logger** (Sentry SDK) — `console.error` yerine prod'da. NEXT_PUBLIC_SENTRY_DSN schema'da var, kod tarafı bağlanmadı.
4. **next-intl pathnames mapping** — TR kullanıcısı URL'de İngilizce slug görmesin diye (`/tr/request-quote/custom` → `/tr/teklif-iste/ozel-uretim`). Şu an redirect sayesinde çalışıyor ama canonical URL İngilizce. SEO-pretty-URL fix.
5. **`exactOptionalPropertyTypes`** tsconfig strictness
6. **Notification page** `as unknown as Recipient[]` cast — Supabase generated types sync edilince temizlenir (`supabase gen types typescript --linked > lib/supabase/types.ts`)
7. **Coolify webhook `force=true`** — yukarıdaki deploy saga'yı önler
8. **Smoke test ürünü** — admin panelinden hard-delete (Silinmiş → DB row). Storage path'leri `product-images/smoke-test-*` da silinebilir.
9. **Admin `id` middleware admin_role check** — defense-in-depth (H4-db). Şu an page-level `requireAdmin()` yeterli, ama edge middleware'de check eklemek brief expose window'unu kapatır.
10. **Tire sonrası whitespace/strip UX** — SlugField onBlur'da `slugify()` trailing tire temizliyor, ama user typing flow'unda görülebilir bir glitch olmayacak.

### Security audit kararı

Smoke test ÖNCESİ user'ın talebiyle comprehensive security audit başlatıldı:
- `security-review` skill (branch diff)
- `security-reviewer` agent (OWASP)
- `database-reviewer` agent (Supabase RLS)
- `typescript-reviewer` agent (TS-specific)
- `pnpm audit` (dep vulns)
- Grep for hardcoded secrets

Bulgular (synthesized ve fix edildi — 6 commit):

- **CRITICAL (2)**: public pages anon client'a geçti (C1 — RLS bypass kapandı); rfq-attachments path traversal regex constraint ile kapandı (C2 — migration'da UUID prefix + whitelisted extension).
- **HIGH (9)**: open redirect auth/callback `next` fix; UUID assertion tüm admin action'lara eklendi (`updateProduct` / `softDeleteProduct` / `restoreProduct` / `cloneProduct` / `updateStatus` / `saveNotes` / `toggleRecipient` / `removeRecipient`); audit_log INSERT policy drop (service client yazar, policy attack surface); `insertedId!` definite-assignment narrow edildi; error boundaries (public + admin); RLS memoization — param-less `is_admin()` / `is_admin_role()` helpers + `(select auth.uid())` + SECURITY DEFINER + search_path locked.
- **MEDIUM (12)**: env server/client split + `"server-only"` pragma (`lib/env.client.ts` yeni, `lib/env.ts` server-only); CSP + HSTS headers vercel.json; `app/design-debug/` silindi + middleware bypass temizlendi; bucket limits (file_size + allowed_mime_types: product-images 10MB jpeg/png/webp, rfq-attachments 10MB pdf+images+office+step+iges, sector-images 10MB image); ilike wildcard escape (%, _, \\); clone storage copy hata mesajı sanitize; password trim kaldırıldı; softDeleteProduct/restoreProduct existence check; addRecipient `z.string().email()` validate; redundant `as AdminUser["role"]` cast silindi; ProductPicker stable React keys (`crypto.randomUUID()` + payload'tan strip); button error handling (DeleteDialog/CloneButton/RestoreButton try/catch + inline error state).
- **LOW (8)**: `is_admin` SECURITY DEFINER; perf indexes (products(active,display_order), products(sector_id), rfqs(assigned_to), notification_recipients(active) WHERE active); env test dosyaları env.client'a yönlendirildi.

**Deferred (gerekçeli)**:

- next-intl v3→v4 upgrade (H2-sec): breaking change, ayrı task. CSP + open-redirect fix'ler attack surface'i zaten kapattı.
- `console.error` → structured logger (M5-ts): Sentry SDK wiring lazım, ayrı plan.
- `exactOptionalPropertyTypes` (L3-ts): tsconfig change, orthogonal.
- Seed email cleanup (M2-db): git history immutable; yeni seed'lerde env substitution.
- Middleware admin_role DB lookup (H4-db): page-level `requireAdmin` / `requireAdminRole` yeterli defense-in-depth; edge runtime'da ek DB roundtrip ağır.
- admin_users policy docs (H2-db): service-only pattern zaten etkili; `self read admin_users` memoized güncellemesi yapıldı.

**Yeni migration**: `supabase/migrations/20260421200000_plan4b_security_hardening.sql` (henüz push edilmedi — user `supabase db push` ile uygulayacak).

**Son durum**: 44 commit toplam, hepsi push-hazır. Local green: typecheck ✓, vitest 108/108 ✓, lint ✓, build ✓. Smoke test + migration push bekliyor.

## Yeni Session Başlangıç Komutları

### ✅ Plan 4b TAMAM (canlıda, kapanış notu — geçmişten)

Plan 4b spec/plan commit'leri: `d7f9e62` (spec) + `84e01b0` (plan). 50 commit execute + security audit + bug fix'ler (`8b64d53..e32cfe7`). Migration `20260421200000` prod DB'de. Detay: 2026-04-22 entry yukarıda.

### 🚀 Plan 4c mini-batch (quick-win — SONRAKİ OTURUMA PASTE EDİLECEK)

```
Kitaplastik Plan 4b tamam ✅ canlıda (50 commit + migration applied — docs/superpowers/RESUME.md
2026-04-22 entry'de full durum). Plan 4c mini-batch — 2 P0 iş:

1. **Coolify webhook force=true** (5dk): GHA secret COOLIFY_DEPLOY_URL'i güncelle.
   Şu an `?force=false` → build cache'e takılıyor, her push container'ı güncellemeyebiliyor.
   Coolify dashboard → App kitaplastik → Webhooks → Deploy Webhook URL kopyala (?force=true
   ile). Sonra `gh secret set COOLIFY_DEPLOY_URL < <(pbpaste)` (clipboard'dan, chat'e
   düşmesin). Saga detayı RESUME 2026-04-22 "Coolify deploy saga" bölümünde.

2. **Custom RFQ form post-migration smoke** (5dk): https://kitaplastik.com/tr/teklif-iste/ozel-uretim
   → form doldur (ad/email/50+ karakter açıklama) + 1 PDF upload (<10MB) + Turnstile + submit.
   Email geldi mi + RFQ admin inbox'ta göründü mü. Plan 3 feature'ı; yeni bucket MIME/size
   limit + path traversal regex uyumluluğu gerek.

İkisini bitirince RESUME'yi güncelle. Diğer follow-up'lar (pathnames, v4 upgrade, Sentry) ayrı
oturum. ultrathink.
```

### 🗺️ Kalan follow-up'lar (Plan 4c sonrası — priority order)

1. **P1 — next-intl pathnames mapping** (1-2sa): TR kullanıcı `/tr/request-quote/custom` yerine `/tr/teklif-iste/ozel-uretim` canonical URL görsün. i18n/routing.ts'ye `pathnames` config ekle, Link'lerde single pathname kullan. SEO polish.
2. **P1 — next-intl v3 → v4 upgrade** (2-4sa): Breaking change, GHSA-8f24-v5vv-gm5j open redirect fix. CSP + auth callback fix halihazırda attack surface'i büyük ölçüde kapattı, ama sürüm güncellemesi gerek.
3. **P2 — Sentry SDK wiring** (30dk): `NEXT_PUBLIC_SENTRY_DSN` env'de var ama kod bağlı değil. `console.error` yerine structured logger. instrumentation.ts + `@sentry/nextjs` install.
4. **P2 — Smoke test ürünü cleanup** (2dk): Admin panelinden "Silinmiş" tab'dan hard-delete. Storage `product-images/smoke-test-*` path'leri Supabase Studio'dan temizle.
5. P3 — `exactOptionalPropertyTypes` tsconfig strictness
6. P3 — notification page redundant Supabase cast (`supabase gen types` sync ile)
7. P3 — middleware admin_role DB check (defense-in-depth)
8. P3 — SlugField onBlur trailing-tire strip UX polish

### 🌐 CF proxy + Let's Encrypt DNS-01 migration (infra, ~20-25 dk)

```
Kitaplastik CF proxy + SSL Full (strict) için Let's Encrypt cert renewal'ı
DNS-01'e geçirmek lazım (HTTP-01/TLS-ALPN-01 CF proxy ile çakışır).
docs/superpowers/RESUME.md "CF proxy + Let's Encrypt DNS-01 (ERTELENEN İŞ)"
bölümünü oku, 6 adımı uygula.

Ön gerekli: CF API token (Zone:DNS:Edit scope, kitaplastik.com zone).
```

### 🌐 CF proxy + Let's Encrypt DNS-01 migration (infra, ~20-25 dk)

```
Kitaplastik CF proxy + SSL Full (strict) için Let's Encrypt cert renewal'ı
DNS-01'e geçirmek lazım (HTTP-01/TLS-ALPN-01 CF proxy ile çakışır).
docs/superpowers/RESUME.md "CF proxy + Let's Encrypt DNS-01 (ERTELENEN İŞ)"
bölümünü oku, 6 adımı uygula.

Ön gerekli: CF API token (Zone:DNS:Edit scope, kitaplastik.com zone).
```

### 🔄 Redeploy + smoke (hemen yarın)

```
Kitaplastik canlıda (https://kitaplastik.com). cbc8874 commit'i henüz deploy'a
gitmedi — Coolify'da Redeploy tetikle (design-debug prod guard + favicon + robots
disallow gelir). Sonra smoke: 4 locale (TR/EN/RU/AR, AR RTL), mobile, iletişim
form (Turnstile + Resend mail), RFQ custom + standart (file upload), admin login
→ /admin/inbox. Sorun çıkarsa fix, çıkmazsa durum özeti.

ultrathink
```

### 📧 Resend domain verify + Google Workspace kurulum

```
Kitaplastik için info@kitaplastik.com mail kutusu + noreply@kitaplastik.com
outbound sender kuralım. Plan:
1. Google Workspace: kurulum + MX kayıtları (CF DNS)
2. Resend: Domains → kitaplastik.com ekle, SPF/DKIM kayıtları CF DNS'e
3. Birleşik SPF string (google + resend include'ları)
4. Coolify env: RESEND_FROM_EMAIL=noreply@kitaplastik.com
5. Redeploy + smoke contact form

Başla: önce Resend dashboard'da domain add'le başla mı, yoksa GWS önce mi?

ultrathink
```

### 🗺️ Plan 4 planlama (büyük — admin CRUD + SEO + analytics)

```
Kitaplastik MVP ve production deploy tamam. Plan 4'ü `superpowers:writing-plans`
ile planla: `docs/superpowers/plans/<date>-faz1-plan4-admin-crud-seo-analytics.md`.

Kapsam:
- /admin/urunler + /admin/sektorler CRUD (4-dil tab, görsel upload)
- /admin/ayarlar/sirket + sablonlar
- Müşteri RFQ tracking /[locale]/rfq/[uuid]/
- Upstash Redis rate limit upgrade
- SEO: Schema.org Organization/Product, OG image, apple-icon
- KVKK + Gizlilik Politikası sayfaları
- Plausible + Sentry
- Admin E2E programatik login
- Node 22 pin (NIXPACKS_NODE_VERSION=22.22.2)
- Turnstile secret rotate
- CF proxy open (orange) + SSL "Full (strict)"
- 404 sayfası i18n
- E2E regresyon (redesign sonrası)

Kod haritasını gör → brainstorm sorularını başlat.

ultrathink
```

### Deprecated — Config devamı (config aşaması tamamlandı)

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
