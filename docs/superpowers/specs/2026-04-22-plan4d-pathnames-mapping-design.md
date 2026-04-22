# Plan 4d — Per-Locale Native URL Slug'ları (next-intl pathnames)

**Tarih:** 2026-04-22
**Durum:** Spec tamamlandı, onay bekliyor
**Tahmini süre:** 1 oturum (4-6 saat)
**Bağımlılık:** Plan 4a (EN canonical URL'ler) + Plan 4c (catalog pivot). Plan 4b (products CRUD) üzerine etki yok.

---

## Ne yapıyoruz?

Public site URL'lerinin her dilde **o dilin kendi slug'ını** göstermesini sağlıyoruz. Mevcut durumda tüm locale'ler EN canonical slug kullanıyor (`/tr/products`, `/ru/about`, `/ar/contact`). Plan 4d sonrası URL yapısı dil-doğal olur:

| Canonical (kod) | TR | EN | RU | AR |
|---|---|---|---|---|
| `/products` | `/tr/urunler` | `/en/products` | `/ru/produktsiya` | `/ar/al-muntajat` |
| `/about` | `/tr/hakkimizda` | `/en/about` | `/ru/o-nas` | `/ar/man-nahnu` |
| `/contact` | `/tr/iletisim` | `/en/contact` | `/ru/kontakty` | `/ar/ittisal` |

Kod tarafında canonical key'ler (`/products`, `/about` vb.) sabit kalır. Folder yapısı (`app/[locale]/products/`, `app/[locale]/request-quote/`) değişmez. Sadece kullanıcıya gösterilen URL her dilde native olur. next-intl v3 `pathnames` config'i ile yapılır.

## Neden?

- **SEO:** Yerel arama sonuçları dil-uyumlu slug'la daha iyi eşleşir. TR user "plastik ürünler" aradığında `/tr/urunler` URL'i Google'a yerel sinyal verir. Benzer durum RU (`produktsiya` Yandex + Google RU için standart) ve AR (`al-muntajat` Arabic B2B için tanıdık pattern).
- **UX:** Native AR/RU kullanıcı URL'de anlaşılır kelime görür, yabancı bir İngilizce slug değil.
- **Catalog pivot tutarlılığı:** Plan 4c sonrası nav label "Katalog İndir" / "Download Catalog" oldu ama URL hâlâ `/request-quote`. Plan 4d ile URL de `/tr/katalog` / `/en/catalog` olarak nav mantığıyla uyumlanır.
- **Plan 4a defansif kararı geri alınıyor:** Plan 4a'da "URL İngilizce kalsın" kararı geliştirici tutarlılığı gerekçesiyle verilmişti. Canlıya çıktıktan sonra user-facing deneyim önceliği geldi — pathnames pattern'i geliştirici kolaylığını (canonical key sabit) ve user deneyimini (native slug) birlikte sağlıyor.

## Site ziyaretçisi ne görecek?

**Net etki:** Her dil kendi diline özgü URL görür. Eski EN-canonical URL'lere gelenler yeni native URL'e otomatik yönlenir (308 permanent redirect).

| Önce (Plan 4a) | Sonra (Plan 4d) |
|---|---|
| `kitaplastik.com/tr/products` | `kitaplastik.com/tr/urunler` |
| `kitaplastik.com/tr/about` | `kitaplastik.com/tr/hakkimizda` |
| `kitaplastik.com/ru/products` | `kitaplastik.com/ru/produktsiya` |
| `kitaplastik.com/ar/contact` | `kitaplastik.com/ar/ittisal` |
| `kitaplastik.com/tr/request-quote` | `kitaplastik.com/tr/katalog` |
| `kitaplastik.com/en/products` | (değişmez — EN canonical zaten) |

Google arama sonuçlarındaki eski URL'ler 1-2 hafta içinde yeni URL'e güncellenir (308 ile ranking transfer olur, sitemap yeniden submit edilir).

## Slug haritası (tam)

**10 static route × 4 locale + 1 dynamic segment:**

```
/                          → / / / / (locale prefix sadece)

/about                     → /hakkimizda  /about           /o-nas         /man-nahnu
/contact                   → /iletisim    /contact         /kontakty      /ittisal
/products                  → /urunler     /products        /produktsiya   /al-muntajat
/products/[slug]           → /urunler/*   /products/*      /produktsiya/* /al-muntajat/*
/references                → /referanslar /references      /otzyvy        /maraji
/request-quote             → /katalog     /catalog         /katalog       /al-katalog
/sectors                   → /sektorler   /sectors         /otrasli       /al-qitaat
/sectors/bottle-washing    → /sektorler/cam-yikama  /sectors/bottle-washing  /otrasli/moyka-butylok  /al-qitaat/ghasil-zujajat
/sectors/caps              → /sektorler/kapak       /sectors/caps           /otrasli/kryshki        /al-qitaat/al-aghtiya
/sectors/textile           → /sektorler/tekstil     /sectors/textile        /otrasli/tekstil        /al-qitaat/al-mansujat
```

**Slug kararları:**
- **AR `al-` prefix KALIR** (`al-muntajat`, `al-qitaat`) — definite article, native user URL'e baktığında tanıdık form (Wikipedia AR, Amazon.sa B2B pattern).
- **RU BGN/PCGN transliteration** — Yandex + Google RU için standart. `produktsiya`, `kontakty`, `otrasli`.
- **Kısa arama terimi** — `otzyvy-klientov` yerine `otzyvy` (SEO volume tek kelime daha yüksek).
- **`/request-quote` catalog semantics** — TR/RU `katalog`, EN `catalog`, AR `al-katalog`. Nav label "Katalog İndir" ile tutarlı.

**Scope dışı:** `/admin/*` (locale'siz, TR-only, değişim yok). `/api/*` (URL yapısı önemsiz).

## Teknik architecture

**1. `i18n/routing.ts`** — `pathnames` prop eklenir:

```typescript
export const routing = defineRouting({
  locales: ["tr", "en", "ru", "ar"],
  defaultLocale: "tr",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/about": { tr: "/hakkimizda", en: "/about", ru: "/o-nas", ar: "/man-nahnu" },
    "/contact": { tr: "/iletisim", en: "/contact", ru: "/kontakty", ar: "/ittisal" },
    "/products": { tr: "/urunler", en: "/products", ru: "/produktsiya", ar: "/al-muntajat" },
    "/products/[slug]": { tr: "/urunler/[slug]", en: "/products/[slug]", ru: "/produktsiya/[slug]", ar: "/al-muntajat/[slug]" },
    "/references": { tr: "/referanslar", en: "/references", ru: "/otzyvy", ar: "/maraji" },
    "/request-quote": { tr: "/katalog", en: "/catalog", ru: "/katalog", ar: "/al-katalog" },
    "/sectors": { tr: "/sektorler", en: "/sectors", ru: "/otrasli", ar: "/al-qitaat" },
    "/sectors/bottle-washing": { tr: "/sektorler/cam-yikama", en: "/sectors/bottle-washing", ru: "/otrasli/moyka-butylok", ar: "/al-qitaat/ghasil-zujajat" },
    "/sectors/caps": { tr: "/sektorler/kapak", en: "/sectors/caps", ru: "/otrasli/kryshki", ar: "/al-qitaat/al-aghtiya" },
    "/sectors/textile": { tr: "/sektorler/tekstil", en: "/sectors/textile", ru: "/otrasli/tekstil", ar: "/al-qitaat/al-mansujat" },
  },
});
```

**2. `lib/utils/slugify.ts`** — RU + AR transliteration map eklenir (Cyrillic BGN/PCGN, Arabic ISO-233 yakını). API: `slugify(input, { locale?: Locale })`. Pathnames'te runtime'da çağrılmaz (static config); Plan 4b'deki ürün slug'larının gelecekte 4 dilde türemesi için hazırlanır.

**3. `lib/seo/routes.ts`** — `buildAlternates()` `getPathname({ href, locale })` helper'ı kullanır → per-locale native URL döner. Canonical key input olarak kalır.

**4. `app/sitemap.ts`** — `buildAlternates()` otomatik native URL üretir, dosya minimal değişir.

**5. `next.config.ts`** — Redirect matrisi güncellenir:

```
Plan 3 legacy TR native (direkt yeni canonical'a, 1-hop):
  /tr/urunler                 → /tr/urunler (no-op, silinir)  // pathnames zaten handle eder
  /tr/sektorler               → /tr/sektorler (no-op, silinir)
  /tr/hakkimizda              → /tr/hakkimizda (no-op, silinir)
  /tr/iletisim                → /tr/iletisim (no-op, silinir)
  /tr/referanslar             → /tr/referanslar (no-op, silinir)
  /tr/teklif-iste             → /tr/katalog (1-hop, yeni)
  /tr/teklif-iste/*           → /tr/katalog (catalog pivot zaten collapse)
  /tr/sektorler/cam-yikama    → /tr/sektorler/cam-yikama (no-op)
  /tr/sektorler/kapak         → /tr/sektorler/kapak (no-op)
  /tr/sektorler/tekstil       → /tr/sektorler/tekstil (no-op)

Plan 4a legacy EN canonical per non-EN locale:
  /tr/products                → /tr/urunler
  /tr/products/:slug          → /tr/urunler/:slug
  /tr/about                   → /tr/hakkimizda
  /tr/contact                 → /tr/iletisim
  /tr/references              → /tr/referanslar
  /tr/request-quote           → /tr/katalog
  /tr/sectors                 → /tr/sektorler
  /tr/sectors/bottle-washing  → /tr/sektorler/cam-yikama
  /tr/sectors/caps            → /tr/sektorler/kapak
  /tr/sectors/textile         → /tr/sektorler/tekstil

  /ru/products                → /ru/produktsiya
  /ru/products/:slug          → /ru/produktsiya/:slug
  /ru/about                   → /ru/o-nas
  /ru/contact                 → /ru/kontakty
  /ru/references              → /ru/otzyvy
  /ru/request-quote           → /ru/katalog
  /ru/sectors                 → /ru/otrasli
  /ru/sectors/bottle-washing  → /ru/otrasli/moyka-butylok
  /ru/sectors/caps            → /ru/otrasli/kryshki
  /ru/sectors/textile         → /ru/otrasli/tekstil

  /ar/products                → /ar/al-muntajat
  /ar/products/:slug          → /ar/al-muntajat/:slug
  /ar/about                   → /ar/man-nahnu
  /ar/contact                 → /ar/ittisal
  /ar/references              → /ar/maraji
  /ar/request-quote           → /ar/al-katalog
  /ar/sectors                 → /ar/al-qitaat
  /ar/sectors/bottle-washing  → /ar/al-qitaat/ghasil-zujajat
  /ar/sectors/caps            → /ar/al-qitaat/al-aghtiya
  /ar/sectors/textile         → /ar/al-qitaat/al-mansujat

Admin (mevcut, korunur):
  /admin/ayarlar/bildirimler  → /admin/settings/notifications
```

Mevcut 12 redirect ya no-op olur (silinir) ya da redirect target native canonical'a güncellenir. EN locale için yeni redirect yok (zaten canonical).

**6. Internal `<Link>` migration:**
- Static `<Link href="/products">` ve benzerleri **değişmez** — canonical key kullanılıyor.
- Dynamic pattern `<Link href={`/products/${slug}`}>` → type-safe obj syntax: `<Link href={{ pathname: "/products/[slug]", params: { slug } }}>`.
- Grep taraması: dynamic pattern yalnızca product detail context'inde. ~2-3 dosya etkilenir.

## Test stratejisi (T2)

**Unit:**
- `tests/unit/lib/utils/slugify.test.ts` — RU + AR transliteration sample (locale hint ile), TR regression.
- `tests/unit/lib/seo/routes.test.ts` — `buildAlternates()` her canonical key için 4 locale'de native URL döner.
- `tests/unit/app/sitemap.test.ts` — 40 URL snapshot (10 route × 4 locale), her biri native slug içerir.

**E2E (`tests/e2e/pathname-mapping.spec.ts`):**
1. Her locale × 3 temsili canonical URL 200 döner (`/tr/urunler`, `/ru/produktsiya`, `/ar/al-muntajat`, `/en/products`)
2. Legacy EN canonical → native redirect (örn. `/tr/products` → `/tr/urunler` 308)
3. Plan 3 legacy TR → yeni canonical 1-hop (`/tr/teklif-iste` → `/tr/katalog` direct)
4. Sitemap endpoint response native slug'ları içerir

**Regression:** Mevcut E2E spec'lerde hardcoded URL'ler güncellenir (örn. `smoke.spec.ts`'te `/tr` redirect'i, contact/catalog/RFQ spec'leri varsa).

## Rollout

1. **Local doğrulama:** `pnpm verify` (CI mirror: typecheck + lint + format + unit + build + E2E) lokalde yeşil.
2. **Push:** Single commit serisi direkt `main`'e (feature branch overhead YAGNI, proje küçük, CI-gated deploy zaten safety net).
3. **Auto-deploy:** GHA `workflow_run` → Coolify webhook (~7-9 dk, cache hit).
4. **Canlı smoke:**
   - 4 locale × 3 URL = 12 canonical URL 200
   - 4 locale × 3 legacy EN URL = 12 redirect (EN hariç 3 locale × 4 route örneği)
   - Plan 3 legacy TR → yeni canonical (örn. `/tr/teklif-iste` → `/tr/katalog`)
   - `sitemap.xml` fetch + grep `urunler`/`produktsiya`/`al-muntajat`
5. **SEO:**
   - Google Search Console → `sitemap.xml` resubmit
   - İlk 48 saat index status izle (optional)
6. **Memory + RESUME update:** bu oturum kapanışında entry.

## Risk ve yan etki

- **SEO:** Plan 4a'dan beri (~5 gün) canlıdaki EN canonical URL'ler 308 ile native URL'e yönlenir. Ranking transfer olur; reindex 1-2 hafta sürer. Backward-compat matrix sayesinde hiçbir indexed URL kaybolmaz.
- **next-intl v3 → v4 upgrade:** v4'te `pathnames` API benzer kaldı (aynı config şeması). v4 upgrade zamanı minor refactor (`createLocalizedPathnamesNavigation` deprecated, farklı helper adı). Scope sınırlı, Plan 4d'yi etkilemez.
- **E2E regression:** Mevcut spec'lerde hardcoded path'ler varsa bozulur. Branch'te hepsi güncellenir; CI yeşil olmadan push edilmez.
- **Internal link migration:** Next.js build type-check dynamic `<Link>` pattern'ları yakalar. ~2-3 dosya etkilenir.
- **LocaleSwitcher:** Next-intl `usePathname()` + `useRouter()` canonical key döndürür; switcher `router.replace(pathname, { locale: target })` pattern'ı pathnames'te otomatik doğru native URL'e gider. Mevcut plain `<a>` LocaleSwitcher root-path fix'i (memory: `feedback_next_intl_locale_switcher.md`) hâlâ geçerli — pathnames davranışını değiştirmez.
- **Catalog PDF placeholder:** Pathnames değişse de `/public/catalogs/*.pdf` URL'leri sabit kalır (locale-prefix'siz). Email template'teki download link bozulmaz.

## Kabul kriterleri

Plan 4d "bitti" denebilmesi için aşağıdakilerin hepsi geçmeli:

- [ ] `i18n/routing.ts` pathnames config eklenmiş, tip hata yok
- [ ] `lib/utils/slugify.ts` RU + AR map desteği, testler yeşil
- [ ] `lib/seo/routes.ts` + `app/sitemap.ts` per-locale native URL üretir
- [ ] `next.config.ts` redirect matrisi ~30 rule, EN locale hariç
- [ ] Internal dynamic `<Link>` pattern'ları type-safe obj syntax'a geçti
- [ ] Unit testler (mevcut 108+ + yeni slugify/routes/sitemap) yeşil
- [ ] E2E `pathname-mapping.spec.ts` geçer; mevcut E2E regression yok
- [ ] `pnpm verify` tam pipeline lokalde yeşil
- [ ] Canlı smoke: 4 locale × 3 canonical URL 200, 3 locale × 3 legacy URL 308 redirect, Plan 3 TR legacy → katalog 1-hop
- [ ] `sitemap.xml` live'da native slug'lar var
- [ ] LocaleSwitcher 4 locale arasında doğru native URL'e geçiş yapar
- [ ] Catalog request form submit çalışır (regression yok)
- [ ] Admin login + products CRUD regression yok

## Zaman planı

Tek oturum çalışması (4-6 saat). Sabah başlanıp öğleden sonra Coolify redeploy + canlı smoke tamamlanabilir.

- Foundation (pathnames config + slugify extension + SEO helper): ~1 saat
- Redirect matrix + internal Link migration: ~1 saat
- Unit + E2E test yazım + mevcut E2E güncelleme: ~1.5 saat
- Local verify + push + deploy + canlı smoke: ~1 saat
- Buffer: ~1 saat (unexpected regression, next-intl quirks)
