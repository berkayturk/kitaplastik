# Resume Guide — Kıta Plastik MVP

> Bu dosya context-clear sonrası yeni Claude session'ın hızlıca devam etmesi için. **Read this first.**

## Proje Özeti

- **Şirket:** Kıta Plastik ve Tekstil San. Tic. Ltd. Şti. (Bursa, 1989'dan beri)
- **Hedef:** 4-dilli (TR/EN/RU/AR) hibrit B2B kurumsal site (vitrin + RFQ funnel + admin paneli)
- **Sektörler:** Cam yıkama · Kapak · Tekstil · Custom mühendislik
- **Repo:** https://github.com/berkayturk/kitaplastik (public, main branch)
- **Domain:** kitaplastik.com (henüz Vercel'e bağlanmadı)
- **Working dir:** `/Users/bt/claude/kitaplastik`

## Planlama Dökümanları

| Dosya | Durum |
|---|---|
| `docs/superpowers/specs/2026-04-16-kitaplastik-website-design.md` | ✅ Onaylanmış spec (1081 satır, 20 bölüm) |
| `docs/superpowers/plans/2026-04-17-faz1-plan1-foundation.md` | ✅ Plan 1 tamamlandı (25 task) |

## Plan 1 — Tamamlandı (28 commit)

Foundation + Design System + Anasayfa İskelet:
- Next.js 15.5.15 + React 19 + TS 5.9.3 strict + Tailwind 4.2.2 + shadcn/ui 4.3.0
- Industrial Precision design tokens, self-hosted Inter + JetBrains Mono variable fonts
- Layout: Container + Header + Footer · Anasayfa: Hero placeholder + SectorGrid · 404 sayfası
- Supabase client/server helpers + zod env validation
- Vitest (22 unit) + Playwright (5 E2E) + ESLint + Prettier + Husky + lint-staged + GitHub Actions CI
- Vercel config, README

**Önemli runtime kararlar:**
- Node 22 LTS (Jod, EOL 2027-04) — Node 25 yerine, Node 20 EOL 2026-04 yüzünden
- Next.js 15 pinned (Next 16 stable ama Plan 1 için 15'te kalındı)
- TS 5.9.3 pinned (TS 6 + Next 15 uyumsuz)
- pnpm 9.15.9
- shadcn 4.3.0 + radix-ui umbrella package (yeni canonical)

## Plan 2 — Sıradaki

Spec'in §17.1'inden + Plan 1 dökümanından çıkan kapsam:

### Plan 2: i18n Pipeline + 3D Hero + Public Sayfalar (~1.5-2 hafta)

1. **i18n altyapısı:**
   - `next-intl` v3+ kur, `[locale]` route segment'i, middleware, default locale TR
   - `messages/{tr,en,ru,ar}/*.json` namespace yapısı (common, home, sectors, rfq, etc.)
   - hreflang otomasyonu, sitemap, x-default
   - RTL Arapça: `dir="rtl"`, tailwindcss-rtl plugin, logical CSS, ikon flip, Intl API lokalizasyon
   - `@fontsource-variable/inter` Latin-Ext + IBM Plex Sans Arabic ekle
2. **Çeviri pipeline:**
   - `scripts/translate.py` (Anthropic Claude API + glossary)
   - `glossary.json` (50-100 teknik terim)
   - `_review` flag mekanizması (kritik metinler için spot insan kontrolü)
   - GitHub Actions job: TR JSON değişince otomatik PR
3. **Atmosferik 3D Hero:**
   - `react-three-fiber` + `@react-three/drei` + `three`
   - Custom GLSL shader: perlin noise + flowmap + light particles + mouse parallax
   - Lazy-load (`dynamic import { ssr: false }`), `prefers-reduced-motion` respect
   - Mobile/low-power fallback: CSS gradient (Plan 1'deki placeholder)
   - Performans: <120 KB hero JS bundle, 60fps desktop / 30fps mobile
4. **Kalan 7 public sayfa:**
   - `/sektorler` hub + 3 alt: cam-yikama, kapak, tekstil (sektör temalı renkler)
   - `/urunler` hub (placeholder catalog UI; gerçek katalog Plan 3)
   - `/muhendislik` (custom mühendislik süreç)
   - `/atolye` (üretim atölyesi)
   - `/kalite` (sertifikalar)
   - `/hakkimizda` (1989'dan beri hikâye)
   - `/iletisim` (adres, harita, telefon, e-posta)
5. **Logo:** Plan 1'deki placeholder yerine cilalı SVG (yön: B - hafif rötuş)
6. **README + .env.example güncelle** (yeni env vars: ANTHROPIC_API_KEY for build-time)

### Plan 2'de OLMAYANLAR (Plan 3-4'e kalır)

- RFQ formları + Supabase tabloları + admin paneli (Plan 3)
- Resend, Cloudflare Turnstile (Plan 3)
- SEO ileri seviye (Schema.org, OG image generator), Plausible, Sentry, Lighthouse opt., E2E senaryolar, üretim deploy (Plan 4)

## Stratejik Kararlar (sürdürülecek)

- **Subagent-driven-development pragmatik mod:**
  - Mekanik task'lar (config, install, simple wiring): tek implementer + combined review
  - TDD logic task'lar (yeni component'ler, shader, çeviri pipeline): tam 3-stage review (impl + spec reviewer + quality reviewer)
- **Her task için:** Context7 MCP ile latest docs check + best practices + security awareness + TDD discipline + frequent commits (conventional)
- **Türkçe regex caveat:** JS `/i` flag `İ ↔ i`, `I ↔ ı` case-fold YAPAMAZ. Pattern ve text aynı case'de tutun veya `/teklif/i` gibi non-affected substring kullanın.
- **Plan dökümanı düzeltme:** Implementer task içinde plan'dan sapma yaparsa (örn. version pin), implementer kendi raporunda flag eder; orchestrator gerekirse plan dökümanını günceller.

## Yeni Session Başlangıç Komutu

`/clear` sonrası tek mesajla başla:

```
docs/superpowers/RESUME.md dosyasını oku, sonra Plan 2'ye başla:
superpowers:writing-plans skill'i ile Plan 2'yi (i18n + 3D + 7 public sayfa) yaz,
docs/superpowers/plans/2026-04-17-faz1-plan2-i18n-3d-pages.md olarak kaydet,
onayımdan sonra superpowers:subagent-driven-development ile pragmatik modda uygula.
Best practices, security, Context7 ile latest docs check zorunlu. ultrathink
```

## Ortam Notları

- Node 22.22.2 + pnpm 9.15.9 + corepack aktif (Homebrew node@22 link'li)
- Yerel git: `user.email=berkaytrk6@gmail.com user.name=Berkay` (repo-local, --global yapma)
- `.env.local` lokalde mevcut ama placeholder değerlerle (Plan 3 başında Supabase project oluşturulup gerçek değerler yazılacak)
- GitHub Actions CI: yeşil (https://github.com/berkayturk/kitaplastik/actions)
- Vercel deploy: henüz yapılmadı (vercel.com/new → import)

## Memory Hatırlatması

Yeni session açıldığında memory dizini boş — burayı oku, projeye ait kararları öğren. İlk mesajda kullanıcının ana komutunu uygulayıp, sonradan memory'ye gerekli kalıcı bilgileri (proje sahibi profili, tercihler) kaydet.
