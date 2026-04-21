# Plan 4a — Public URL'lerin İngilizce'ye Geçirilmesi

**Tarih:** 2026-04-21
**Durum:** Spec tamamlandı, onay bekliyor
**Tahmini süre:** 1 gün (6-10 saat tek oturum)
**Bağımlılık:** Yok. Plan 4b (Admin Products CRUD) bunun üzerine gelir.

---

## Ne yapıyoruz?

Site içindeki Türkçe URL segmentlerini (`/urunler`, `/sektorler`, `/hakkimizda`...) İngilizce'ye çeviriyoruz (`/products`, `/sectors`, `/about`...). Her dilde (TR/EN/RU/AR) URL aynı İngilizce slug kullanacak. Eski URL'lere gelenler otomatik yeni URL'e yönlendirilir (301 redirect).

Admin paneldeki küçük bir uyumsuzluğu da düzeltiyoruz: `/admin/ayarlar/bildirimler` → `/admin/settings/notifications` (diğer admin yolları zaten İngilizce).

## Neden?

- Kod içinde URL segment'leri İngilizce tutmak geliştirici tarafında tutarlılık sağlıyor. Mevcut `/admin/inbox`, `/admin/login` zaten İngilizce — public tarafı da aynı konvansiyona hizalanıyor.
- Plan 4b'de açılacak ürün detay sayfaları `/[locale]/products/[slug]` yapısında olacak. URL rename'i önce bitirip temiz başlamak, birden fazla büyük değişikliği aynı anda sevk etme riskini azaltıyor.

## Site ziyaretçisi ne görecek?

Pratikte **neredeyse hiç fark hissetmeyecek** — eski URL'den gelen otomatik yeni URL'e yönleniyor (browser bir flaş gibi göstermeden). Tarayıcı URL çubuğunda görüntülenen adres değişiyor:

| Eski (şu an canlı) | Yeni (Plan 4a sonrası) |
|---|---|
| `kitaplastik.com/tr/urunler` | `kitaplastik.com/tr/products` |
| `kitaplastik.com/en/hakkimizda` | `kitaplastik.com/en/about` |
| `kitaplastik.com/ar/iletisim` | `kitaplastik.com/ar/contact` |

Google arama sonuçlarında eski URL'ler 1-2 hafta içinde yeni URL'e güncellenir (301 redirect ile ranking transfer olur).

## Rename haritası

**Public route'lar (12 adet, her locale için):**

```
/urunler                           →  /products
/sektorler                         →  /sectors
/sektorler/cam-yikama              →  /sectors/bottle-washing
/sektorler/kapak                   →  /sectors/caps
/sektorler/tekstil                 →  /sectors/textile
/hakkimizda                        →  /about
/iletisim                          →  /contact
/referanslar                       →  /references
/teklif-iste                       →  /request-quote
/teklif-iste/ozel-uretim           →  /request-quote/custom
/teklif-iste/standart              →  /request-quote/standard
```

**Admin route:**

```
/admin/ayarlar/bildirimler         →  /admin/settings/notifications
```

## Risk ve yan etki

- **SEO:** Google index'teki eski sayfalar 301 redirect ile yeni URL'e transfer olur. Ranking'in büyük bölümü korunur ama yeniden crawl 1-2 hafta sürer. Google Search Console'da yeni sitemap submit edilecek.
- **Mevcut E2E testlerin bir kısmı kırılır** — route path'leri test selector'larında geçiyor. Rename commit'i ile aynı branch'te güncellenecek; CI yeşil olmadan sevk edilmeyecek.
- **Internal link'ler** grep ile taranır. Next.js build sırasında kırık link'i otomatik yakalar.
- **Dil açısından:** Türk kullanıcı arama motorunda "urunler" yerine "products" görmeye başlayacak. Marjinal UX farkı ama Kıta Plastik B2B odaklı, müşteri genellikle kurumsal kanaldan geliyor, SEO organic pay ikincil. Kabul edilmiş risk.

## Ne zaman bitecek?

Tek oturum çalışması (6-10 saat). Sabah başlanıp akşama Coolify redeploy + canlı smoke tamamlanabilir.

## Kabul kriterleri

Plan 4a "bitti" denebilmesi için aşağıdakilerin hepsi geçmeli:

- [ ] 11 eski public URL + 1 eski admin URL'ye `curl -I` → HTTP 301, location header yeni URL
- [ ] 11 yeni public URL + 1 yeni admin URL'ye `curl -I` → HTTP 200 (veya admin için auth required cevabı)
- [ ] Site gezintisi 4 locale × 12 sayfa → hiçbir 404 yok
- [ ] LocaleSwitcher (TR/EN/RU/AR) her sayfada doğru locale'in aynı path'ine gidiyor (örn. `/tr/products` → TR'yi EN yap → `/en/products`)
- [ ] Unit testler (73) ve E2E testler (62) güncel ve yeşil
- [ ] GitHub Actions CI yeşil
- [ ] Coolify redeploy sonrası canlı site çalışıyor
- [ ] Google Search Console'a yeni `sitemap.xml` submit edildi
- [ ] İletişim formu + RFQ submit + admin login — hiçbirinde regresyon yok

---

## İmplementer Notları (teknik)

### Dokunulacak dosyalar

**Klasör rename'leri (12 adet):**
```
app/[locale]/urunler              →  app/[locale]/products
app/[locale]/sektorler            →  app/[locale]/sectors
app/[locale]/sektorler/cam-yikama →  app/[locale]/sectors/bottle-washing
app/[locale]/sektorler/kapak      →  app/[locale]/sectors/caps
app/[locale]/sektorler/tekstil    →  app/[locale]/sectors/textile
app/[locale]/hakkimizda           →  app/[locale]/about
app/[locale]/iletisim             →  app/[locale]/contact
app/[locale]/referanslar          →  app/[locale]/references
app/[locale]/teklif-iste          →  app/[locale]/request-quote
app/[locale]/teklif-iste/ozel-uretim  →  app/[locale]/request-quote/custom
app/[locale]/teklif-iste/standart     →  app/[locale]/request-quote/standard
app/admin/ayarlar/bildirimler     →  app/admin/settings/notifications
```

`git mv` kullan — history korunur.

**Kod dosyaları:**
- `components/layout/Header.tsx` — nav link href'leri
- `components/layout/Footer.tsx` — footer link'leri
- `components/layout/LocaleSwitcher.tsx` — path mapping (varsa)
- `app/sitemap.ts` — 48 URL yeniden üretilir (12 path × 4 locale)
- `next.config.ts` — `redirects()` fonksiyonu eklenir (12 kural)
- `tests/e2e/**` — path içeren selector/assertion'lar (~15-20 spec)
- İçeride `<Link href="...">` geçen tüm component dosyaları grep ile taranır ve güncellenir

**Mesaj dosyaları:**
- `messages/{tr,en,ru,ar}/nav.json` — label'lar TR/EN/RU/AR dilinde kalır ("Ürünler"/"Products"/...). Sadece Header içinde href'ler hardcoded (veya config) değişir. nav.json dokunulmaz (label-based).

### 301 redirects (next.config.ts)

```ts
const redirects = async () => [
  { source: '/:locale(tr|en|ru|ar)/urunler',
    destination: '/:locale/products', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/urunler/:rest*',
    destination: '/:locale/products/:rest*', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/sektorler',
    destination: '/:locale/sectors', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/sektorler/cam-yikama',
    destination: '/:locale/sectors/bottle-washing', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/sektorler/kapak',
    destination: '/:locale/sectors/caps', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/sektorler/tekstil',
    destination: '/:locale/sectors/textile', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/hakkimizda',
    destination: '/:locale/about', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/iletisim',
    destination: '/:locale/contact', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/referanslar',
    destination: '/:locale/references', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/teklif-iste',
    destination: '/:locale/request-quote', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/teklif-iste/ozel-uretim',
    destination: '/:locale/request-quote/custom', permanent: true },
  { source: '/:locale(tr|en|ru|ar)/teklif-iste/standart',
    destination: '/:locale/request-quote/standard', permanent: true },
  { source: '/admin/ayarlar/bildirimler',
    destination: '/admin/settings/notifications', permanent: true },
]
```

### Testing

**Yeni E2E spec:** `tests/e2e/url-redirects.spec.ts`
- 12 path × 4 locale = 44 case (+ 1 admin path = 45)
- Her case: `page.goto(oldUrl)` → assert `page.url()` yeni URL içeriyor, redirect detected

**Mevcut E2E:** path içeren `tests/e2e/**` spec'leri güncellenir. Tipik yerler: contact form, RFQ flow, locale switcher.

**Unit:** `tests/unit/app/sitemap.test.ts` (yoksa yazılır) — 48 URL hepsi yeni path, 0 eski path.

### Implementation sırası (önerilen)

1. Feature branch aç: `feat/plan4a-url-migration`
2. Her bir klasörü `git mv` ile rename et
3. Grep ile eski path'leri bul, kodda güncelle
4. `app/sitemap.ts`'i güncelle
5. `next.config.ts`'e `redirects()` ekle
6. E2E test'leri güncelle + yeni `url-redirects.spec.ts` yaz
7. `pnpm typecheck` + `pnpm test` + `pnpm e2e` → hepsi yeşil
8. Commit + push → CI yeşil
9. Merge main
10. Coolify redeploy → canlı smoke (curl + browser)
11. Google Search Console yeni sitemap submit

### Bağlılık / sonraki iş

Plan 4a canlıda oturunca Plan 4b'ye geçilir (Admin Products CRUD + `/[locale]/products` detay sayfası). Plan 4b `/products` route'una yeni sayfa ekler — Plan 4a rename olmadan yapsaydık çifte rename riski olacaktı.
