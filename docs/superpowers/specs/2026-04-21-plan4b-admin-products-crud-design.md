# Plan 4b — Admin Ürün Yönetim Paneli + Public Ürün Sayfaları

**Tarih:** 2026-04-21
**Durum:** Spec tamamlandı, onay bekliyor
**Tahmini süre:** 3-5 gün (birden fazla oturum)
**Bağımlılık:** Plan 4a (URL migration) canlıda çalışıyor olmalı.

---

## Ne yapıyoruz?

Bu iş iki bölüm:

1. **Admin paneline "Ürünler" menüsü ekliyoruz.** Giriş yaptıktan sonra ürün ekleyebileceksin, mevcut ürünleri düzenleyebilecek, silebilecek, geri yükleyebileceksin.

2. **Public site'da ürün sayfaları açılacak.** Şu an `/products` sayfası "bu sayfa hazırlanıyor" placeholder. Yerine gerçek ürün listesi (grid kartlar) + her ürünün kendi detay sayfası gelecek. Standart RFQ formundaki ürün seçici de bu kataloğu kullanacak.

## Neden?

- Ürünleri Supabase Studio'ya SQL yazarak değil, admin paneli üzerinden yükleyeceksin. Teknik bilgi gerekmeyen basit form akışı.
- Müşteri Google'da "28 mm PET kapak" diye arar, ürün detay sayfan çıkar, "Teklif İste" tıklar, standart RFQ formuna ürün otomatik seçili olarak yönlendirilir.
- Şu an `/products` placeholder sayfası site kalitesini düşürüyor. Gerçek ürün katalogu ile site tam B2B vitrin haline geliyor.

## Kullanıcı hikayesi

### Senaryo A — Sen yeni bir ürün yüklüyorsun

1. `/admin/login` → giriş yap → `/admin/products` sayfası aç
2. Sağ üst **"+ Yeni Ürün Ekle"** butonu
3. Form açılır:
   - Sektör seç (Cam Yıkama / Kapak / Tekstil)
   - Üstte dil sekmeleri: **[ TR ✓ ] [ EN — ] [ RU — ] [ AR — ]**
   - TR tab'ında Türkçe ad + açıklama yaz
   - "Özellik Ekle" butonuna bas → preset listesi açılır (Malzeme, Boyut, Renk, MOQ, Ağırlık, Sertifikalar, Üretim, Geri Dönüşüm, Raf Ömrü, Tolerans) → seç + değer gir
   - Görseller yükle (sürükle-bırak, max 5, ilk görsel ana görsel)
4. İstersen EN tab'ına geç → İngilizce ad ve açıklama yapıştır (elle çevirmiş olarak)
5. **"Kaydet ve Yayınla"** butonu → 3 saniye sonra ürün yayında
6. `/tr/products`'ta ürün grid'de görünür. Tıklayınca detay sayfası açılır.
7. Eğer sadece TR'yi doldurduysan `/en/products`, `/ru/products`, `/ar/products`'ta ürün listelenmez (kısmen çeviri yerine hiç gösterme — daha temiz UX).

### Senaryo B — Müşteri bir ürün arıyor

1. Google'da "PET preform kapak 28mm" arıyor
2. Sonuçlarda `/tr/products/pet-preform-kapak-28-mm` çıkar
3. Tıklar, detay sayfası açılır:
   - Büyük ana görsel + alt tarafta küçük galeri thumb'ları (tıklanırsa büyütür)
   - Türkçe açıklama
   - "Teknik Özellikler" tablosu (preset-buton-bazlı girdiğin değerler)
   - Altta belirgin **"Bu Ürün İçin Teklif İste"** butonu
4. Buton tıklanır → standart RFQ formu açılır, bu ürün seçili olarak gelir
5. Müşteri miktar, adres, not ekler → gönderir

### Senaryo C — Yanlışlıkla sildin, geri yüklüyorsun

1. `/admin/products` listesinde bir ürünün yanında çöp kutu ikonu
2. "Silmek istediğinize emin misiniz?" dialog → **Evet**
3. Ürün **"Silinmiş"** tab'ına geçer (public'te görünmez)
4. Fikrin değişirse "Silinmiş" tab'ına geç → **"Geri Yükle"** butonu → ürün tekrar canlı

### Senaryo D — Benzer ürün hızlıca ekliyorsun

1. Mevcut ürün "Düzenle" sayfasında **"Bu ürüne benzer yeni ekle"** butonu
2. Aynı verilerle yeni form açılır
3. Farklı olan yerleri değiştirirsin (ad, boyut, görsel) → Kaydet
4. 5 benzer ürün 10 dakikada yüklenir

## Admin form görünümü

```
┌──────────────────────────────────────────────────────┐
│ Yeni Ürün                             [Yardım ?]    │
├──────────────────────────────────────────────────────┤
│  Sektör:    [ Kapak  ▼ ]                             │
│                                                      │
│  [ TR ✓ ]  [ EN — ]  [ RU — ]  [ AR — ]              │
│  ▔▔▔▔▔▔                                               │
│                                                      │
│  Ürün Adı (TR) *                                     │
│  [ PET Preform Kapak 28 mm                        ]  │
│                                                      │
│  Açıklama (TR) *                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Gıda sınıfı PET preform kapak. 28 mm çap,   │    │
│  │ standart vida adımı. Mevcut renkler: beyaz, │    │
│  │ siyah, şeffaf. TSE sertifikalı.             │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ─── Teknik Özellikler (dil-bağımsız) ───            │
│  Boyut    [ 28 mm            ]   [🗑️]                │
│  Malzeme  [ PET              ]   [🗑️]                │
│  MOQ      [ 10.000 adet      ]   [🗑️]                │
│  [ + Özellik Ekle ▼ ]                                │
│                                                      │
│  ─── Görseller (ilk görsel ana görsel) ───           │
│  ┌────┬────┬────┬────┐                               │
│  │ 🖼️ │ 🖼️ │ 🖼️ │ ➕ │                               │
│  └────┴────┴────┴────┘                               │
│  Sürükle-bırak veya "➕" ile yükle. Max 5, 10 MB.    │
│                                                      │
│  [ İptal ]                 [ 💾 Kaydet ve Yayınla ]  │
└──────────────────────────────────────────────────────┘
```

## Admin ürün listesi

```
┌──────────────────────────────────────────────────────┐
│ Ürünler                       [+ Yeni Ürün Ekle]     │
├──────────────────────────────────────────────────────┤
│ [ Yayında 12 ]  [ Silinmiş 2 ]   [🔍 Ara...       ]  │
├──────────────────────────────────────────────────────┤
│ 🖼️ PET Preform Kapak 28 mm   Kapak    [Düzenle][🗑️] │
│ 🖼️ Cam Yıkama Kapağı 38 mm   Cam Y.   [Düzenle][🗑️] │
│ 🖼️ Tekstil Bobin Kapağı       Tekstil [Düzenle][🗑️] │
│ ...                                                  │
└──────────────────────────────────────────────────────┘
```

Her satır: küçük thumbnail + ürün adı (TR) + sektör + aksiyon butonları.

## Ne değişiyor?

### Admin tarafında (yeni)
- `/admin/products` — liste sayfası (arama + yayında/silinmiş tab'ları)
- `/admin/products/new` — yeni ürün formu
- `/admin/products/[id]/edit` — düzenleme formu
- Admin menüsüne "Ürünler" link'i eklenir

### Public tarafında (yeni/güncellenen)
- `/[locale]/products` — placeholder yerine gerçek grid
- `/[locale]/products/[slug]` — yeni detay sayfası
- `/[locale]/teklif-iste/standart` ürün seçici — free-text yerine katalog autocomplete

### Veritabanında (zaten hazır)
- `products` tablosu Plan 3'te oluşturulmuş, CRUD eklenecek
- `product-images` Storage bucket'ı hazır
- RLS policy'leri hazır

## Dil doldurma mantığı

**TR zorunlu**, diğerleri opsiyonel:
- TR tab'ı hiç dolmadan kaydedemezsin
- EN tab'ı boş bıraktıysan `/en/products`'ta ürün **listelenmez**, `/en/products/[slug]` **404** döner
- Sonradan /edit → EN tab'ına metni yapıştır → Kaydet → ürün EN locale'de de yayında
- Admin ürün listesinde her satırda hangi dillerde dolu olduğu rozetle görünür: `TR ✓ · EN ✓` veya `TR ✓`

## Teknik özellikler (spec) mantığı

10 preset özellik var — her biri 4 dilde label'lı:

| Preset | TR | EN | RU | AR |
|---|---|---|---|---|
| Malzeme | Malzeme | Material | Материал | مادة |
| Boyut | Boyut | Dimension | Размер | القياس |
| Renk | Renk | Color | Цвет | اللون |
| MOQ | MOQ | MOQ | MOQ | MOQ |
| Ağırlık | Ağırlık | Weight | Вес | الوزن |
| Sertifika | Sertifika | Certificate | Сертификат | شهادة |
| Üretim | Üretim | Production | Производство | الإنتاج |
| Geri Dönüşüm | Geri Dönüşüm | Recycling | Переработка | إعادة التدوير |
| Raf Ömrü | Raf Ömrü | Shelf Life | Срок хранения | مدة الصلاحية |
| Tolerans | Tolerans | Tolerance | Допуск | تحمل |

- Admin "Özellik Ekle" → listeden seçer, değeri yazar
- Key 4 dilde otomatik (preset lookup), public sayfada locale'e göre gösterilir
- **Değer dil-bağımsız tek alan** (admin bir kere girer, 4 dilde aynı görünür). Endüstriyel verilerde değerler çoğunlukla universal ("PET", "28 mm", "10.000 adet")
- Özgün (preset listede olmayan) özellik eklemek MVP'de yok — ihtiyaç olursa Plan 4c'ye

## Risk ve yan etki

- **4 dil doldurma yükü:** TR zorunlu, diğerleri opsiyonel. Başta sadece TR'de yüklersen EN/RU/AR sayfalarında o ürün görünmez (kabul edilmiş davranış). İlerleyen günlerde EN/RU/AR çevirilerini elle yapıştırırsın, her kaydetmede o dilde yayın açılır.
- **Görsel optimizasyonu MVP'de yok.** Admin panelinde resize/compress yapılmıyor. 5 MB'den büyük görsel yüklersen yavaş yüklenir. Next/Image runtime'da resize + WebP yapıyor, public sayfada hızlı gösterilir — ama Storage'daki orijinaller büyük kalır. Plan 4c'de client-side compress eklenebilir.
- **Slug çakışması:** Aynı ürün adıyla iki ürün yükleyemezsin. "Bu slug zaten var" uyarısı çıkar, ad'ı küçük değiştirirsin (örn. numaralandır). URL'ler TR ad'dan otomatik üretilir (`pet-preform-kapak-28-mm`).
- **Silinmiş ürünlerin görselleri Storage'da kalır.** "Silinmiş" tab'ında ürünü tekrar görürsün (geri yükleyebilmen için). Otomatik temizlik MVP'de yok.
- **Slug değiştirilmesi linkleri kırar.** Düzenleme sırasında ad'ı tamamen değiştirirsen slug da değişebilir; mevcut Google link'leri bir süre kırık olur. Düzenle sayfasında uyarı gösterilir.

## Ne zaman bitecek?

3-5 gün — birden fazla oturumda yapılacak. Uygulanma sırası:

1. **Gün 1:** Admin liste sayfası + arama + aktif/silinmiş tab'ları
2. **Gün 1-2:** Admin "Yeni Ürün" formu (TR-only önce çalışsın)
3. **Gün 2:** 4 dil tab mekanizması + görsel yükleme
4. **Gün 2-3:** Admin "Düzenle" sayfası + "Benzer ürün ekle" + silme/geri yükleme
5. **Gün 3-4:** Public `/products` grid + `/products/[slug]` detay sayfası
6. **Gün 4:** Standart RFQ ProductPicker'ı katalog-backed yap
7. **Gün 4-5:** E2E testler (programmatic login hook) + CI + Coolify deploy + canlı smoke

Her aşama kendi commit'iyle atılır — yarım kalsa bile ara durum çalışır halde olur.

## Kabul kriterleri

Plan 4b "bitti" denebilmesi için:

- [ ] `/admin/products` liste gözüküyor; "Yayında" ve "Silinmiş" tab'ları + arama çalışıyor
- [ ] "Yeni Ürün Ekle" → form doldur → kaydet → ürün 3 saniye içinde listede ve canlı site'de görünüyor
- [ ] Düzenle → değiştir → kaydet → güncelleme public'te görünür
- [ ] Sil → confirmation dialog → "Silinmiş" tab'ına geçer, public'ten gizlenir
- [ ] Geri yükle → aktife döner, public'te tekrar görünür
- [ ] "Bu ürüne benzer yeni ekle" butonu çalışıyor (Senaryo D)
- [ ] 4 dil tab: TR zorunlu, EN/RU/AR doldurulursa o locale'de görünür, boşsa gizlenir
- [ ] 10 preset özellik butonu çalışıyor, değer girişi + silme çalışıyor
- [ ] Görsel yükleme (max 5, 10 MB, JPG/PNG/WebP) çalışıyor
- [ ] Görsel sıralama (yukarı/aşağı ok butonları) çalışıyor; ilk görsel ana görsel olarak detayda büyük gösteriliyor
- [ ] `/tr/products` grid 4 locale'de render oluyor, her locale'de sadece o dilde dolu ürünler görünüyor
- [ ] `/tr/products/[slug]` detay sayfası açılıyor — galeri + açıklama + spec tablosu + "Teklif İste" CTA
- [ ] Detay sayfada Schema.org Product markup var (Google Rich Results test passes)
- [ ] Standart RFQ'daki ürün seçici products tablosundan autocomplete ediyor
- [ ] Manuel test: 3 örnek ürün yükle (farklı sektör, farklı görsel sayısı, TR-only + 4-dil), public site'da doğru görünür
- [ ] Unit + E2E testler yeşil, CI yeşil
- [ ] Coolify redeploy sonrası canlı: tüm kabul kriterleri canlıda da geçiyor
- [ ] `/admin/settings/notifications` route'u (Plan 4a'da rename edildi) hâlâ çalışıyor

---

## İmplementer Notları (teknik)

### Route listesi

```
/admin/products                            (RSC list, server)
/admin/products/new                        (form, create mode)
/admin/products/[id]/edit                  (form, edit mode)

/[locale]/products                         (RSC public grid, all 4 locales)
/[locale]/products/[slug]                  (RSC dynamic public detail)

Server Actions (app/admin/products/actions.ts):
  createProduct(formData)
  updateProduct(id, formData)
  softDeleteProduct(id)
  restoreProduct(id)

HTTP API (opsiyonel):
  /api/admin/products/[id]/clone          (POST, "benzer ekle" için)
```

### Bileşen ağacı

```
components/admin/products/
  ProductList.tsx           (tab + arama + satır tablosu)
  ProductRow.tsx
  ProductForm.tsx           (ana form, 'use client')
  LocaleTabs.tsx            (TR/EN/RU/AR switcher)
  SpecBuilder.tsx           (preset dropdown + key-value liste)
  ImageUploader.tsx         (Supabase Storage direkt upload, reorder oklar)
  DeleteDialog.tsx          (confirmation modal)
  RestoreButton.tsx
  SaveProgressModal.tsx     (blocking modal "Kaydediliyor...")

components/public/products/
  ProductGrid.tsx
  ProductCard.tsx
  ProductDetail.tsx
  ProductGallery.tsx        (ana görsel + thumb carousel + lightbox)
  ProductSpecTable.tsx

components/rfq/
  ProductPicker.tsx         (GÜNCELLE: free-text → catalog autocomplete)

lib/admin/
  products.ts               (server CRUD helpers)
  spec-presets.ts           (10 preset, 4 dilde label)
  schemas/product.ts        (Zod, create+update)

lib/utils/slugify.ts        (Türkçe-aware slug)
```

### Schema kullanımı (mevcut `products` tablosu)

```sql
products (
  id            uuid PK,
  slug          text UNIQUE,
  sector_id     uuid FK,
  name          jsonb,         -- {tr:"PET Kapak", en?:"PET Cap", ru?:"...", ar?:"..."}
  description   jsonb,         -- {tr:"...", en?:"...", ...}
  images        jsonb,         -- [{path:"slug/uuid.jpg", alt_text:{tr,en,ru,ar}, order:0}]
  specs         jsonb,         -- [{preset_id:"material", value:"PET"}, ...]
  active        boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at    timestamptz,
  updated_at    timestamptz
)
```

`variants` alanı NULL bırakılır (MVP'de kullanılmaz).

### Locale görünürlük filtresi (public fetch)

```ts
// /[locale]/products fetch:
const products = await supabase
  .from('products')
  .select('id, slug, sector_id, name, description, images')
  .eq('active', true)
  .not(`name->>${locale}`, 'is', null)    // o locale'de name dolu
  .neq(`name->>${locale}`, '')
  .order('display_order')
```

Detay sayfası `/[locale]/products/[slug]` aynı filtre — bulunamazsa `notFound()`.

### Save flow (Server Action)

```ts
'use server'
export async function createProduct(formData: FormData) {
  await requireAdminRole()
  const parsed = CreateProductSchema.parse(formDataToObject(formData))

  const slug = await uniqueSlug(slugify(parsed.name.tr), 'products')

  const { data, error } = await supabase.from('products').insert({
    slug,
    sector_id: parsed.sector_id,
    name: parsed.name,
    description: parsed.description,
    images: parsed.images,
    specs: parsed.specs,
    active: true,
  }).select().single()
  if (error) throw error

  await insertAudit('create', 'product', data.id, parsed)

  for (const loc of ['tr','en','ru','ar']) {
    revalidatePath(`/${loc}/products`, 'layout')
  }

  redirect('/admin/products?success=created')
}
```

### Görsel upload (client-side direkt Storage)

```ts
async function uploadImage(file: File, tempSlug: string) {
  const uuid = crypto.randomUUID()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${tempSlug}/${uuid}.${ext}`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600', contentType: file.type })
  if (error) throw error
  return { path, alt_text: { tr:'', en:'', ru:'', ar:'' }, order: 0 }
}
```

Edit mode'da slug değişirse görsel path'leri Storage'da rename edilmez (görsel URL'leri kalıcı). Slug değişince `images[].path` hâlâ eski slug'ı işaret eder; işlev değişmez, sadece path estetik değil. MVP kabul.

### Auth & RLS

- Admin route'ları: `requireAdminRole()` helper (mevcut, `lib/admin/auth.ts`)
- `products` RLS: anon select `active=true`, authenticated + `is_admin_role()` → all
- Storage `product-images` bucket: public read, admin RW (mevcut Plan 3 migration)

### Testing

**Unit:**
- `tests/unit/lib/utils/slugify.test.ts` — Türkçe karakter (İ→i, ş→s, ı→i)
- `tests/unit/lib/admin/schemas/product.test.ts` — Zod validation (TR zorunlu, EN opsiyonel, specs format)
- `tests/unit/lib/admin/spec-presets.test.ts` — 10 preset + 4 dil label

**Integration:** server action'ları test etmek için Supabase test client + transactional rollback.

**E2E:** `tests/e2e/helpers/adminLogin.ts` — Supabase admin API ile session cookie inject (programmatic login, Plan 3'te `test.skip` edilmişti, burada aktif edilir).
- `tests/e2e/admin-product-create.spec.ts`
- `tests/e2e/admin-product-edit.spec.ts`
- `tests/e2e/admin-product-delete-restore.spec.ts`
- `tests/e2e/public-products-grid.spec.ts`
- `tests/e2e/public-product-detail.spec.ts`
- `tests/e2e/rfq-product-picker.spec.ts`

### Deploy

- Coolify redeploy (Plan 4a pattern)
- Smoke: `/admin/products` login + happy path + delete/restore + public `/tr/products` + RFQ picker

### Plan 4c adayları (bu plan dışı, ileride)

- Görsel client-side compress/resize
- Variants JSONB kullanımı
- Özgün (preset-dışı) spec key ekleme
- Silinmiş ürünler için cron cleanup
- 301 redirect for slug change
- OG image generator (Plan 4b'de basit: ana görsel kullan)
- Schema.org Product markup genişletilmiş alanları (offer, availability)
