# Kıta Plastik Web Sitesi — Tasarım Dökümanı

**Tarih:** 2026-04-16
**Proje:** kitaplastik.com (Kıta Plastik ve Tekstil San. Tic. Ltd. Şti., Bursa)
**Durum:** Brainstorming tamamlandı — implementation plan'a hazır.

---

## 1. Bağlam ve Hedef

### 1.1. Şirket Bağlamı

Kıta Plastik ve Tekstil San. Tic. Ltd. Şti., 1989'dan beri Bursa'da faaliyet gösteren plastik enjeksiyon ve tekstil üretici şirketidir. Üç ana sektörde hizmet verir:

- **Cam yıkama** — endüstriyel cam yıkama makineleri için bileşenler
- **Kapak** — endüstriyel ve ambalaj kapakları
- **Tekstil** — tekstil sektörü için plastik aksesuarlar

Şirket aynı zamanda müşteriye özel **kalıp tasarım ve ürün geliştirme** (custom mühendislik) hizmeti verir.

### 1.2. Web Sitesi Hedefi

İhracat odaklı (4 dil) bir B2B kurumsal vitrin + RFQ (teklif talep) funnel + admin paneli. Hedefler:

1. Yurt içi ve yurt dışı müşteri adaylarının şirketi profesyonel bir teknik partner olarak değerlendirebilmesi
2. Hibrit pozisyon: hem **standart sektörel ürünler** (katalogdan seç → talep et) hem **custom mühendislik** (proje brief → fizibilite → kalıp/üretim) eşit ağırlıkta
3. RFQ taleplerini kaybetmeden, kategorilenmiş, hızlı yanıtlanabilir hâle getirmek
4. Şirketin 36+ yıllık mirasını (1989'dan beri) güven sinyali olarak öne çıkarmak

### 1.3. Hedef Kullanıcı Personas

- **Endüstriyel alıcı (yurt içi):** Türk OEM/distribütör; cam yıkama makinesi üreticisi, ambalajcı, vb. Türkçe arayüz, hızlı RFQ ister.
- **İhracat alıcısı (Avrupa, Rusya, MENA):** Kendi ülkesinde plastik parça tedarikçisi arayan B2B alıcı. İngilizce/Rusça/Arapça arayüz, teknik spesifikasyon, sertifika ister.
- **Custom proje sahibi:** Kendi ürününü Türkiye'de ürettirmek isteyen yabancı veya yerli marka. Mühendislik desteği, NDA, fizibilite ister.
- **Admin (içerik yöneticisi):** Şirket içi 1-3 kişilik ekip; Türkçe konuşur, teknik değil. RFQ'ları görür, durum atar, ürün katalogunu günceller.

---

## 2. Onaylanan Kararlar (Brainstorming Özeti)

| # | Karar | Seçim | Gerekçe |
|---|---|---|---|
| 1 | Site scope | Vitrin + RFQ funnel + admin paneli | Tam B2B portal başlangıç için fazla; vitrin tek başına lead'leri kaybeder. |
| 2 | Pozisyon | Hibrit: hem sektörel ürün hem custom mühendislik | Şirket gerçekten her iki tarafta da iş yapıyor. |
| 3 | İçerik durumu | Kısmen hazır, CAD/STEP **yok** | 3D ürün modeli gösteremeyiz — generic atmosferik 3D'ye yönelinir. |
| 4 | Logo yaklaşımı | Hafif rötuş (B) | Orijinal dosya kayıp; 36 yıllık marka tanınırlığını koruyalım, dijital ekranlarda cilalanır. |
| 5 | 3D karakteri | Atmosferik akış (A) | "Abartılı değil ama kaliteli" tarifine en uygun; içerik öne çıkar, 3D atmosfer olur. |
| 6 | Görsel ton | Industrial Precision (A) | Atmosferik 3D ile birebir uyum; B2B alıcısı ciddiyet beklentisi karşılanır. |
| 7 | RFQ kapsamı | Standart (B) — iki funnel, ürün katalog yönetimi | A elle iş yükü doğurur; C admin overhead'i fazla. |
| 8 | Dil stratejisi | 4 dil eş zamanlı, AI çeviri + glossary + spot review | Profesyonel hissi spot review ile koruyup AI ile maliyet/hızı optimize ediyoruz. |
| 9 | Mimari | Vercel + Supabase (FastAPI yok) | Tek backend, magic link auth, RLS güvenlik, setup ≈1 gün. |
| 10 | Domain | kitaplastik.com (hazır) | Vercel'e CNAME ile bağlanır, SSL otomatik. |

---

## 3. Bilgi Mimarisi (IA) ve Sayfa Haritası

### 3.1. Sayfa Haritası

```
kitaplastik.com/[locale]/
├─ /                                Anasayfa
├─ /sektorler/
│   ├─ /sektorler/cam-yikama
│   ├─ /sektorler/kapak
│   └─ /sektorler/tekstil
├─ /urunler/                        Standart ürün katalogu
│   └─ /urunler/[slug]
├─ /muhendislik/                    Custom mühendislik
├─ /atolye/                         Üretim atölyesi
├─ /kalite/                         Kalite & sertifikalar
├─ /hakkimizda/                     1989'dan beri — şirket hikâyesi
├─ /teklif-iste/                    RFQ hub (2 funnel)
│   ├─ /teklif-iste/standart
│   └─ /teklif-iste/ozel-uretim
├─ /iletisim/
├─ /rfq/[uuid]/                     Müşteri tracking (Faz 2)
└─ /admin/                          Admin paneli (Auth korumalı)
    ├─ /admin/inbox
    ├─ /admin/inbox/[id]
    ├─ /admin/urunler
    ├─ /admin/sektorler
    └─ /admin/ayarlar
```

### 3.2. URL Yapısı ve Locale

- **Subdirectory tabanlı:** `kitaplastik.com/tr/`, `/en/`, `/ru/`, `/ar/`
- **Default locale:** TR (kitaplastik.com → kitaplastik.com/tr/ redirect)
- **hreflang:** Her sayfada 4 alternatif dil etiketi
- **Canonical:** Locale dahil

### 3.3. Anasayfa (Hero) İçerik Bloğu Sırası

1. **Hero** — atmosferik 3D arkaplan, başlık, alt başlık, çift CTA ("Custom Teklif" + "Standart Ürün Katalogu")
2. **Sektör grid** — 3 büyük kart (cam yıkama, kapak, tekstil)
3. **Hibrit pozisyon vurgusu** — "Standart ürünlerimiz / Custom çözümlerimiz" iki sütun
4. **Sayılar şeridi** — 36 yıl, 3 sektör, 4 dil, X+ proje
5. **Sertifika strip** — ISO logoları (varsa)
6. **Süreç özeti** — custom için 4 adım (brief → fizibilite → kalıp → üretim)
7. **Son projeler / referanslar** — anonim case özetleri (varsa)
8. **Atölye görseli + lokasyon** — Bursa harita
9. **CTA bandı** — "Projenizi konuşalım" + "Teklif İste" buton
10. **Footer** — sayfa linkleri, dil seçici, iletişim, şirket tam adı, sosyal

### 3.4. Sektör Sayfası Standart Şablonu

1. **Hero** — sektöre özel renk teması (cam yıkama→cyan, kapak→altın, tekstil→mor)
2. **Sektör tanımı + ihtiyacı** — neden plastik bu sektörde önemli
3. **Yetkinlikler** — bu sektör için yapabildiklerimiz (malzeme, üretim hattı)
4. **Ürünler/parçalar** — bu sektördeki standart ürünlerin grid'i (urunler tablosundan filter)
5. **Custom hizmet** — "bu sektörde özel proje mi? brief'inizi paylaşın"
6. **CTA** — sektöre özel RFQ butonu

### 3.5. Custom Mühendislik Sayfası

1. **Hero** — "Bursa'dan global B2B mühendislik partneri"
2. **Süreç (4-5 adım)** — brief, fizibilite, kalıp tasarım, ön üretim, seri üretim
3. **Yetkinlikler matrisi** — malzeme, makine, kapasite, tolerans
4. **NDA / Gizlilik** — proje gizliliği vurgusu
5. **Referanslar / case özetleri**
6. **Custom RFQ CTA**

---

## 4. Pozisyon ve Mesajlaşma

### 4.1. Marka Sesleniş

- **Profesyonel, sade, Türk endüstriyel mirası**
- Abartısız claim'ler — somut sayılar (36 yıl, 3 sektör, kapasite) ön planda
- Müşteri-merkezli ("biz" değil "siz") — özellikle EN/RU/AR'de
- Cesur tek cümle başlıklar, açıklamalı alt metin

### 4.2. Anahtar Mesajlar (Hero Adayları)

- TR: "Plastik enjeksiyonun mühendislik partneri. 1989'dan beri Bursa'dan dünyaya."
- EN: "Engineering partner in plastic injection. From Bursa since 1989."
- RU: "Инженерный партнёр в литье пластмасс. Из Бурсы с 1989 года."
- AR: "شريكك الهندسي في حقن البلاستيك. من بورصة منذ 1989."

### 4.3. CTA Sözcüğü Glossary'si (Tutarlılık)

| TR | EN | RU | AR |
|---|---|---|---|
| Teklif İste | Request a Quote | Запросить расчёт | اطلب عرض سعر |
| Standart Ürünler | Standard Products | Стандартные изделия | المنتجات القياسية |
| Custom Üretim | Custom Manufacturing | Заказное производство | التصنيع حسب الطلب |
| Yetkinlikler | Capabilities | Возможности | القدرات |
| Sektörler | Industries | Отрасли | القطاعات |

---

## 5. Görsel Tasarım Sistemi

### 5.1. Logo

- **Yön:** B (hafif rötuş) — fotoğraftaki orijinal logo SVG olarak yeniden çizilir
- **Lockup:** Globe sembolü + "KITA" wordmark + "1989'DAN BERİ" pill badge
- **Renkler:** Kırmızı `#b8252e`, lacivert `#0e3265`, yeşil aksan `#1f9e6b`
- **Varyantlar:**
  - Full color (varsayılan)
  - Monokrom koyu (açık zemin için)
  - Monokrom beyaz (koyu zemin için)
  - Wordmark-only (tight header için)
  - Favicon (32×32, 192×192, 512×512)
  - Open Graph (1200×630, dil bazında)
  - E-posta footer (PNG, 320×80)

### 5.2. Renk Paleti (Industrial Precision)

```
--bg-primary:     #0a1628   (koyu lacivert — hero, koyu temalı sayfalar)
--bg-secondary:   #1a2540   (kart, panel)
--bg-elevated:    #1f3a5f   (hover, vurgu)
--surface-light:  #f7f8fa   (açık tema arka plan)
--surface-card:   #ffffff   (açık tema kart)
--border-subtle:  #2a3a52   (koyu) / #d8dde5 (açık)
--text-primary:   #e6ebf2   (koyu) / #0a1628 (açık)
--text-secondary: #8ba4c5   (koyu) / #5a6878 (açık)
--accent-blue:    #5b8fc7   (etiket, link)
--accent-cyan:    #7fb0e0   (vurgu)
--accent-red:     #b8252e   (KITA aksan, CTA, hata)
--accent-green:   #1f9e6b   (başarı, custom mühendislik)

# Sektör temaları
--sector-cam-yikama: #5b8fc7  (cyan/su)
--sector-kapak:      #b8a040  (altın/amber)
--sector-tekstil:    #8a5fb8  (mor/menekşe)
```

### 5.3. Tipografi

- **UI / gövde:** `Inter` (variable, latin + cyrillic; fallback system-ui)
- **Etiket / sayı / monospace:** `JetBrains Mono` (latin + cyrillic)
- **Arapça:** `IBM Plex Sans Arabic` (UI), `IBM Plex Mono Arabic` yoksa fallback Inter Arabic
- **Boyut ölçeği (Tailwind):** xs 0.75 / sm 0.875 / base 1 / lg 1.125 / xl 1.25 / 2xl 1.5 / 3xl 1.875 / 4xl 2.25 / 5xl 3 / 6xl 4 (rem)
- **Heading hiyerarşisi:** H1 (5xl/6xl, 700, -1px tracking) · H2 (3xl/4xl, 600) · H3 (xl/2xl, 600) · H4 (lg, 600)

### 5.4. Spacing, Grid, Border

- **Spacing scale:** Tailwind default (4px base)
- **Container max-width:** 1280px (XL)
- **Grid:** 12 sütun, 24px gap (desktop), 16px (tablet), 12px (mobile)
- **Border radius:** sm 2px (kart, button) · md 4px · lg 8px · full
- **Border style:** ince (1px), `--border-subtle` rengi
- **Köşe felsefesi:** Industrial Precision için **keskin köşeler** ön planda (rounded-sm 2px), yumuşak için 4px max

### 5.5. Bileşen Stilleri (shadcn/ui temel)

- **Button:** primary (kırmızı), secondary (outline), tertiary (text-only), danger
- **Card:** ince border, blur'lu cam efekt (koyu tema), gölge yok ya da çok hafif
- **Input:** border-bottom only (koyu tema), bordered (açık tema)
- **Badge:** mono yazı tipinde, küçük, sektör/durum gösterimi
- **Tabs:** alt çizgi (under-line) variant
- **Modal/Sheet:** Radix Dialog tabanlı, RTL'de doğru kayar
- **Tooltip:** Radix Tooltip, mono yazı tipi

---

## 6. 3D Tasarım Yaklaşımı (Atmosferik)

### 6.1. Karakter

Soyut polimer/sıvı akışı, ışık parçacıkları (particles), derin gradient. **Spesifik ürün modeli yok** (CAD dosyası yok, ayrıca generic 3D atmosferin bütünlük için tutarlı). Hedef: "ekran arka planı meditasyona benzer durur, içeriği boğmaz."

### 6.2. Yerleşim Yerleri

1. **Hero canvas** — anasayfa ve major landing'lerde (sektör hub, custom mühendislik, hakkımızda)
2. **Section break ambient** — sayfanın 3-4 yerinde, scroll-triggered yumuşak geçiş
3. **Sektör hero rengi varyantı** — her sektör sayfasında farklı renk teması ama aynı shader

### 6.3. Teknik Yaklaşım

- **Kütüphane:** `react-three-fiber` (R3F) + `@react-three/drei`
- **Shader:** Custom GLSL fragment shader — perlin noise + flowmap + light particles
- **Animasyon:** `useFrame` ile raf-based, throttled (60fps target, mobil 30fps)
- **Mouse parallax:** Düşük yoğunluk, smooth lerp
- **Postprocessing (opsiyonel):** Hafif bloom, ileride
- **Component import:** `dynamic(() => import('@/components/three/HeroCanvas'), { ssr: false })`

### 6.4. Performans Bütçesi

| Metrik | Hedef |
|---|---|
| Hero 3D bundle (gzipped) | <120 KB |
| First Contentful Paint | <1.5s |
| Time to Interactive | <3s (3G mobile) |
| GPU memory (mobile) | <50 MB |
| Frame rate | 60fps desktop, 30fps mobile minimum |

### 6.5. Fallback Stratejisi

- **WebGL desteklemiyor:** CSS gradient + SVG noise + subtle CSS animation
- **prefers-reduced-motion: reduce:** Static gradient (animasyon yok)
- **Düşük güç tespiti:** `navigator.hardwareConcurrency < 4` veya `connection.saveData` → static gradient
- **Mobil:** Daha basit shader (1 layer particles, 1 flowmap)

### 6.6. Accessibility

- Canvas `aria-hidden="true"` (dekoratif)
- Hero metni canvas'ın üzerinde, contrast WCAG AA
- Kullanıcı reduce-motion açtıysa 3D pasif

---

## 7. Çoklu Dil ve Çeviri Pipeline

### 7.1. Diller

| Locale | Dil | RTL | Önem |
|---|---|---|---|
| `tr` | Türkçe | LTR | Ana içerik kaynağı |
| `en` | İngilizce | LTR | İhracat #1 |
| `ru` | Rusça | LTR | Rusya/CIS pazarı |
| `ar` | Arapça | **RTL** | MENA pazarı |

### 7.2. URL Yapısı

`kitaplastik.com/{locale}/...` — Next.js `next-intl` middleware ile yönlendirme.

- Default locale (TR) görünür: `kitaplastik.com/tr/sektorler/cam-yikama`
- Kök istek `kitaplastik.com/` → `/tr/` redirect (302)
- hreflang her sayfa: `<link rel="alternate" hreflang="tr" href="..."/>` × 4 + `x-default`

### 7.3. Çeviri Pipeline (Build-time)

```
messages/
├── tr/
│   ├── common.json
│   ├── home.json
│   ├── sectors.json
│   ├── rfq.json
│   └── admin.json
├── en/  (auto-generated)
├── ru/  (auto-generated)
└── ar/  (auto-generated)

scripts/translate.py
glossary.json
```

**Akış:**
1. Geliştirici/içerik yöneticisi sadece `messages/tr/*.json` günceller
2. Git push → GitHub Actions çalışır
3. `scripts/translate.py`:
   - TR JSON dosyalarını okur
   - Her hedef dil için var olan JSON ile diff alır → değişen key'leri tespit eder
   - Glossary'i system prompt'a enjekte eder (terim tutarlılığı zorunlu)
   - Claude API ile dil bazında çeviri (`claude-opus-4-7` veya `claude-sonnet-4-6`)
   - Yeni JSON dosyalarını yazar
4. Eğer key değişikliği varsa otomatik PR açar (`chore(i18n): translations update`)
5. Belirli key'ler `"_review": true` flag'i taşır (hero, RFQ form alanları, hakkımızda, kalite) — PR review sırasında insan kontrolü
6. Merge → Vercel deploy → 4 dil canlı

**Glossary örnek (`glossary.json`):**

```json
{
  "plastik enjeksiyon": {
    "en": "plastic injection moulding",
    "ru": "литьё пластмасс под давлением",
    "ar": "حقن البلاستيك"
  },
  "kalıp tasarımı": {
    "en": "mould design",
    "ru": "проектирование пресс-форм",
    "ar": "تصميم القوالب"
  },
  "tolerans": {
    "en": "tolerance",
    "ru": "допуск",
    "ar": "التفاوت"
  }
  // ~50-100 terim
}
```

### 7.4. RTL Arapça Desteği

- `<html lang="ar" dir="rtl">` (locale Arapça ise)
- Tailwind `tailwindcss-rtl` plugin: `ms-/me-` (margin-start/end), `ps-/pe-` (padding)
- Logical CSS properties (`inline-start`, `inline-end`)
- İkon flip (örn. ok ikonları): RTL'de yatay aynalama
- Sayı/tarih: `Intl.NumberFormat('ar-EG')`, `Intl.DateTimeFormat`
- Telefon numarası: ülke kodu ön taraf konumu doğru
- Test: Playwright'ta RTL screenshot karşılaştırma

### 7.5. SEO

- `sitemap.xml`: 4 dilin tüm sayfaları, `xhtml:link` hreflang
- `robots.txt`: admin path'leri disallow
- Schema.org: Organization (parent), Product (urunler), BreadcrumbList
- OG / Twitter card: dil bazında dinamik (locale uygun resim ve metin)

---

## 8. RFQ Akışları

### 8.1. Custom Mühendislik RFQ

**URL:** `/[locale]/teklif-iste/ozel-uretim/`

**Form alanları:**

| Alan | Tip | Validasyon | Zorunlu |
|---|---|---|---|
| Ad Soyad | text | min 2 karakter | ✓ |
| E-posta | email | RFC 5322 | ✓ |
| Şirket | text | min 2 | ✓ |
| Telefon | tel | E.164 (intl format) | ✓ |
| Ülke | select (ISO 3166) | - | ✓ |
| Sektör | select (cam yıkama / kapak / tekstil / diğer) | - | ✓ |
| Proje açıklaması | textarea | 50-2000 karakter | ✓ |
| Malzeme tercihi | multi-select (PP/PE/ABS/POM/PA/PC/diğer) | - | - |
| Tahmini yıllık adet | select (1k / 5k / 10k / 50k / 100k+ / bilmiyorum) | - | ✓ |
| Tolerans hassasiyeti | radio (low / medium / high) | - | - |
| Hedef tarih | date picker | future date | - |
| Çizim/foto/CAD upload | file (PDF, JPG, PNG, STEP, IGES) | max 5 dosya, ≤10 MB tek dosya, ≤25 MB toplam | - |
| NDA gerek | checkbox | - | - |
| KVKK onayı | checkbox | zorunlu | ✓ |

### 8.2. Standart Ürün RFQ

**URL:** `/[locale]/teklif-iste/standart/`

**Form alanları:**

| Alan | Tip | Validasyon | Zorunlu |
|---|---|---|---|
| Ad Soyad | text | min 2 | ✓ |
| E-posta | email | RFC 5322 | ✓ |
| Şirket | text | min 2 | ✓ |
| Telefon | tel | E.164 | ✓ |
| Ülke | select | - | ✓ |
| Ürün(ler) seçimi | multi-select (katalogdan, search) | min 1 | ✓ |
| Her ürün için varyant + adet | dynamic rows | adet > 0 | ✓ |
| Teslimat adresi (ülke/şehir) | text | - | - |
| İncoterm tercihi | select (EXW/FOB/CIF/DAP) | - | - |
| Notlar | textarea | <1000 karakter | - |
| Acil mi | checkbox | - | - |
| KVKK onayı | checkbox | zorunlu | ✓ |

### 8.3. Submission Akışı

```
Kullanıcı submit
  ↓
Frontend: react-hook-form + zod validation
  ↓
Cloudflare Turnstile token doğrulama (server-side)
  ↓
Supabase: rfqs INSERT (RLS: anon insert allowed for type=rfq submission)
  ↓
Storage: dosyaları rfq-attachments/{rfq_id}/ bucket'a yükle (private)
  ↓
Resend e-postası:
  (a) ekibe bildirim (RFQ bilgileri + admin link)
  (b) müşteriye onay e-postası (locale'ine göre)
  ↓
Frontend: success state ("Talebiniz alındı, X iş günü içinde dönüş yapacağız")
```

### 8.4. Spam Koruma

- **Cloudflare Turnstile** (bot tespiti, görsel CAPTCHA değil — UX dostu)
- **Honeypot field** (gizli, doldurulmuşsa drop)
- **Rate limit:** Aynı IP'den 5 dk'da max 3 RFQ (Supabase Edge Function veya Vercel middleware)
- **E-posta validasyonu:** disposable e-posta listesi blacklist (`disposable-email-domains`)

### 8.5. KVKK / GDPR

- Form submit ile birlikte açık rıza checkbox
- Privacy policy sayfası (`/gizlilik`) 4 dilde
- Kişisel veri retention: RFQ kayıtları 3 yıl, sonra anonimleştirme/silme
- Kullanıcı talep ederse silme/erişim hakkı (e-posta üzerinden)

---

## 9. Veri Modeli

### 9.1. Supabase Postgres Tabloları

```sql
-- Sektörler
CREATE TABLE sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,             -- "cam-yikama", "kapak", "tekstil"
  name jsonb NOT NULL,                    -- {"tr": "Cam Yıkama", "en": "Glass Washing", ...}
  description jsonb,
  hero_color text,                        -- "#5b8fc7"
  content_blocks jsonb,                   -- markdown blocks i18n
  display_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ürün katalogu
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name jsonb NOT NULL,                    -- i18n
  description jsonb,                      -- i18n
  sector_id uuid REFERENCES sectors(id),
  images jsonb,                           -- [{url, alt: {tr, en, ...}}, ...]
  specs jsonb,                            -- {material, dimensions, weight, ...}
  variants jsonb,                         -- [{name, sku, ...}]
  active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RFQ talepleri
CREATE TYPE rfq_type AS ENUM ('custom', 'standart');
CREATE TYPE rfq_status AS ENUM ('new', 'reviewing', 'quoted', 'won', 'lost', 'archived');

CREATE TABLE rfqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type rfq_type NOT NULL,
  status rfq_status NOT NULL DEFAULT 'new',
  locale text NOT NULL,                   -- "tr", "en", "ru", "ar"
  contact jsonb NOT NULL,                 -- {name, email, company, phone, country}
  payload jsonb NOT NULL,                 -- form alanları
  attachments jsonb,                      -- [{path, name, size, mime}]
  internal_notes text,                    -- markdown
  assigned_to uuid REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_rfqs_type ON rfqs(type);
CREATE INDEX idx_rfqs_created_at ON rfqs(created_at DESC);

-- Admin kullanıcı rolleri
CREATE TYPE admin_role AS ENUM ('admin', 'sales', 'viewer');

CREATE TABLE admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'viewer',
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- E-posta bildirim alıcıları
CREATE TABLE notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  rfq_types rfq_type[] NOT NULL,          -- hangi RFQ tiplerinden bildirim alacak
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Audit log
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,                   -- "rfq_status_changed", "product_updated"
  entity_type text NOT NULL,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz DEFAULT now()
);
```

### 9.2. Storage Buckets

| Bucket | Erişim | İçerik |
|---|---|---|
| `rfq-attachments` | private (signed URL only) | RFQ ile gelen kullanıcı dosyaları |
| `product-images` | public | Ürün katalog görselleri |
| `sector-images` | public | Sektör hero ve içerik görselleri |
| `documents` | public | Sertifikalar, broşürler (PDF) |

### 9.3. RLS Politikaları

```sql
-- Public okuma (aktif olanlar için)
CREATE POLICY "Anyone can read active sectors"
  ON sectors FOR SELECT TO anon, authenticated
  USING (active = true);

CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT TO anon, authenticated
  USING (active = true);

-- RFQ insert (anon submit)
CREATE POLICY "Anyone can submit RFQ"
  ON rfqs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admin tarafı: yalnız admin_users
CREATE POLICY "Only admins can read RFQs"
  ON rfqs FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Only admins can update RFQs"
  ON rfqs FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Only admin role can manage products"
  ON products FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM admin_users WHERE role = 'admin'));

-- Storage RLS
CREATE POLICY "Anyone can upload to rfq-attachments"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'rfq-attachments');

CREATE POLICY "Only admins can read rfq-attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'rfq-attachments'
         AND auth.uid() IN (SELECT user_id FROM admin_users));
```

---

## 10. Admin Paneli

### 10.1. Auth

- **Yöntem:** Supabase Auth + magic link (e-posta + tıkla, şifre yok)
- **Kullanıcı eklemesi:** Manuel — Supabase dashboard'dan e-posta ekle, sonra `admin_users` tablosuna rol ile insert. Otomatik signup kapalı.
- **Session:** httpOnly cookie, 7 gün
- **Logout:** Tüm cihazlarda

### 10.2. Sayfalar

| Path | İçerik |
|---|---|
| `/admin` | Login (magic link iste) ve dashboard'a redirect |
| `/admin/inbox` | RFQ tablosu — filtre (durum, tip, sektör, dil, tarih range), arama (e-posta/şirket), sayfalama, sıralama |
| `/admin/inbox/[id]` | RFQ detay — tüm alanlar, ekler (signed URL preview/download), iç notlar (markdown), durum değiştir, atanan kişi |
| `/admin/urunler` | Ürün listesi — filtre/arama, "Yeni Ürün" butonu |
| `/admin/urunler/[id]` | Ürün CRUD — 4 dil tab (TR/EN/RU/AR), görsel upload, varyant ekle, sektör ata |
| `/admin/sektorler` | Sektör listesi (sadece 3) |
| `/admin/sektorler/[id]` | Sektör hero metni, içerik blokları (markdown), 4 dil tab |
| `/admin/ayarlar/sirket` | Şirket bilgi (adres, telefon, e-posta, sosyal) |
| `/admin/ayarlar/bildirimler` | RFQ bildirim alıcıları (e-posta listesi, hangi tiplerden) |
| `/admin/ayarlar/sablonlar` | E-posta şablonları (müşteriye onay, ekibe bildirim) — markdown |

### 10.3. Admin UI

- Aynı tasarım dili (Industrial Precision), ama daha density'li (data table, form'lar)
- shadcn/ui `data-table`, `dialog`, `command` (cmd+k arama)
- Markdown editor: `@uiw/react-md-editor` veya benzeri

### 10.4. Bildirim Sistemi

- **Yeni RFQ geldiğinde:** Resend ile bildirim e-postaları (notification_recipients tablosundaki ilgili tip için)
- **Durum değişikliğinde:** Sadece audit_log'a yazar (e-posta yok faz 1'de)
- **Faz 2:** Müşteriye durum güncellemesi e-postası

---

## 11. Teknik Mimari

### 11.1. Yüksek Seviye

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
│  Next.js App (React + R3F + Tailwind + next-intl)   │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────────────────┐
│  Cloudflare DNS + DDoS shield + Turnstile           │
└──────────────┬──────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────┐
│  Vercel Edge Network (CDN)                          │
│  ┌────────────────────────────────────────────────┐ │
│  │  Next.js: SSR, ISR, RSC, Edge Runtime          │ │
│  └────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────────────┘
               │ Supabase JS SDK / RLS
               ▼
┌─────────────────────────────────────────────────────┐
│  Supabase (Postgres + Storage + Auth + Edge Func)   │
└─────────────────────────────────────────────────────┘
               │
               ▼ (RFQ submit sonrası)
┌─────────────────────────────────────────────────────┐
│  Resend API (transactional e-posta)                 │
└─────────────────────────────────────────────────────┘
```

### 11.2. Repo Yapısı

```
kitaplastik/
├── app/                              Next.js App Router
│   ├── [locale]/                     locale-prefixed routes
│   │   ├── layout.tsx
│   │   ├── page.tsx                  Anasayfa
│   │   ├── sektorler/
│   │   ├── urunler/
│   │   ├── muhendislik/
│   │   ├── atolye/
│   │   ├── kalite/
│   │   ├── hakkimizda/
│   │   ├── teklif-iste/
│   │   └── iletisim/
│   ├── admin/                        admin (locale-bağımsız, sadece TR)
│   │   ├── layout.tsx
│   │   ├── inbox/
│   │   ├── urunler/
│   │   └── ayarlar/
│   ├── api/
│   │   ├── rfq/route.ts              RFQ submit endpoint
│   │   └── turnstile/route.ts        Turnstile verify
│   ├── globals.css
│   └── not-found.tsx
├── components/
│   ├── ui/                           shadcn/ui generated
│   ├── three/                        R3F components
│   │   ├── HeroCanvas.tsx
│   │   └── shaders/
│   ├── layout/                       Header, Footer, LocaleSwitcher
│   ├── rfq/                          RFQ form components
│   ├── admin/                        admin-specific
│   └── home/                         home page sections
├── lib/
│   ├── supabase/                     client/server helpers
│   ├── i18n/                         next-intl config
│   ├── email/                        Resend templates
│   ├── validation/                   zod schemas
│   └── utils.ts
├── messages/
│   ├── tr/
│   ├── en/
│   ├── ru/
│   └── ar/
├── scripts/
│   ├── translate.py                  AI çeviri pipeline
│   └── seed.ts                       DB seed (dev için)
├── public/
│   ├── logo/                         SVG variants
│   ├── fonts/                        self-hosted Inter, JetBrains Mono
│   └── images/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── e2e/                          Playwright
│   └── unit/                         Vitest
├── glossary.json
├── middleware.ts                     next-intl + auth
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── .env.example
├── .env.local                        (gitignored)
└── README.md
```

### 11.3. Environment Variables

```
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # server-only

NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=                  # server-only

RESEND_API_KEY=                        # server-only
RESEND_FROM_EMAIL=noreply@kitaplastik.com

ANTHROPIC_API_KEY=                     # CI only (translate.py)

NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                     # server-only
```

---

## 12. Tech Stack — Tüm Bağımlılıklar

### 12.1. Runtime

| Paket | Versiyon | Amaç |
|---|---|---|
| `next` | 15.x | React framework |
| `react` | 19.x | UI |
| `react-dom` | 19.x | UI render |
| `typescript` | 5.x | Tip güvenliği |
| `tailwindcss` | 4.x | Utility-first CSS |
| `tailwindcss-rtl` | latest | RTL helper |
| `next-intl` | 3.x | i18n routing |
| `@supabase/supabase-js` | 2.x | Supabase client |
| `@supabase/ssr` | latest | SSR auth helpers |
| `react-hook-form` | 7.x | Form state |
| `zod` | 3.x | Schema validation |
| `@hookform/resolvers` | 3.x | RHF + Zod glue |
| `lucide-react` | latest | İkon |
| `framer-motion` | 11.x | UI animasyon |
| `@react-three/fiber` | 8.x | R3F |
| `@react-three/drei` | 9.x | R3F utilities |
| `three` | 0.16x | 3D engine |
| `resend` | latest | E-posta |
| `@uiw/react-md-editor` | latest | Markdown editor (admin) |
| `clsx` + `tailwind-merge` | - | className helpers |
| `date-fns` | 3.x | Tarih |

### 12.2. shadcn/ui Bileşenleri (kurulacaklar)

button, card, input, textarea, select, checkbox, radio, dialog, sheet, dropdown-menu, command, tabs, badge, alert, toast (sonner), data-table, form, label, separator, tooltip, accordion, breadcrumb, navigation-menu, skeleton, popover, calendar, file-uploader (custom).

### 12.3. Dev Dependencies

| Paket | Amaç |
|---|---|
| `@types/*` | Tip definitions |
| `eslint` + `eslint-config-next` | Linting |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting |
| `vitest` + `@vitejs/plugin-react` | Unit test |
| `@testing-library/react` + `jest-dom` | Component test |
| `@playwright/test` | E2E test |
| `@axe-core/playwright` | A11y test |
| `husky` + `lint-staged` | Pre-commit hooks |
| `@types/three` | three.js types |

### 12.4. Python Script (CI only)

`requirements.txt`:
```
anthropic>=0.30.0
python-dotenv
```

---

## 13. Geliştirme Süreci

### 13.1. Repo & Branching

- **Repo:** GitHub (private, eğer henüz yoksa init)
- **Default branch:** `main` (production)
- **Branch naming:** `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`
- **PR review:** Self-review (solo dev) — checklist: build pass, type check pass, test pass, lint pass

### 13.2. CI (GitHub Actions)

**`.github/workflows/ci.yml`:**
- Tetik: pull_request + push to main
- Job: install (pnpm) → lint → type-check → vitest → build
- Job: playwright e2e (sadece main'e merge öncesi)
- Job: translate.py (sadece TR JSON değişmişse → PR açar)

**`.github/workflows/deploy.yml`:**
- Vercel Git integration ile otomatik (her push → preview deploy, main → production)

### 13.3. Code Quality Hooks

- Pre-commit: `lint-staged` → ESLint + Prettier sadece değişen dosyalarda
- Pre-push: `tsc --noEmit` (type check)

### 13.4. Versioning

- Semantik commit: `feat(rfq): add custom RFQ form`
- Release: gerek yok (continuous deploy)

---

## 14. Test Stratejisi

### 14.1. Unit (Vitest)

- **Kapsam hedefi:** %70 (utility, hooks, validation schemas için %90+)
- **Odak:** zod schemas (4 dil için error message), supabase helpers, i18n helpers, RFQ payload builders

### 14.2. Component (Vitest + Testing Library)

- Form'lar: render + submit + validation error path
- LocaleSwitcher: locale değişimi
- Hero canvas: SSR'da crash etmemeli, Canvas client-only

### 14.3. E2E (Playwright)

| Senaryo | Kritiklik |
|---|---|
| Anasayfa açılır, hero render, CTA tıklanır | High |
| Custom RFQ formu doldurulur, dosya yüklenir, submit olur, success state | **Critical** |
| Standart RFQ — ürün seçilir, adet girilir, submit | **Critical** |
| Locale switch (tr→en→ru→ar) — içerik değişir, RTL doğru | High |
| Admin login (magic link mock) → inbox açılır → RFQ detay | High |
| Admin ürün ekler, görsel upload, 4 dil tab doldurur, save | High |
| 404 sayfası 4 dilde | Medium |
| Spam koruma: Turnstile fail → form reddedilir | Medium |

### 14.4. Görsel Regresyon (opsiyonel)

- Playwright `toHaveScreenshot()` ile hero ve sektör sayfalarının screenshot'ları
- 4 dil için ayrı baseline (RTL Arapça için kritik)

### 14.5. Manuel Test Checklist (lansman öncesi)

- [ ] 4 dil hero, anasayfa, sektör sayfaları manuel okuma (anlam doğru mu)
- [ ] RFQ submit gerçek e-posta ile (Resend sandbox)
- [ ] Admin auth manuel
- [ ] Mobile, tablet, desktop responsive
- [ ] Safari, Chrome, Firefox, Edge
- [ ] Screen reader (VoiceOver Mac, NVDA Windows)
- [ ] Klavye navigasyon (Tab, Enter, Esc)
- [ ] Reduce motion açıkken 3D pasif

---

## 15. Performans, SEO, Erişilebilirlik

### 15.1. Lighthouse Hedefleri

| Sayfa | Mobile | Desktop |
|---|---|---|
| Anasayfa | ≥85 | ≥95 |
| Sektör | ≥90 | ≥95 |
| RFQ form | ≥90 | ≥98 |
| Admin (yetkili) | gerek yok | ≥85 |

### 15.2. Core Web Vitals

- **LCP:** <2.5s (hero görsel/3D optimize)
- **INP:** <200ms (event handler hafif)
- **CLS:** <0.1 (image height belirtilmiş, font-display: swap)

### 15.3. SEO Checklist

- [ ] `<title>` ve `<meta description>` her sayfa, 4 dil
- [ ] OG image her sayfa, dil bazında
- [ ] Twitter card
- [ ] Canonical URL (locale dahil)
- [ ] hreflang tüm diller + x-default
- [ ] sitemap.xml (next-sitemap)
- [ ] robots.txt (admin disallow)
- [ ] Schema.org Organization, Product, BreadcrumbList
- [ ] Görsel alt text (i18n)
- [ ] Heading hiyerarşisi (H1 sayfa başına 1)

### 15.4. Erişilebilirlik (WCAG 2.1 AA)

- [ ] Renk kontrastı ≥ 4.5:1 (normal text), ≥3:1 (büyük text)
- [ ] Tüm interaktif öğeler klavye ile erişilebilir
- [ ] Focus indicator görünür
- [ ] ARIA label'lar (özellikle ikon butonlarında)
- [ ] Screen reader test (en az VoiceOver)
- [ ] RTL doğru render (Arapça)
- [ ] `prefers-reduced-motion` respect
- [ ] `prefers-color-scheme` (opsiyonel — koyu/açık mod)

---

## 16. Güvenlik

### 16.1. Supabase RLS

- Tüm tablolar RLS açık (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- Politikalar Bölüm 9.3'te
- Service role key sadece sunucu tarafında, asla client'a gitmez

### 16.2. Secret Yönetimi

- `.env.local` gitignore'da
- Vercel Project Settings → Environment Variables
- Supabase → Project Settings → API
- GitHub Actions → Repository secrets (`ANTHROPIC_API_KEY` çeviri için)

### 16.3. CSP Headers

`next.config.ts`'de:

```typescript
{
  headers: [{
    source: "/(.*)",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' challenges.cloudflare.com plausible.io; img-src 'self' data: blob: *.supabase.co; connect-src 'self' *.supabase.co plausible.io; frame-src challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:;" },
    ]
  }]
}
```

### 16.4. Dosya Upload Güvenliği

- MIME type whitelist (PDF, JPG, PNG, STEP, IGES)
- Magic byte validation (server-side, MIME header'a güvenmemek için)
- Maksimum dosya boyutu (25 MB toplam, 10 MB tek dosya)
- Filename sanitization (path traversal önlemek için UUID rename)
- Supabase Storage signed URL (private bucket, sadece admin görür)

### 16.5. Rate Limiting

- RFQ submit: aynı IP'den 5 dk'da max 3 submit (Vercel Edge Middleware)
- Login (magic link): aynı e-postaya 1 dk'da 1 link

### 16.6. Bildirim/Audit

- Admin tarafında her significant action `audit_log`'a yazılır
- Sentry'de unhandled exception alarmı

---

## 17. Lansman Fazları

### 17.1. Faz 1 — MVP Lansman (Hedef ≤6 hafta)

**Kapsam:**
- ✅ Tüm public sayfalar (anasayfa, 3 sektör, ürünler, mühendislik, atölye, kalite, hakkımızda, teklif, iletişim)
- ✅ 4 dil eş zamanlı (TR + EN + RU + AR), AI çeviri pipeline + glossary + spot review
- ✅ Atmosferik 3D hero (anasayfa + landing'lerde)
- ✅ İki RFQ formu (custom + standart) tam çalışır
- ✅ Admin paneli (inbox, ürün/sektör CRUD, ayarlar)
- ✅ Supabase Auth (magic link)
- ✅ Resend bildirim e-postaları
- ✅ Cloudflare Turnstile spam koruma
- ✅ hreflang + sitemap + OG
- ✅ Plausible analytics
- ✅ Sentry hata takibi
- ✅ Lighthouse hedefleri
- ✅ Manuel test + E2E kritik akışlar

**MVP'de OLMAYANLAR:**
- ❌ Müşteri RFQ tracking sayfası
- ❌ Durum güncelleme e-postası müşteriye
- ❌ Blog/haberler
- ❌ Profesyonel insan çevirisi (sadece spot review)
- ❌ Analytics dashboard admin tarafında

### 17.2. Faz 2 — İyileştirme (Faz 1 + ~4 hafta)

- Müşteri RFQ tracking sayfası (`/rfq/[uuid]/`)
- E-posta otomasyonu — durum değişikliklerinde müşteriye bildirim
- Arapça/Rusça spot insan revizyonu (ana sayfalar)
- Sektör sayfalarında küçük 3D mikro-vinyetleri (cam yıkama → su jeti, kapak → dönen kapak, tekstil → mesh)
- Lighthouse iyileştirme (özellikle mobile 3D)
- A/B test altyapısı (Vercel Analytics)

### 17.3. Faz 3 — Genişleme (İhtiyaca göre)

- Blog / haberler / case study (CMS)
- Müşteri portalı (sipariş takibi, faz B'den fark daha kapsamlı)
- Profesyonel tam insan çevirisi (4 dil)
- Çoklu admin rolleri (sales, viewer)
- Ürün kataloğu için arama + facet filter
- Webhook entegrasyonları (CRM, ERP)
- Çoklu para birimi (varsa pricing göstereceksek)

---

## 18. Riskler ve Hafifletmeler

| Risk | Olasılık | Etki | Hafifletme |
|---|---|---|---|
| AI çevirisinde teknik terim hatası | Orta | Yüksek (profesyonelliği zedeler) | Glossary zorunlu + kritik sayfalarda spot insan review |
| Arapça RTL'de UX bozulması | Orta | Yüksek | Playwright RTL testleri, Arapça konuşan birinden manuel review |
| 3D performans mobilde kötü | Yüksek | Orta | Fallback CSS gradient, prefers-reduced-motion respect, low-power detection |
| Supabase free tier yetersiz | Düşük | Düşük | $25/ay Pro plan'a geçmek tek tıklama |
| Vendor lock-in (Supabase) | Düşük | Düşük | Postgres dump alıp her yere taşınır; abstraction layer ekleme şart değil |
| RFQ spam saldırısı | Orta | Orta | Turnstile + rate limit + honeypot + disposable e-posta blacklist |
| Logo SVG yeniden çiziminde marka tanınırlığı kaybı | Düşük | Yüksek | Hafif rötuş (B) — orijinal görünümü koru, sadece dijital netliği artır |
| Çeviri pipeline'da API hata/yarım çeviri | Orta | Orta | Pipeline atomic — hata olursa eski JSON korunur, PR açılmaz |
| GDPR/KVKK uyumsuzluğu | Düşük | Yüksek | Privacy policy, açık rıza checkbox, retention policy belge |
| Ekibin admin paneli kullanmaması | Orta | Orta | Magic link basit; ilk hafta birlikte kullanım, kısa video gönder |

---

## 19. Açık Sorular ve Varsayımlar

### 19.1. Açık Sorular (lansman öncesi netleştir)

1. **Sertifikalar:** ISO 9001 vb. var mı? Dosya/logo elimizde var mı?
2. **Atölye fotoğrafları:** Üretim hattı, makine, çalışma ortamı fotoğrafları var mı? Yoksa profesyonel çekim/stok kullanımı planı?
3. **Ürün fotoğrafları:** Standart ürünlerin fotoğrafları nasıl çekilecek? (lightbox setup, çekim planlaması)
4. **Şirket lokasyon adresi:** Tam adres + Google Maps embed için koordinat
5. **İletişim e-postaları:** RFQ bildirimi hangi e-posta(lara) gitsin?
6. **Sosyal medya hesapları:** LinkedIn, vb. var mı? Footer'a link
7. **Telefon numara(ları):** Sabit ve/veya WhatsApp Business
8. **Sertifika sayfası içerik:** Hangi sertifikalar listenecek?
9. **Custom mühendislik referansları:** Anonim case study için 2-3 örnek var mı? (NDA ile özetlenmiş)
10. **Privacy policy + KVKK metni:** Var mı, yoksa hukuk danışmanı ile mi yazılacak?
11. **Sektör sayfası standart ürünleri:** Her sektörde başlangıçta kaç ürün listenecek? (Faz 1 için minimum 3-5 örnek/sektör önerilir)
12. **Domain DNS:** Şu an nerede yönetiliyor? (registrar bilgisi, Cloudflare'e taşıma planı)

### 19.2. Varsayımlar

1. Solo developer + 1 içerik yöneticisi senaryo (genişlerse roller eklenir)
2. Trafik düşük-orta (günde <500 ziyaretçi başlangıçta) — Supabase free/pro tier yeter
3. RFQ hacmi günde <20 başlangıçta
4. Ürün katalogu <100 ürün başlangıçta
5. İçerik yöneticisinin teknik yetkinliği düşük → admin paneli WYSIWYG yerine basit form + markdown
6. Müşteri tarafında teknik yetkinlik orta-yüksek (B2B alıcılar, mühendisler)
7. Mobile %40 trafik tahmini (B2B desktop ağırlıklı)
8. AI çeviri için Claude API kullanımı CI sırasında, build başına ~$1-3 maliyet (kabul edilebilir)

---

## 20. Sonraki Adımlar

1. Bu spec'i gözden geçir ve onaylanmasını bekle
2. `superpowers:writing-plans` skill'i ile detaylı **implementation plan** çıkar (faz 1 için sprint/task breakdown)
3. Faz 1 plan onaylandıktan sonra `superpowers:executing-plans` ile uygulamaya başla
4. Eksik içerik (Bölüm 19.1 açık sorular) implementasyon sırasında paralel olarak toplanır

---

**Spec yazarı:** Claude (Opus 4.7) — brainstorming oturumu sonucu
**Onay bekleyen:** Berkay (kullanıcı)
