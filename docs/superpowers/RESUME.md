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

## Plan 3 — Sıradaki (~2 hafta)

RFQ pipeline + Supabase tabloları + admin paneli:

1. **Supabase tabloları:** `rfqs`, `rfq_attachments`, `clients`, `users`, `notification_recipients`, `email_templates`, `audit_log` + RLS politikaları + storage bucket (`rfq-uploads`)
2. **RFQ formları:**
   - `/teklif-iste/ozel-uretim` (custom RFQ — proje brief + dosya upload)
   - `/teklif-iste/standart` (standart ürün RFQ — katalogdan seç)
   - Zod validation, Cloudflare Turnstile, Resend e-posta (ekibe + müşteriye)
3. **Admin paneli:**
   - Supabase Auth magic link
   - `/admin/inbox` (RFQ listesi + durum değişikliği)
   - `/admin/urunler` (ürün/sektör CRUD)
   - `/admin/ayarlar` (şirket bilgi, bildirim alıcıları, e-posta şablonları)
4. **Referanslar migrasyonu:** `lib/references/data.ts` mock → Supabase `clients` tablosu (interface sabit kalır)
5. **Rate limiting + audit log + güvenlik:** `/api/rfq/route.ts` endpoint'i ile

### Plan 3'te OLMAYANLAR (Plan 4'e kalır)

- Müşteri RFQ tracking sayfası (`/rfq/[uuid]/`)
- SEO ileri seviye (Schema.org Organization/Product, OG image generator)
- Plausible analytics, Sentry hata takibi, Lighthouse optimizasyonu
- Faz 2 iyileştirmeler

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

## Yeni Session Başlangıç Komutu (Plan 3 için)

`/clear` sonrası tek mesajla başla:

```
docs/superpowers/RESUME.md dosyasını oku, sonra Plan 3'e başla:
superpowers:writing-plans skill'i ile Plan 3'ü (RFQ + Supabase + admin paneli) yaz,
docs/superpowers/plans/<date>-faz1-plan3-rfq-supabase-admin.md olarak kaydet,
onayımdan sonra superpowers:subagent-driven-development ile pragmatik batch modda uygula.
Best practices, security, Context7 ile latest docs check zorunlu. ultrathink
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
