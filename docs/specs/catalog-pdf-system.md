# Kıta Plastik — Dinamik Katalog PDF Sistemi

## Görev

Kıta Plastik sitesine **on-demand PDF katalog generation** özelliği ekle. Kullanıcı "Katalog İndir" dediğinde, Supabase'deki güncel ürün verisinden, seçilen sektör ve dile göre özel tasarımlı bir PDF üret.

## Mevcut Stack (Zaten Var — Dokunma, Entegre Et)

- **Next.js** (App Router varsayımı — farklıysa adapt et)
- **Supabase PostgreSQL** — ürün verisi burada yaşıyor
- **Email lead capture** — `/katalog` sayfasında mevcut, onu bozma
- **4 dil**: TR / EN / RU / AR

## İlk Adım: Keşif

Kod yazmadan önce şunları incele ve anla:

1. Supabase `products` tablosunun mevcut şeması (i18n nasıl handle ediliyor?)
2. `/katalog` sayfasının implementasyonu (hangi form, nereye submit ediyor, email nereye kaydediyor?)
3. Hangi i18n library kullanılıyor (next-intl, next-i18next, custom)?
4. Vercel'de mi deploy ediliyor, yoksa başka bir yerde mi?

Bu bilgileri aldıktan sonra planı mevcut patterns'e göre adapt et.

---

## Mimari

### Endpoint

```
GET /api/catalog/[sector]/[lang]
```

- `sector`: `cam-yikama` | `kapak` | `tekstil` | `all`
- `lang`: `tr` | `en` | `ru` | `ar`
- Response: `application/pdf` stream

Toplam 4 × 4 = 16 variant.

### İç Akış

```
İstek gelir
  ↓
Cache kontrol et (sector + lang + dataHash)
  ↓ (miss)
Supabase'den ilgili sektörün ürünlerini çek
  ↓
Internal template page render: /catalog-template/[sector]/[lang]
  ↓
Puppeteer headless Chrome, networkidle + document.fonts.ready bekle
  ↓
page.pdf({ format: 'A4', printBackground: true, margin: 0 })
  ↓
PDF buffer cache'e yaz (TTL 24h)
  ↓
Client'a stream
```

### Cache Stratejisi

- **Cache backend**: Vercel KV (varsa) veya Supabase Storage bucket (`catalog-cache`)
- **Cache key**: `catalog-{sector}-{lang}-{dataHash}`
- **dataHash**: İlgili sektörün ürünlerinin `updated_at` max değerinden SHA-256
- **TTL**: 24 saat
- **Invalidation**: dataHash değişince otomatik, manuel invalidation için admin endpoint opsiyonel
- **Cold generate**: ~8-12 saniye, cache hit: milisaniye

### Email Capture Entegrasyonu

Mevcut `/katalog` form akışını **değiştirme**. Sadece şunu yap:

1. Form submit olduktan sonra email zaten kaydediliyor (mevcut davranış)
2. O adımın sonuna `/api/catalog/[sector]/[lang]` çağrısı ekle
3. PDF'i ya direkt indirme olarak user'a dön (önerilen) ya da email'e link gönder (mevcut akış bunu tercih ediyorsa)
4. Hangisinin mevcut pattern'e uyduğunu kendin belirle

---

## Veri Modeli (Varsayım, Adapt Et)

Eğer şema böyle değilse mevcut olana uyum sağla veya migration yaz:

```sql
-- products
id             uuid primary key
code           text not null unique    -- "KP-0214"
sector         text not null           -- "cam-yikama" | "kapak" | "tekstil"
material       text                    -- "HDPE · gıda onaylı" (dilden bağımsız teknik)
dimensions     text                    -- "Ø 38.0 × 18.5 mm" (dilden bağımsız)
weight_g       numeric(8,2)            -- 2.4
image_url      text                    -- Supabase Storage public URL, beyaz fon
display_order  int default 0
updated_at     timestamptz default now()

-- product_translations
product_id     uuid references products(id) on delete cascade
lang           text check (lang in ('tr','en','ru','ar'))
name           text not null           -- "Kilitli Emniyet Kapağı"
usage          text                    -- "Gıda ambalajı · tamper-evident"
primary key (product_id, lang)

-- sectors (opsiyonel, i18n için)
slug           text primary key        -- "kapak"
-- + translations table benzer şekilde
```

Material ve dimensions'ı dilden bağımsız tuttum çünkü teknik spec'ler uluslararası (HDPE her dilde HDPE, Ø 38 her dilde Ø 38). Eğer mevcut şemada her dile özel versiyon varsa ona adapt et.

---

## Tasarım Sistemi

### Renk Token'ları

```css
:root {
  --kp-navy: #0b2545;
  --kp-blue: #2563eb;
  --kp-white: #ffffff;
  --kp-surface: #f4f6f8;
  --kp-muted: rgba(11, 37, 69, 0.55);
  --kp-hairline: rgba(11, 37, 69, 0.2);
  --kp-hairline-light: rgba(11, 37, 69, 0.1);
}
```

### Tipografi

Google Fonts import (head'e ekle):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap"
  rel="stylesheet"
/>
```

Kullanım:

- **Display** (kapak, ürün adı, section başlığı): `'IBM Plex Serif', serif`
- **Body** (açıklamalar, genel metin): `'IBM Plex Sans', sans-serif`
- **Spec / Code / Label** (mono small caps): `'IBM Plex Mono', monospace`, `letter-spacing: 0.08em`
- **Arapça** (tüm AR metinler): `'IBM Plex Sans Arabic', sans-serif` — AR için serif Plex yok, tüm başlıklar da sans olur

### Print-Specific CSS

```css
@page {
  size: A4;
  margin: 0;
}

@media print {
  html,
  body {
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    overflow: hidden;
  }
  .page:last-child {
    page-break-after: auto;
  }
  .product-row {
    break-inside: avoid;
  }
}
```

---

## Sayfa Yapısı

Bir sektör kataloğu şu akıştan oluşur:

### 1. Kapak (1 sayfa)

- Full-bleed navy (`#0B2545`)
- **Üst strip** (border-bottom ile ayrılmış):
  - Sol: `kıtaPLASTİK` — IBM Plex Serif 15px, "kıta" 500 weight, "PLASTİK" 400 weight
  - Sağ: `EST · 1989 · BURSA` — IBM Plex Mono 10px, opacity 0.6
- **Merkez** (dikey ortada):
  - Üst küçük: `CİLT I — VOLUME I` mono 10px muted
  - Ana başlık: `Ürün Kataloğu 2026.` — IBM Plex Serif 54px, line-height 0.96, letter-spacing -0.018em. Sondaki `2026.` noktası `--kp-blue` renginde (editorial detail)
  - Alt italic: `Plastik enjeksiyonun mühendislik partneri.` — Serif italic 15px, opacity 0.88, max-width 280px
  - Dil başına değişken tagline — i18n dict'ten çek
- **Alt strip** (border-top ile):
  - Sol üst satır: `3 SEKTÖR · 36 YIL · ±0.02MM` mono 10px muted
  - Sol alt: `Cam Yıkama · Kapak · Tekstil` sans 12px 500
  - Sağ: `TR / EN / RU / AR` mono 10px dikey listeleme, opacity 0.5
- **Dekoratif**: Sağ üstte `opacity: 0.08` eşmerkezli daireler SVG pattern — plastik kapak top view'i

Sektör adı kapağa eklenebilir (altta küçük notation: `— Sektör 02 / Kapak`).

### 2. Kategori Açılış Sayfası (1 sayfa)

- Beyaz bg
- Üst strip (mono 10px, navy, border-bottom):
  - Sol: `SEKTÖR 02 / KAPAK`
  - Sağ: sayfa numarası `002` — blue renkli
- Büyük başlık (Serif 40-48px): `Gıda & kozmetik ambalajı` (sektöre göre i18n dict)
- Italic subtitle 14-16px muted
- Editorial açıklama (2-3 paragraf, Sans 12-13px, line-height 1.6) — sektörün teknik özeti
- Alt stats grid (3-4 kutu): Çap aralığı, malzemeler, MOQ, Sertifikalar — mono label + sans value
- Alt strip: `KITAPLASTIK · KATALOG 2026` + sayfa no

### 3. Ürün Liste Sayfaları (N sayfa, 3 ürün/sayfa)

- Beyaz bg, padding 26px 28px
- **Üst strip** (mono 10px, border-bottom 0.5px navy):
  - `SEKTÖR 02 / KAPAK` · sayfa no (blue)
- **Section header**:
  - `KAPAK ÜRÜNLERİ` mono 9.5px blue
  - Serif 24px başlık: `Gıda & kozmetik ambalajı`
  - Italic 11.5px subtitle muted: çap aralığı bilgisi
- **Ürün satırı** (`.product-row`, 3 adet, her biri border-top 0.5px hairline):
  - **Sol sütun (118px kare)**:
    - `background: var(--kp-surface)`, `aspect-ratio: 1`
    - Ürün fotoğrafı ortada (Supabase `image_url`, `object-fit: contain`, padding)
    - Sol alt köşede `01` / `02` / `03` satır numarası mono 8.5px muted
  - **Sağ sütun**:
    - Üst mono 9px muted: ürün kodu (`KP–0214`)
    - Serif 17px 400, line-height 1.1: ürün adı
    - Info grid 9.5px mono, iki kolon (74px label + 1fr value):
      - `MALZEME` → material
      - `ÖLÇÜ` → dimensions
      - `KULLANIM` → usage (i18n)
      - `AĞIRLIK` → weight + ` g`
    - Label'lar muted, value'lar navy
- **Alt strip** (absolute bottom): `KITAPLASTIK · KATALOG 2026` · sayfa no

**Boşluklama**: Satırlar arasında kutu yok, sadece 0.5px navy hairline üstte. Whitespace ayrıcı.

### 4. Arka Kapak (1 sayfa)

- Full-bleed navy
- İletişim bilgileri (serif başlık + sans detay):
  - Adres · Telefon · Email · Web
- Referans marka logoları (opsiyonel, flat beyaz monokrom)
- QR kod: o sektörün site sayfasına link
- Alt: `© 2026 Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.`

---

## Arapça RTL Variant

```css
[dir="rtl"] .kp-page {
  direction: rtl;
}
[dir="rtl"] .product-row {
  grid-template-columns: 1fr 118px;
}
[dir="rtl"] .info-grid {
  grid-template-columns: 1fr 74px;
}
/* Sayfa numarası, ürün kodu, ölçüler LTR kalır (engineering convention) */
.kp-mono {
  direction: ltr;
  unicode-bidi: embed;
  display: inline-block;
}
```

AR template'de:

- `<html dir="rtl" lang="ar">`
- Tüm font-family değerlerini `'IBM Plex Sans Arabic'` ile override et
- Başlıklar da Sans olur (AR için Plex Serif yok)
- Rakamlar Latin kalır: "Ø 38.0 mm" → Arapça katalogda da aynen böyle yazılır, Arapça rakam (٣٨) KULLANMA — bu B2B engineering standardı

---

## Dosya Yapısı (Öneri)

```
app/
  api/
    catalog/
      [sector]/
        [lang]/
          route.ts              # PDF endpoint
  catalog-template/
    [sector]/
      [lang]/
        page.tsx                # Puppeteer'ın yüklediği hidden HTML render
    layout.tsx                  # Minimal, sadece fonts + globals
    globals.css                 # Tasarım sistemi tokens + print CSS

lib/
  catalog/
    fetch-products.ts           # Supabase query + hash
    pdf-generator.ts            # Puppeteer wrapper
    cache.ts                    # KV veya Storage cache layer
    i18n.ts                     # UI string dictionary (başlıklar, tagline'lar, kategoriler)

components/
  catalog/
    Cover.tsx
    SectionOpener.tsx
    ProductList.tsx             # Sayfalara böler, 3'er grup
    ProductRow.tsx              # Tek ürün satırı
    BackCover.tsx
    CatalogDocument.tsx         # Tüm sayfaları sıraya dizer
```

---

## Bağımlılıklar

```bash
pnpm add puppeteer-core @sparticuz/chromium-min
pnpm add -D puppeteer
```

### Vercel Deployment Notu

Vercel'de `@sparticuz/chromium-min` kullan, Chromium binary'sini external URL'den çek (bundle size limitine takılmaz). Eğer Vercel Hobby plan'dasin ve 50MB function size aşılıyorsa, **alternatif**: küçük bir Railway/Fly.io Node servisi kur, Next.js API route'tan HTTP ile oraya proxy at.

---

## Önemli İmplementasyon Detayları

1. **Puppeteer font bekleme**: PDF almadan önce fontların yüklendiğinden emin ol:

   ```ts
   await page.goto(url, { waitUntil: "networkidle0" });
   await page.evaluateHandle("document.fonts.ready");
   ```

2. **Image URL'leri absolute olmalı**: Supabase Storage public URL veya signed URL ver, Puppeteer external image'ı çekebilmeli.

3. **Türkçe ve Arapça karakterler**: IBM Plex hepsini destekliyor, font dosyalarında subset kısıtlaması koyma. `&subset=latin,latin-ext,cyrillic,cyrillic-ext,arabic` olsun eğer Google Fonts'ta kontrol ediyorsan.

4. **Page break kontrolü**: `.product-row { break-inside: avoid }` kesinlikle olmalı, yoksa ürün ikiye bölünür.

5. **PDF meta**: `page.pdf()` çağrısında `displayHeaderFooter: false`, `preferCSSPageSize: true`.

6. **Template security**: `/catalog-template/*` route'unu prod'da direkt erişime kapat (middleware ile internal-only yap) ya da robots.txt'te disallow et. Yoksa Google indexler.

7. **Hata durumu**: PDF generation fail olursa user'a clean mesaj göster, ham error stack gösterme. Sentry veya benzeri error tracking varsa ona yaz.

---

## Test / Doğrulama

1. **Local dev**: `pnpm dev`, `/catalog-template/kapak/tr` tarayıcıda aç, HTML/CSS render'ı kontrol et
2. **PDF endpoint**: `curl http://localhost:3000/api/catalog/kapak/tr -o test.pdf`
3. **Tüm kombinasyonlar matrix testi**: 3 sektör × 4 dil + `all` × 4 dil = 16 PDF. Her biri üretilsin, açılsın, doğru görünsün.
4. **Arapça RTL özellikle kontrol**: Layout aynalı mı, rakamlar LTR mi, font doğru mu.
5. **Print-level**: 300 DPI'da çıktı alındığında karakter/çizgi bozulmuyor mu.
6. **Page break**: Sektörde 7 ürün varsa → 1 cover + 1 opener + 3 list (3+3+1) + 1 back = 6 sayfa. Satır ikiye bölünmemiş mi.
7. **Cache**: İkinci istek hızlı mı (<500ms).
8. **Ürün eklendiğinde**: Supabase'de bir ürün güncelle → sonraki istekte dataHash değişmeli, cache invalidate olmalı, yeni PDF üretmeli.

---

## Adım Sırası

1. **Keşif**: Mevcut Supabase şeması + `/katalog` sayfa kodu + email capture akışı + i18n library'yi incele. Plan çıkar.
2. **Şema**: Gerekiyorsa `products` / `product_translations` migration'ı.
3. **Tasarım sistemi**: `globals.css` içine tokens + print CSS.
4. **Bileşenler**: `Cover`, `SectionOpener`, `ProductRow`, `ProductList`, `BackCover`, `CatalogDocument`.
5. **Template sayfası**: `/catalog-template/[sector]/[lang]/page.tsx` — Supabase'den fetch + bileşenleri birleştir.
6. **API endpoint**: `/api/catalog/[sector]/[lang]/route.ts` — Puppeteer ile PDF üret, stream dön.
7. **Cache layer**: Vercel KV veya Supabase Storage.
8. **Form entegrasyonu**: Mevcut `/katalog` formuna PDF endpoint bağlantısı.
9. **Test matrix**: 16 kombinasyon + Arapça + page break.
10. **Deploy**: Vercel'e çıkış, prod'da end-to-end test.

---

## Tasarıma Sadakat — Önemli

Tasarım bilinçli kararlarla şekillendi. Şunları **değiştirme**:

- Navy `#0B2545` + blue accent `#2563EB` — paleti genişletme
- IBM Plex ailesi — başka fonta geçme
- 3 ürün/sayfa list düzen — kutu/card görünümü verme, hairline ayraçla kal
- Label mono uppercase + value sans — "düz tablo" yapıp tipografiyi karıştırma
- `2026.` sonundaki mavi nokta editorial detay — atma
- Ürün satır numaraları (01/02/03) resim köşesinde mono — atma
- Sayfa numaraları blue, mono, sağ üst + sağ alt — consistent kalmalı

"Daha modern" veya "daha renkli" veya "daha düz" yönünde ilham alma. Bu brand tanımlaması.
