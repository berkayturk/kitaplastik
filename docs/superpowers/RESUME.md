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

## Yeni Session Başlangıç Komutu (Plan 4 için)

Önce release — kullanıcı görevleri bölümündeki 7 manuel adımı tamamla, sonra:

```
docs/superpowers/RESUME.md dosyasını oku. Release adımları tamam mı kontrol et.
Eksik varsa önce onu koordine et. Tamam ise Plan 4'e başla:
superpowers:writing-plans skill'i ile Plan 4'ü (admin urunler/sektorler CRUD, ayarlar,
müşteri RFQ tracking, SEO ileri, Plausible + Sentry, Upstash Redis) yaz.
docs/superpowers/plans/<date>-faz1-plan4-admin-crud-seo-analytics.md olarak kaydet,
onay sonrası subagent-driven-development pragmatik batch modda uygula. ultrathink
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
