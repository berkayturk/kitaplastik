# Plan 5b PR B — Legal Pages (KVKK Privacy + Cookies × 4 locales)

**Status:** spec  
**Date:** 2026-04-26  
**Branch (planned):** `feat/plan5b-prb-legal-pages`  
**Predecessor:** Plan 5b PR A (1958e7b, #6) — `catalog_requests` data minimization + 30-day pg_cron auto-purge canlıda.  
**Estimated effort:** ~2-3 hours.

---

## Context

PR A canlıda data minimization tamam (`catalog_requests`'te yalnız `email` + `locale` saklanır, 30 gün sonra otomatik silinir, audit log catalog_requested action için IP `null`). Buna karşılık gelen yasal şeffaflık katmanı henüz yok: kullanıcı KVKK md.10 kapsamında işlenen veri/amaç/saklama/haklar/başvuru bilgisini hiçbir yerde göremiyor. Bu PR, bu boşluğu Türkçe canonical + üç çeviriyle (EN/RU/AR) kapatır.

**Cookie consent banner kapsamda DEĞİL.** PR A envanteri net: `NEXT_LOCALE` + Cloudflare Turnstile + Cloudflare bot management = strict-necessary; Plausible cookieless self-host; Sentry no-cookie config. Banner gerekmez — ePrivacy Direktifi madde 5(3) "kullanıcı tarafından açıkça istenen bilgi toplumu hizmetinin sağlanması için kesinlikle gerekli" istisnası altında consent muafiyeti uygulanır (ulusal mevzuata aktarım: KVKK ve 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun + Çerez Rehberi). Cookies sayfası bu durumda **şeffaflık zorunluluğunu** karşılar (envanter listesi + tarayıcı kontrol bilgisi).

Bu metinler **hukuk müşaviri review'undan geçmemiştir.** MVP-grade KVKK Resmi Aydınlatma Metni Hazırlama Rehberi şablonuna göre hazırlanır, içerik canlı koda %100 uyumludur. Sayfa sonunda standart disclaimer ile yasal sorumluluk sınırlanır.

---

## Goals & non-goals

**Goals**

- `/legal/privacy` (KVKK aydınlatma metni) ve `/legal/cookies` (çerez politikası) sayfaları 4 locale × 2 sayfa = 8 route olarak canlıda.
- Footer ve her form (CatalogRequestForm + ContactForm) altından erişilebilir.
- İçerik canlı koda uyumlu: yalnız `email + locale` saklanır, 30 gün auto-purge, üçüncü taraflar = Cloudflare + Plausible self-host + Sentry + Resend.
- next-intl pathnames + tipli routing: `getPathname({ href, locale })` her locale için doğru URL üretir.
- Server Component + statik render (SSG); zero client-side JS.
- Yeni unit + E2E test coverage: +12 unit, +10 E2E.
- Cookie consent banner **eklenmez**.

**Non-goals**

- Hukuk müşaviri / avukat review.
- Versiyon geçmişi sayfası (`lastUpdated` tarihi yeterli; arşiv git history'de).
- KVKK Veri Sorumluları Sicili (VERBIS) kayıt akışı — bu spec'in dışı. (Kıta Plastik için kayıt zorunluluğu durumu bu PR kapsamında **değerlendirilmez**; ayrı bir KVKK uyum review'unda netleştirilir. Privacy sayfasında "VERBIS kaydı: yok / başvuru yapılmadı" ifadesi metinde açıkça yer alacak — yanıltıcılık olmaz.)
- Cookie consent banner / preference manager UI.
- Anchor link copy buttons (`#hash` linkleri DOM'da çalışır, UI bileşeni yok).
- MDX runtime ve harici content store.
- Çoklu versiyon arşivi (geçmiş politika sayfaları).

---

## Company facts injection (privacy controller block)

**Sınır:** `lib/company.ts` (mevcut DB-backed `getCompany()` SOT) ile `messages/<locale>/legal.json` arasındaki drift önlenmeli. Yapı:

- **`getCompany()` server-side fetch** → adres / telefon / e-posta / tüzel ünvan / vergi dairesi / sicil no / MERSİS / KEP. Page server component bu veriyi fetch eder, `LegalLayout` ya da `<LegalControllerBlock company={company}>` props'una geçer (locale-bağımsız, raw string).
- **`legal.json` namespace** → yalnız locale'e bağlı **metin** + KVKK-spesifik durum alanları (örn. başvuru yöntemi prose'u, "VERBIS kaydı" başlığı, "DPO" başlığı). JSON içinde adres/telefon/e-posta DURMUYOR.

**Page sample (controller section):**
```tsx
const company = await getCompany();
// ...
<LegalSection heading={t("sections.controller.heading")}>
  <LegalControllerBlock company={company} />
</LegalSection>
```

`LegalControllerBlock` ayrı bir küçük component'tir (`components/legal/LegalControllerBlock.tsx`), structured `<dl>` ile alanları listeler; locale label'lar `legal.privacy.sections.controller.fields.*` namespace'inden gelir.

**KVKK durum alanları (kaynak ayrımı):**

| Alan | Değer kaynağı | Status |
|---|---|---|
| Tüzel ünvan | `getCompany().legalName` | DB (existing schema) |
| Adres | `getCompany().address` (street/district/city) | DB (existing schema) |
| Telefon | `getCompany().phone.display` | DB (existing schema) |
| E-posta (başvuru) | `getCompany().email.primary` | DB (existing schema) |
| Vergi dairesi / sicil no | `legal.<locale>.privacy.staticFacts.taxOffice` | locale string, **TBD release-gated** |
| MERSİS no | `legal.<locale>.privacy.staticFacts.mersisNo` | locale string, **TBD release-gated** |
| KEP adresi (varsa) | `legal.<locale>.privacy.staticFacts.kep` | locale string, **TBD release-gated**, opsiyonel |
| VERBIS kaydı durumu | `legal.<locale>.privacy.staticFacts.verbisStatus` | "Teyit bekliyor — bu PR kapsamında değerlendirilmemiştir" varsayılan; user implementation'da net değer (`yok`/`başvuru yapıldı: tarih`) verirse o yazılır |
| DPO durumu | `legal.<locale>.privacy.staticFacts.dpoStatus` | "Teyit bekliyor — bu PR kapsamında değerlendirilmemiştir" varsayılan; user net değer (`atanmadı`/`atandı: ad`) verirse o yazılır |

**Neden hibrit (DB + JSON)?** Şu anki `Company` schema'sında `tax`/`mersis`/`kep` alanları yok. Bunları schema'ya eklemek admin UI editor değişikliği + migration + test güncellemesi gerektirir, PR B scope'unu ~50% şişirir. Bu PR'da sadece KVKK-spesifik alanlar `legal.json`'a static facts olarak girer; ileride bir Plan 5b PR C (eğer gelirse) bunları `Company` schema'sına consolide edebilir.

**`staticFacts` block lokal-bağımsız değer içeren alanlar için kullanılsa bile** her 4 locale dosyasında **aynı raw string** olmalı (vergi numarası locale'a göre değişmez). Implementation'da `messages/{tr,en,ru,ar}/legal.json` `staticFacts` block'unun değerleri identical tutulur; sadece label key'leri (`taxOfficeLabel: "Vergi Dairesi"` / `Tax Office` / `Налоговая инспекция` / `الدائرة الضريبية`) çevrilir.

**Release-gate kuralı (acceptance criteria'ya bağlı):**
- Vergi dairesi / sicil no / MERSİS / KEP alanları **TBD** ise PR merge edilmez. Implementation phase başlangıcında user'a sorulur, doldurulmadan TR canonical metin yazımı başlamaz.
- VERBIS ve DPO durumları için "varsayım yerine teyit bekliyor" formülasyonu kullanılır — yanıltıcı beyan riski elimine edilir. User implementation review'unda ya "VERBIS kaydımız yok" / "DPO atadık" netliğini verir, ya "teyit bekliyor" formu metinde kalır.

**`getCompany()` ve SSG ilişkisi:** Bu sayfalar `generateStaticParams` ile build-time render edilir. `getCompany()` build-time bir kez fetch edilir (Supabase env build pipeline'da mevcut, mevcut `app/[locale]/about/page.tsx` ve Footer aynı pattern'i kullanıyor — drift yok). Runtime fetch yok, client JS yok.

---

## Routes & i18n pathnames

`i18n/routing.ts` mevcut config'ine iki yeni entry:

```ts
"/legal/privacy": {
  tr: "/yasal/gizlilik",
  en: "/legal/privacy",
  ru: "/pravovaya/konfidentsialnost",
  ar: "/qanuni/khususiyya",
},
"/legal/cookies": {
  tr: "/yasal/cerezler",
  en: "/legal/cookies",
  ru: "/pravovaya/kuki",
  ar: "/qanuni/kuki",
},
```

**Slug rasyonali:**

- TR: `yasal` (legal) + `gizlilik` / `cerezler` — KVKK rehberinin kullandığı terminoloji.
- EN: `/legal/privacy` ve `/legal/cookies` — endüstri standardı.
- RU: `pravovaya` (legal-related, sıfat formu) + `konfidentsialnost` (privacy) + `kuki` — `yuridicheskoe` daha hukuk-mesleği tonlu olduğu için tercih edilmedi.
- AR: `qanuni` (yasal) + `khususiyya` (privacy) + `kuki` (cookies). Mevcut Arapça pathnames (`man-nahnu`, `ittisal`, `al-muntajat`) Latin transliterate konvansiyonuyla tutarlı.

**Filesystem:**

```
app/[locale]/legal/
  privacy/page.tsx
  cookies/page.tsx
```

`legal/layout.tsx` **eklenmez** — sayfalar bağımsız, ortak markup `LegalLayout` component'i içinde (YAGNI).

---

## Content storage

**`messages/<locale>/legal.json`** (yeni dosya × 4 locale) **+ `i18n/request.ts` wiring**.

**Wiring (zorunlu, kolay atlanır):** Mevcut `i18n/request.ts` 7 namespace import ediyor (`common, home, nav, sectors, references, pages, catalog`). `legal` namespace **eklenmezse** `useTranslations("legal")` runtime'da fail eder. Implementation acceptance criteria'ya bu adım açıkça yazılmalı:

```ts
// i18n/request.ts (ekleme)
const [common, home, nav, sectors, references, pages, catalog, legal] = await Promise.all([
  // ... mevcut
  import(`../messages/${locale}/legal.json`).then((m) => m.default),
]);

return {
  locale,
  messages: { common, home, nav, sectors, references, pages, legal, ...catalog },
};
```

**Eksik key fallback yok:** next-intl bu projede fallback locale konfigürasyonu kullanmıyor — bir locale dosyasında key eksikse runtime'da `MISSING_MESSAGE` warn + render boş kalır. Bu PR için **tüm 4 locale dosyası tüm key set'ini eksiksiz içermeli.** "Translation completeness" assertion'ı acceptance criteria'da (aşağıda).

Yapı:

```jsonc
{
  "meta": {
    "publishedDate": "2026-04-26",
    "lastUpdated":   "2026-04-26",
    "disclaimer": "Bu metin bilgilendirme amaçlıdır; bağlayıcı yorumda yetkili mercilere başvurun."
  },
  "shared": {
    "linkLabel": {
      "privacy":  "Gizlilik Politikası",
      "cookies":  "Çerez Politikası"
    },
    "formConsentNotice": "Bu formu göndererek <privacyLink>Gizlilik Politikası</privacyLink>nı kabul etmiş olursunuz."
  },
  "privacy": {
    "title": "Gizlilik Politikası",
    "intro": "...",
    "sections": {
      "controller":   { "heading": "Veri Sorumlusu",                 "body": "..." },
      "purposes":     { "heading": "İşleme Amaçları",                "bullets": ["...", "..."] },
      "legalBasis":   { "heading": "Hukuki Sebep",                   "body": "..." },
      "categories":   { "heading": "İşlenen Veri Kategorileri",      "table": [...] },
      "thirdParties": { "heading": "Aktarım & 3. Taraflar",          "table": [...] },
      "retention":    { "heading": "Saklama Süreleri",               "body": "...", "table": [...] },
      "rights":       { "heading": "İlgili Kişi Hakları (KVKK m.11)", "bullets": [...] },
      "application":  { "heading": "Başvuru Yöntemi",                "body": "..." }
    }
  },
  "cookies": {
    "title": "Çerez Politikası",
    "intro": "...",
    "sections": {
      "what":      { "heading": "Çerez Nedir?",            "body": "..." },
      "approach":  { "heading": "Yaklaşımımız",            "body": "..." },
      "inventory": { "heading": "Çerez Envanteri",         "table": [/* 5 satır */] },
      "control":   { "heading": "Tarayıcı Kontrolü",       "body": "..." },
      "changes":   { "heading": "Politika Değişiklikleri", "body": "..." }
    }
  }
}
```

**`t.rich` placeholder konvansiyonu:**

- `<mail>info@kitaplastik.com</mail>` → `<a href="mailto:info@kitaplastik.com">`
- `<privacyLink>...</privacyLink>` → `<Link href="/legal/privacy">`
- `<cookiesLink>...</cookiesLink>` → `<Link href="/legal/cookies">`
- `<strong>...</strong>` → `<strong>`
- `<kvkk>...</kvkk>` → `<a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer">`

**Tablo şeması (kilitli):**

Her tablo iki anahtar tutar — `cols` (header label'ları, locale-translated) ve `table` (row array, cell key'leri `cols.key` ile match). Implementer için belirsizlik kalmamalı:

```jsonc
"sections": {
  "categories": {
    "heading": "İşlenen Veri Kategorileri",
    "cols": {
      "category": "Kategori",
      "data":     "İşlenen Veri",
      "source":   "Kaynak",
      "purpose":  "Amaç"
    },
    "table": [
      { "category": "Kimlik & İletişim", "data": "Ad-Soyad, e-posta, firma, telefon (opsiyonel)", "source": "Form girişi", "purpose": "Teklif/iletişim" },
      { "category": "İletişim",          "data": "E-posta, locale tercihi",                       "source": "Form girişi", "purpose": "Katalog teslimi" }
    ]
  }
}
```

`thirdParties.cols`: `{ provider, purpose, country, safeguards }`  
`retention.cols`: `{ dataType, period, basis }`  
`cookies.inventory.cols`: `{ name, purpose, party, duration, category }`

`LegalTable` component'i `cols` ve `table` array'ini ayrı prop alır — `cols` key'leri `table` row key'leriyle birebir eşleşmeli, mismatch hata vermeli (zod runtime parse veya TypeScript shape). Aşağıda Components section'ında detay.

`cookies.sections.inventory.table` (5 satır):
| name | purpose | party | duration | category |
|---|---|---|---|---|
| `NEXT_LOCALE` | Locale tercihi | 1st-party | 1 yıl | Zorunlu |
| `cf_chl_*` | Anti-bot challenge (Turnstile) | 3rd-party (Cloudflare) | Session | Zorunlu |
| `__cf_bm` | Bot management | 3rd-party (Cloudflare) | ~30 dk | Zorunlu |
| Plausible | Cookieless analitik | 1st-party (self-host) | — | Yok |
| Sentry | Cookieless error monitoring | 3rd-party | — | Yok |

---

## Çeviri stratejisi

1. **TR canonical** elle yazılır (PR A canlı state'ine birebir uyumlu — sadece email+locale, 30-day auto-purge, audit IP null, üçüncü taraflar listelenir).
2. **Terminoloji audit listesi** spec'in eki (aşağıda) — TR → EN/RU/AR sözlüğü.
3. **EN/RU/AR çevirisi** LLM-assisted, tek prompt'ta üç locale, terminoloji sözlüğü inject edilir.
4. **User audit:** çıktı user tarafından okunup anomali/yanlış-terminoloji tespit edilir, düzeltilir.
5. Tablo cell'leri (örn. cookie isimleri, üretici adları, durations) **çevrilmez**, locale fark etmeksizin sabit kalır.

### Terminoloji audit sözlüğü (initial)

| TR | EN | RU | AR |
|---|---|---|---|
| veri sorumlusu | data controller | оператор персональных данных | المتحكم في البيانات |
| veri işleyen | data processor | обработчик персональных данных | معالج البيانات |
| ilgili kişi | data subject | субъект персональных данных | صاحب البيانات |
| açık rıza | explicit consent | явное согласие | الموافقة الصريحة |
| meşru menfaat | legitimate interest | законный интерес | المصلحة المشروعة |
| KVKK | KVKK (Turkish PDPL) | KVKK (Закон о ЗПД, Турция) | KVKK (قانون حماية البيانات الشخصية، تركيا) |
| zorunlu çerez | strict-necessary cookie | строго необходимый cookie | ملف تعريف ارتباط ضروري |
| üçüncü taraf | third party | третья сторона | طرف ثالث |
| saklama süresi | retention period | срок хранения | فترة الاحتفاظ |
| veri aktarımı | data transfer | передача данных | نقل البيانات |
| ilgili kişi hakları | data subject rights | права субъекта данных | حقوق صاحب البيانات |

---

## Components

```
components/legal/
  LegalLayout.tsx           # Container + hero (title + intro) + <article> wrapper + LegalDisclaimer slot
  LegalSection.tsx          # <section><h2>{heading}</h2>{children}</section>; props: heading, children
  LegalTable.tsx            # Responsive <table>; mobile'da kart stack; a11y: <caption>, <th scope="col">
  LegalDisclaimer.tsx       # Sayfa sonu italik tek satır: publishedDate · lastUpdated · disclaimer
  LegalControllerBlock.tsx  # `getCompany()` çıktısını + staticFacts'ı <dl> ile gösterir
  index.ts                  # barrel export
```

**`LegalLayoutProps`:**
```ts
interface LegalLayoutProps {
  title: string;
  intro: ReactNode;     // t.rich çıktısı (string veya JSX)
  children: ReactNode;  // section'lar
}
```

**`LegalSectionProps`:**
```ts
interface LegalSectionProps {
  heading: string;       // <h2>
  children: ReactNode;
}
```

**`LegalTableProps` (a11y + responsive):**
```ts
interface LegalTableProps {
  caption?: string;                          // ekrana gizli ama screen-reader'a açık <caption>
  cols: Record<string, string>;              // { colKey: localizedHeader }
  rows: Record<string, string>[];            // her row anahtar set'i cols ile eşleşmeli
}
```
- md+ : `<table><caption className="sr-only">{caption}</caption><thead><tr><th scope="col">{cols.x}</th>...</tr></thead><tbody>...</tbody></table>`
- mobile (< md): `<table>` collapse → `<dl>` listesi; her row için `<dt>{cols.x}</dt><dd>{row.x}</dd>`. Caption mobile'da `<h3 className="sr-only">` olarak korunur.
- Runtime guard: `cols` ile `rows[0]` key set'i mismatch ise dev-mode'da `console.error` + boş tablo render (production silent skip; eksik key implementation hatası).

**`LegalDisclaimerProps`:**
```ts
interface LegalDisclaimerProps {
  publishedDate: string;   // legal.meta.publishedDate'den okunur
  lastUpdated:   string;
  text:          string;   // legal.meta.disclaimer
}
```
Sayfa içinde explicit prop geçişi; component içinde `useTranslations` çağırmaz (test edilebilirlik için).

**`LegalControllerBlockProps`:**
```ts
interface LegalControllerBlockProps {
  company: Company;
  labels: {
    legalName: string; address: string; phone: string; email: string;
    taxOffice: string; mersisNo: string; kep: string;
    verbisStatus: string; dpoStatus: string;
  };
  staticFacts: {
    taxOffice: string; mersisNo: string; kep?: string;
    verbisStatus: string; dpoStatus: string;
  };
}
```

**External link convention (zorunlu kural):** `legal.json` içinde `t.rich` placeholder olarak external link açılırsa (`<extLink>...</extLink>` pattern), component'in render'ında `<a href="..." target="_blank" rel="noopener noreferrer">` zorunlu. Tek istisna: `mailto:` ve `tel:` link'leri (target/rel gerekmez). Bu kural code review'da enforce edilir.

---

## Page render

**SEO pattern reuse:** `lib/seo/routes.ts` mevcut `PUBLIC_ROUTES` const + `buildAlternates(route, origin)` helper'ını kullan; özel `getPathname` çağrısı yapma. İki yeni route `PUBLIC_ROUTES`'a eklenmeli:

```ts
// lib/seo/routes.ts (ekleme)
export const PUBLIC_ROUTES = [
  // ... mevcut
  "/legal/privacy",
  "/legal/cookies",
] as const;
```

`app/[locale]/legal/privacy/page.tsx`:

```tsx
import type { ReactNode } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { getCompany } from "@/lib/company";
import {
  LegalLayout, LegalSection, LegalTable, LegalDisclaimer, LegalControllerBlock,
} from "@/components/legal";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical: `${origin}${/* getPathname inside buildAlternates current locale */ ""}`,
      ...buildAlternates("/legal/privacy", origin),
    },
  };
}
// Not: mevcut sayfalar canonical'ı buildAlternates output'undan locale'e göre
// türetiyor — implementation aşamasında app/[locale]/about/page.tsx pattern'ini
// birebir kopyala.

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tMeta, company] = await Promise.all([
    getTranslations("legal.privacy"),
    getTranslations("legal.meta"),
    getCompany(),
  ]);

  const richTags = {
    mail: (c: ReactNode) => <a href="mailto:info@kitaplastik.com">{c}</a>,
    strong: (c: ReactNode) => <strong>{c}</strong>,
    kvkk: (c: ReactNode) => (
      <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer">{c}</a>
    ),
  };

  // t.raw() dönüş tipi unknown — Array.isArray + key shape parse (zod opsiyonel)
  const purposesBullets = t.raw("sections.purposes.bullets") as unknown;
  const bullets = Array.isArray(purposesBullets) ? (purposesBullets as string[]) : [];

  return (
    <LegalLayout title={t("title")} intro={t.rich("intro", richTags)}>
      <LegalSection heading={t("sections.controller.heading")}>
        <LegalControllerBlock
          company={company}
          labels={{
            legalName: t("sections.controller.fields.legalName"),
            address: t("sections.controller.fields.address"),
            phone: t("sections.controller.fields.phone"),
            email: t("sections.controller.fields.email"),
            taxOffice: t("sections.controller.fields.taxOffice"),
            mersisNo: t("sections.controller.fields.mersisNo"),
            kep: t("sections.controller.fields.kep"),
            verbisStatus: t("sections.controller.fields.verbisStatus"),
            dpoStatus: t("sections.controller.fields.dpoStatus"),
          }}
          staticFacts={t.raw("staticFacts") as never /* parsed in component */}
        />
      </LegalSection>

      <LegalSection heading={t("sections.purposes.heading")}>
        <ul>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
      </LegalSection>

      <LegalSection heading={t("sections.categories.heading")}>
        <LegalTable
          caption={t("sections.categories.heading")}
          cols={t.raw("sections.categories.cols") as Record<string, string>}
          rows={t.raw("sections.categories.table") as Record<string, string>[]}
        />
      </LegalSection>

      {/* ... thirdParties, retention, legalBasis, rights, application ... */}

      <LegalDisclaimer
        publishedDate={tMeta("publishedDate")}
        lastUpdated={tMeta("lastUpdated")}
        text={tMeta("disclaimer")}
      />
    </LegalLayout>
  );
}
```

**`generateMetadata` canonical detayı:** Mevcut `app/[locale]/about/page.tsx` pattern'i (canonical'ı `buildAlternates(...)` output'undaki current locale URL'den okur) implementation aşamasında birebir kopyalanır. Spec yazarken örnek pseudo bırakıldı; kesin implementation `about/page.tsx` referans alınır — drift olmaz.

`app/[locale]/legal/cookies/page.tsx` — aynı pattern, `legal.cookies` namespace, inventory tablosu (`getCompany()` çağrısı yok, controller block sadece privacy'de).

**Performance & a11y:**

- RSC + statik (zero client JS); SSG ile `generateStaticParams` bütün locale'leri build-time'da render eder.
- `<h1>` tek (sayfa title), `<h2>` section başlıkları; heading hierarchy lint-clean.
- `<table>` semantik (`<th scope="col">`); mobile'da kart stack pattern.
- AR locale `dir="rtl"` mevcut root layout'tan inherit.
- `@media print` — body sadece `<article>` + `LegalDisclaimer`; header/footer/nav gizli (yasal sayfa download/print yaygın).

---

## Footer integration

`components/layout/Footer.tsx` — bottom-bar değişikliği:

**Mevcut:**
```tsx
<div className="flex flex-col gap-3 border-t ... py-6 ... md:flex-row md:items-center md:justify-between">
  <p className="font-mono">{tFooter("copyright", { year: currentYear })}</p>
  <p>{tCommon("brand.tagline")}</p>
</div>
```

**Yeni (3 element, md+ horizontal, responsive-safe):**
```tsx
<div className="flex flex-col gap-3 border-t ... py-6 ... md:flex-row md:flex-wrap md:items-center md:justify-between">
  <p className="font-mono">{tFooter("copyright", { year: currentYear })}</p>
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
    <li><Link href="/legal/privacy">{tLegal("shared.linkLabel.privacy")}</Link></li>
    <li><Link href="/legal/cookies">{tLegal("shared.linkLabel.cookies")}</Link></li>
  </ul>
  <p>{tCommon("brand.tagline")}</p>
</div>
```

**Responsive notu (Codex Gate 1 medium):** `md` breakpoint 768px civarında AR/RU uzun label + tagline + copyright birleşince sıkışabilir. Çözüm: outer container `md:flex-wrap`, link list'i `flex-wrap` + `gap-y-1` (sıkışırsa wrap, dikey boşluk ekler). Bu pattern test case'i: 768/900/1280px viewport'larda görsel preview (Playwright trace acceptance gate'i değil ama implementation'da elle doğrulanmalı, AR ve RU'ya özel dikkat).

Yeni translator: `useTranslations("legal")`. Mevcut Footer.test.tsx'e 4 locale × 2 link = 8 yeni assert eklenir.

---

## Form integration

**`components/catalog/CatalogRequestForm.tsx`** — submit Button'un altına yeni satır:

```tsx
<p className="text-text-secondary text-[12px] leading-[1.5]">
  {tShared.rich("formConsentNotice", {
    privacyLink: (c) => <Link href="/legal/privacy" className="underline">{c}</Link>,
  })}
</p>
```

Yeni translator: `useTranslations("legal.shared")` (veya catalog.form namespace'ine `consentNotice` eklenir; ortak metin için `legal.shared` tercih).

**`components/contact/ContactForm.tsx`** — aynı satır submit button'un altına.

---

## Testing strategy

### Unit (yeni)

**`tests/unit/i18n/pathnames.test.ts`** — mevcut dosyaya 8 yeni assertion:

```ts
test.each([
  ["/legal/privacy", "tr", "/tr/yasal/gizlilik"],
  ["/legal/privacy", "en", "/en/legal/privacy"],
  ["/legal/privacy", "ru", "/ru/pravovaya/konfidentsialnost"],
  ["/legal/privacy", "ar", "/ar/qanuni/khususiyya"],
  ["/legal/cookies", "tr", "/tr/yasal/cerezler"],
  ["/legal/cookies", "en", "/en/legal/cookies"],
  ["/legal/cookies", "ru", "/ru/pravovaya/kuki"],
  ["/legal/cookies", "ar", "/ar/qanuni/kuki"],
])("getPathname(%s, %s) → %s", (href, locale, expected) => {
  expect(getPathname({ href, locale })).toBe(expected);
});
```

**`tests/unit/components/Footer.test.tsx`** — 4 locale × 2 link = 8 assert (link rendered, href doğru pathname'e işaret eder).

**`tests/unit/components/legal/LegalLayout.test.tsx`** (yeni) — 4 case:
- `<h1>` title render
- `<article>` wraps children
- `LegalDisclaimer` (publishedDate + lastUpdated + uyarı) render edilir
- heading hierarchy: `<h1>` exactly one, no skip (`<h3>` before `<h2>` yok)

**Total yeni unit:** 12 case (8 + 4) — mevcut 251'e ek.

### E2E (yeni)

**`tests/e2e/legal.spec.ts`** (yeni dosya):

```ts
const cases = [
  { locale: "tr", privacy: "/tr/yasal/gizlilik",          cookies: "/tr/yasal/cerezler" },
  { locale: "en", privacy: "/en/legal/privacy",            cookies: "/en/legal/cookies" },
  { locale: "ru", privacy: "/ru/pravovaya/konfidentsialnost", cookies: "/ru/pravovaya/kuki" },
  { locale: "ar", privacy: "/ar/qanuni/khususiyya",        cookies: "/ar/qanuni/kuki" },
];

for (const c of cases) {
  test(`${c.locale} privacy: 200 + h1 + disclaimer`, async ({ page }) => {
    const res = await page.goto(c.privacy);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(/yayın tarihi|published|опубликовано|تاريخ النشر/i)).toBeVisible();
  });

  test(`${c.locale} cookies: 200 + table render`, async ({ page }) => {
    const res = await page.goto(c.cookies);
    expect(res?.status()).toBe(200);
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByText("NEXT_LOCALE")).toBeVisible();
  });
}

test("footer privacy link round-trip (TR)", async ({ page }) => {
  await page.goto("/tr");
  await page.locator("footer").getByRole("link", { name: /Gizlilik/i }).click();
  await expect(page).toHaveURL("/tr/yasal/gizlilik");
});

test("catalog form consent link round-trip (TR)", async ({ page }) => {
  await page.goto("/tr/katalog");
  await page.getByRole("link", { name: /Gizlilik Politikası/ }).click();
  await expect(page).toHaveURL("/tr/yasal/gizlilik");
});
```

**Total yeni E2E:** 10 case (8 smoke + 1 footer round-trip + 1 form round-trip), ~30s ek runtime.

### Coverage hedefleri

- Mevcut: 251 unit + 66 E2E (28 skip).
- Yeni: 263 unit + 76 E2E (28 skip).
- `pnpm verify` CI mirror yeşil olmalı.

---

## Out-of-scope

- **`app/api/contact/route.ts` IP minimization** — Plan 5b kapsamında ayrı PR (catalog gibi).
- **VERBIS kayıt dosyası** — yıllık eşik altı; bu spec'in dışı.
- **Cookie consent banner** — banner gerekmez (PR A envanter konfirmasyonu).
- **Plan 5b sonrası** — analitik tablo (`useReports`?), retention extend, legal arşiv versiyon geçmişi sayfası.

---

## Acceptance criteria

**Routing & i18n wiring**
- [ ] `i18n/routing.ts` `/legal/privacy` + `/legal/cookies` pathnames added (4 locales each).
- [ ] `i18n/request.ts` `legal` namespace import + messages object'e ekleme (atlanırsa runtime fail).
- [ ] `lib/seo/routes.ts` `PUBLIC_ROUTES` const'ına `/legal/privacy` + `/legal/cookies` eklendi.

**Content**
- [ ] `messages/{tr,en,ru,ar}/legal.json` × 4 dosya oluşturulmuş, **tüm key set'i her locale'de eksiksiz** (eksik key fallback yok — runtime warn).
- [ ] İçerik PR A canlı state'iyle uyumlu (`email + locale` only, 30 gün auto-purge, üçüncü taraflar = CF Turnstile + CF bot mgmt + Plausible self-host + Sentry + Resend).
- [ ] **TBD release-gate:** Vergi dairesi / sicil no / MERSİS / KEP alanları için user net değer verdi VEYA "teyit bekliyor" formu kullanıldı; PR body'de hangi yolun seçildiği documented.
- [ ] VERBIS ve DPO durumu: "teyit bekliyor — bu PR kapsamında değerlendirilmemiştir" varsayılan VEYA user net değer (yok / atandı: ad) verdi.

**Render & SEO**
- [ ] `app/[locale]/legal/privacy/page.tsx` ve `app/[locale]/legal/cookies/page.tsx` RSC + SSG, `generateStaticParams` 4 locale.
- [ ] `generateMetadata` mevcut `app/[locale]/about/page.tsx` pattern'iyle `buildAlternates("/legal/privacy", origin)` ve canonical set eder (absolute URL).

**Components**
- [ ] `components/legal/{LegalLayout, LegalSection, LegalTable, LegalDisclaimer, LegalControllerBlock, index}.tsx` oluşturuldu (5 component + barrel).
- [ ] `LegalDisclaimer` props ile data alır (`useTranslations` çağırmaz — test edilebilir).
- [ ] `LegalTable` `<caption>` (sr-only) + `<th scope="col">` + mobile `<dl>` stack pattern; cols/rows key shape mismatch dev-mode warn.

**Integration surfaces**
- [ ] Footer bottom-bar 3-element layout (`flex-wrap` responsive-safe), gizlilik + çerezler linkleri 4 locale'de doğru pathname'e götürür.
- [ ] CatalogRequestForm + ContactForm submit button altında consent notice satırı (`legal.shared.formConsentNotice`), link tıklayınca privacy sayfasına gider.

**Quality gates**
- [ ] +12 unit + 10 E2E test eklendi, hepsi yeşil.
- [ ] `pnpm verify` (typecheck + lint + format + 263 unit + audit + build + 76 e2e) yeşil.
- [ ] Codex Gate 2 review approve, 0 critical / 0 high.
- [ ] Squash merge → main, auto-deploy success, 4 locale × 2 sayfa = 8 URL canlı 200 döner.

---

## Sequencing (next-step)

1. **User onayı**: TBD release-gate alanları (vergi/sicil/MERSİS/KEP/VERBIS/DPO) — user implementation öncesinde değer verir veya "teyit bekliyor" formu seçer.
2. `i18n/routing.ts` ek pathnames + `i18n/request.ts` `legal` namespace import + `lib/seo/routes.ts` `PUBLIC_ROUTES` ekleme.
3. `tests/unit/i18n/pathnames.test.ts` 8 yeni case (RED→GREEN).
4. `messages/tr/legal.json` canonical TR — full content (tüm section + cols + table + staticFacts).
5. LLM-assisted EN/RU/AR + terminoloji sözlüğü (`messages/{en,ru,ar}/legal.json`); user audit pass.
6. `components/legal/*` — LegalLayout, LegalSection, LegalTable, LegalDisclaimer, LegalControllerBlock, index.
7. `tests/unit/components/legal/LegalLayout.test.tsx` + `LegalTable.test.tsx` (a11y caption + scope) + `LegalDisclaimer.test.tsx` — toplam 4 case.
8. `app/[locale]/legal/privacy/page.tsx` ve `cookies/page.tsx` (`getCompany()` privacy'de, `buildAlternates` mevcut pattern).
9. `components/layout/Footer.tsx` bottom-bar 3-element + `Footer.test.tsx` 8 yeni assert.
10. `components/catalog/CatalogRequestForm.tsx` + `components/contact/ContactForm.tsx` consent notice satırı.
11. `tests/e2e/legal.spec.ts` 10 case.
12. `pnpm verify` full CI mirror; `rm -rf .next` ilk fail görüldüyse.
13. PR aç → CI yeşil → `codex:codex-rescue` Gate 2 → critical/high inline fix, low/medium PR body'e.
14. Squash merge → auto-deploy → 8 URL canlı 200 smoke; AR ve RU footer responsive görsel doğrulama (768/900/1280px).
15. Memory + RESUME update; `/save-session`.

---

## Risks

- **`lib/company.ts` ile drift** — Footer ve `LegalLayout` aynı şirket verisini ayrı string olarak tutarsa, ileride bir alan değişirse iki yerde eşit güncellenmezse yanıltıcılık oluşur. Mitigasyon: `lib/company.ts` (zaten var) tek doğruluk kaynağı; `legal.json` static block sadece KVKK-spesifik alanları (VERBIS, DPO durumu) tutar; address + phone + email Footer ile aynı kaynaktan okunur.
- **Vergi dairesi / MERSİS placeholder** — implementation öncesinde user tarafından doldurulmadan PR açılırsa metinde `[Vergi dairesi: TBD]` görünür. Mitigasyon: implementation phase başlangıcında user'a açıkça sorulur, doldurulmadan TR canonical content yazımı başlamaz.
- **LLM çeviri terminoloji drift** — mitigasyon: terminoloji sözlüğü (yukarıda) prompt'a inject edilir, user post-output audit eder.
- **Tablo responsive mobile stack pattern** — design system'de mevcut değil, ilk kez `LegalTable`'da kuruluyor; örnek için sectors/products tablo paternleri yok. Mitigasyon: `LegalTable.test.tsx` viewport assertion + manuel mobile preview.
- **AR `dir="rtl"` table flip** — CSS `text-align: start` kullanımı; manuel AR sayfa preview gerekli.
- **E2E `@text` locale-specific regex** — disclaimer text 4 dilde regex ile match ediliyor; çeviri tek satırda kararlı kelime içermeli (ör. "Yayın tarihi" / "Published" / "Опубликовано" / "تاريخ النشر").
- **next-intl `t.raw` array desteği** — namespace tipinde `bullets` ve `table` array; `t.raw()` dönüş tipi unknown, runtime çalışır ama TS uyarısı verebilir. Mitigasyon: gerekirse zod parse veya tip cast.

---

## Decisions log

- **Hibrit içerik (KVKK rehber iskelet + Kıta Plastik özel)** seçildi — yapı standart, içerik canlı koda %100 uyumlu.
- **`messages/<locale>/legal.json` namespace** seçildi — mevcut next-intl pipeline'ıyla tutarlı, MDX runtime overhead'i yok.
- **TR canonical hand-write + LLM-assisted EN/RU/AR + terminoloji sözlüğü** seçildi — PR A precedent, hızlı + tutarlı.
- **Sayfa sonu italik disclaimer** seçildi — yasal sayfa görünümünü zedelemez, transparent.
- **Inline cookie envanteri tablosu** seçildi — KVKK rehberi önerisi, denetim için kanıt.
- **Footer bottom-bar 3-element** seçildi — yeni 5. kolon yerine inline; daha hafif.
- **Cookie consent banner eklenmez** — PR A envanter doğrulandı (zorunlu+cookieless karışım, ePrivacy 6.1.b istisnası).
- **`legal/layout.tsx` eklenmez** — YAGNI; ortak markup `LegalLayout` component'i içinde.
- **RU `pravovaya`** seçildi (`yuridicheskoe` yerine) — daha doğal sıfat formu.
- **AR `kuki` article'sız** — mevcut pathname konvansiyonuyla tutarlı (`ittisal` gibi).
- **`Company` schema değişmez** — `tax`/`mersis`/`kep` alanları DB schema yerine `legal.json staticFacts` block'una konur; admin UI editor + migration scope'una girilmez (PR B süresi dar tutulur).
- **`getCompany()` build-time fetch (SSG-uyumlu)** — page-level `await getCompany()` mevcut `app/[locale]/about/page.tsx` pattern'iyle aynı; runtime fetch yok.
- **TBD release-gate** — vergi/MERSİS/KEP/VERBIS/DPO alanlarından biri belirsiz kalırsa PR merge edilmez; "teyit bekliyor" formu kabul edilebilir alternatif.
- **`buildAlternates` reuse** — özel `getPathname` çağrısı yerine `lib/seo/routes.ts` mevcut helper'ı kullanılır (canonical absolute URL, `x-default` defaultLocale).
- **Translation completeness zorunlu** — fallback locale yok; tüm 4 locale dosyası tüm key set'ini içermeli, eksik key runtime warn üretir.
- **External link `rel="noopener noreferrer"` zorunlu kural** — `t.rich` external-link convention'ı code review'da enforce edilir.

---

## Review Log — 2026-04-26 (Codex)

**Spec hash (review öncesi):** `sha256:24ad509471bbe8f1cfd81f218f75f7c8193bdd63e27e5aafd86e15dab97e95d9`
**Spec hash (review fix sonrası):** `sha256:759a5fe00532252e6812151508bb9db0918bbd2ceaf176e1944b217efbac8d22`
**Review round:** 1
**Status:** completed

### Özet (3 satır)
- En önemli bulgu: `i18n/request.ts` legal namespace wiring + `lib/seo/routes.ts` `PUBLIC_ROUTES` + `buildAlternates` pattern reuse atlandığında runtime fail / SEO eksik kalır — implementation acceptance gate'i olmaksızın bu kolay atlanır.
- Genel risk: **high**, ama 0 critical; spec belirsizliği giderildikten sonra implementation phase güvenli.
- Öneri: 6 high inline fix yap, 4 medium kabul edilen iyileştirmeleri uygula, 3 low + 3 medium karar Review Log'da kayıtla.

### Bulgular & disposition

| Severity | Section | Issue (özet) | Disposition |
|---|---|---|---|
| high | Content storage / Architecture fit | `i18n/request.ts` `legal` namespace import eksik | **FIXED inline** — Content storage + Sequencing + Acceptance criteria'ya wiring step eklendi |
| high | Architecture fit / SEO | `lib/seo/routes.ts` `PUBLIC_ROUTES` + `buildAlternates` pattern reuse atlandı | **FIXED inline** — Page render section'da `buildAlternates("/legal/privacy", origin)` pattern, `PUBLIC_ROUTES` ekleme acceptance'a eklendi |
| high | Internal coherence / Company facts | `lib/company.ts` SOT vs `legal.json` drift sınırı belirsiz | **FIXED inline** — Company facts injection section yeniden yazıldı: DB-backed alanlar `getCompany()`, KVKK-spesifik durum alanları `legal.json staticFacts` block, Company schema değişmez |
| high | Placeholder/TBD / Legal risk | VERBIS/DPO ifadeleri varsayım, yanıltıcı beyan riski | **FIXED inline** — "Teyit bekliyor — bu PR kapsamında değerlendirilmemiştir" varsayılan formuna döndürüldü; user net değer verirse implementation'da yazılır |
| high | Internal coherence / Content schema | JSON `cols` alanı + table key set tanımlı değil | **FIXED inline** — Content storage section'a kilitli schema (cols + table per-section + cookie inventory cols) eklendi |
| high | Internal coherence / Component contract | `LegalDisclaimer` props arayüzü tanımsız | **FIXED inline** — Components section'da `LegalDisclaimerProps`, `LegalLayoutProps`, `LegalSectionProps`, `LegalTableProps`, `LegalControllerBlockProps` interface'leri tanımlandı |
| medium | Migration safety / SSG | Statik render + `getCompany()` build-time/runtime davranışı belirsiz | **FIXED inline** — Company facts section "build-time fetch, runtime yok" netliği eklendi; mevcut `about/page.tsx` pattern referansı |
| medium | Edge cases / Type safety | `t.raw()` unknown dönüş, runtime crash riski | **FIXED inline** — Page render örneğinde `Array.isArray` guard eklendi; `LegalTable` component dev-mode mismatch warn |
| medium | Edge cases / Missing translations | Fallback locale yok, eksik key davranışı | **FIXED inline** — Content storage'a "fallback yok, tüm 4 locale eksiksiz" kuralı + Acceptance criteria checkbox |
| medium | Security / External links | `rel="noopener noreferrer"` external-link convention enforce edilmiyor | **FIXED inline** — Components section'a "External link convention zorunlu kural" eklendi |
| medium | Edge cases / Footer responsiveness | 768-900px AR/RU uzun label sıkışma riski | **FIXED inline** — Footer integration'a `flex-wrap` + responsive note eklendi, manuel preview gate (acceptance criteria sequencing step 14) |
| medium | Edge cases / Table accessibility | `<caption>` + `scope="col"` mobile stack a11y | **FIXED inline** — `LegalTableProps`'a `caption` prop, `<caption className="sr-only">`, `<th scope="col">`, mobile `<dl>` h3 fallback |
| medium | Security / Mailto exposure | `mailto:info@kitaplastik.com` spam scraping yüzeyi | **ACCEPTED trade-off** — info@ adresi zaten Footer'da plain text + ContactForm'da görünür; `mailto:` açıklayıcı eklemek kullanıcı deneyimini artırır, marjinal ek scraping riski kabul edilir. Öneri: ileri PR'da `info[at]kitaplastik.com` text-only fallback + JS-rendered mailto eklenebilir, bu PR scope'una alınmaz. |
| medium | Architecture fit / Test mock | `Footer.test.tsx` Link mock locale-aware vs href assertion | **DEFERRED to implementation** — implementation aşamasında mevcut `Footer.test.tsx` mock pattern'i incelenir; "link present + semantic label" yaklaşımı default, gerekirse `getPathname` mock'u i18n test dosyalarında zaten var |
| low | Scope creep | 5 component + terminoloji sözlüğü + print + mobile restack çok | **PARTIAL ACCEPT** — Print stylesheet acceptance'tan çıkarıldı (low priority, ileride eklenebilir); diğer parçalar core scope. Terminoloji sözlüğü zorunlu (LLM çeviri kalitesi için). |
| low | Edge cases / Print stylesheet | Print impl planı yok | **REMOVED from scope** — print mode bu PR'dan çıkarıldı; "nice-to-have" olarak ileri PR'a not eklenebilir |
| low | Placeholder/TBD | TBD release gate net değil | **FIXED inline** — Acceptance criteria'da TBD release-gate checkbox: "alanlar net değer veya 'teyit bekliyor' formu, hangi yol seçildiği PR body'de" |

### Net değişiklik kalemi
- 6 high → 6 inline fix (spec'te yer aldı)
- 7 medium → 5 inline fix + 1 trade-off accept + 1 deferred
- 3 low → 1 inline fix + 1 removed from scope + 1 part-accept

### Re-review
**Yok** (memory `feedback_codex_dual_review_gate.md` precedent: tek round convergence). Gate 2 PR-diff review merge öncesinde koşacak.
