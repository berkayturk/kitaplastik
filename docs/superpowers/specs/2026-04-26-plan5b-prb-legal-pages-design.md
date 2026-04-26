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

## Company facts to embed (privacy controller block)

Bu bilgiler `messages/<locale>/legal.json` içinde Veri Sorumlusu section'ında (privacy.sections.controller.body) gömülecek — implementation aşamasında doğrudan TR canonical metinde yer alır:

| Alan | Değer |
|---|---|
| Tüzel ünvan | Kıta Plastik ve Tekstil Sanayi ve Ticaret Limited Şirketi |
| Adres | Küçükbalıklı Mah. 2. Kadem Sk. No: 40, 16250 Osmangazi/Bursa |
| Telefon | (footer'daki `company.phone.display` ile aynı kaynak) |
| E-posta (başvuru) | info@kitaplastik.com |
| Vergi dairesi / sicil no | **TBD** — placeholder, implementation öncesinde user tarafından doldurulacak |
| MERSİS no | **TBD** — placeholder, varsa eklenir |
| VERBIS kaydı | Yok / başvuru yapılmadı (açıkça belirtilir) |
| DPO (Veri Koruma Görevlisi) | Atanmamış (ihtiyaç değerlendirmesi açık) |
| KEP adresi | (varsa) — implementation aşamasında user'dan alınır |

Kaynak adresleri `lib/company.ts` ile tutarlı tutulmalı (Footer + LegalPrivacy aynı veriden okur — drift önleme). Tüzel ünvan + KVKK başvuru e-postası + adres tek doğruluk kaynağıdır; 4 locale `legal.json` bunları aynı string olarak referans alır (locale'e göre çevrilmez).

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

**`messages/<locale>/legal.json`** (yeni dosya × 4 locale).

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

**Tablo verisi (örnek):**

`privacy.sections.categories.table`:
```jsonc
[
  { "category": "Kimlik & İletişim", "data": "Ad-Soyad, e-posta, firma, telefon (opsiyonel)", "source": "Form girişi", "purpose": "Teklif/iletişim" },
  { "category": "İletişim",          "data": "E-posta, locale tercihi",                       "source": "Form girişi", "purpose": "Katalog teslimi" }
]
```

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
  LegalLayout.tsx       # Container + hero (title + intro) + <article> wrapper + LegalDisclaimer slot
  LegalSection.tsx      # <section><h2>{heading}</h2>{children}</section>; props: heading, children
  LegalTable.tsx        # Responsive <table>; mobile'da stack; props: columns, rows
  LegalDisclaimer.tsx   # Sayfa sonu italik tek satır: publishedDate · lastUpdated · disclaimer
  index.ts              # barrel export
```

**`LegalLayout` propları:**
```ts
interface LegalLayoutProps {
  title: string;
  intro: string;       // veya ReactNode (t.rich kullanımı için)
  children: ReactNode; // section'lar
}
```

**`LegalTable` propları:**
```ts
interface LegalTableProps {
  columns: { key: string; header: string }[];
  rows: Record<string, string>[];
}
```
Mobile (< md) renderda `<table>` collapse edilir; her row kart olarak yeniden çizilir (`<dl><dt>{header}</dt><dd>{value}</dd></dl>` pattern). md+ üzerinde standart `<table>`.

---

## Page render

`app/[locale]/legal/privacy/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPathname } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import {
  LegalLayout, LegalSection, LegalTable, LegalDisclaimer,
} from "@/components/legal";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical: getPathname({ href: "/legal/privacy", locale }),
      languages: Object.fromEntries(
        locales.map((l) => [l, getPathname({ href: "/legal/privacy", locale: l })])
      ),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal.privacy");

  const richTags = {
    mail: (c: ReactNode) => <a href="mailto:info@kitaplastik.com">{c}</a>,
    strong: (c: ReactNode) => <strong>{c}</strong>,
    kvkk: (c: ReactNode) => (
      <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer">{c}</a>
    ),
  };

  return (
    <LegalLayout title={t("title")} intro={t.rich("intro", richTags)}>
      <LegalSection heading={t("sections.controller.heading")}>
        {t.rich("sections.controller.body", richTags)}
      </LegalSection>

      <LegalSection heading={t("sections.purposes.heading")}>
        <ul>{t.raw("sections.purposes.bullets").map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>
      </LegalSection>

      <LegalSection heading={t("sections.categories.heading")}>
        <LegalTable
          columns={[
            { key: "category", header: t("sections.categories.cols.category") },
            { key: "data",     header: t("sections.categories.cols.data") },
            { key: "source",   header: t("sections.categories.cols.source") },
            { key: "purpose",  header: t("sections.categories.cols.purpose") },
          ]}
          rows={t.raw("sections.categories.table")}
        />
      </LegalSection>

      {/* ... thirdParties, retention, legalBasis, rights, application ... */}

      <LegalDisclaimer />
    </LegalLayout>
  );
}
```

`app/[locale]/legal/cookies/page.tsx` — aynı pattern, `legal.cookies` namespace, inventory tablosu.

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

**Yeni (3 element, md+ horizontal):**
```tsx
<div className="flex flex-col gap-3 border-t ... py-6 ... md:flex-row md:items-center md:justify-between">
  <p className="font-mono">{tFooter("copyright", { year: currentYear })}</p>
  <ul className="flex gap-4 text-[13px]">
    <li><Link href="/legal/privacy">{tLegal("shared.linkLabel.privacy")}</Link></li>
    <li><Link href="/legal/cookies">{tLegal("shared.linkLabel.cookies")}</Link></li>
  </ul>
  <p>{tCommon("brand.tagline")}</p>
</div>
```

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

- [ ] `i18n/routing.ts` `/legal/privacy` + `/legal/cookies` pathnames added (4 locales each).
- [ ] `messages/<locale>/legal.json` × 4 dosya oluşturulmuş, içerik PR A canlı state'iyle uyumlu.
- [ ] `app/[locale]/legal/privacy/page.tsx` ve `app/[locale]/legal/cookies/page.tsx` RSC + SSG, `generateStaticParams` 4 locale.
- [ ] `app/[locale]/legal/privacy/page.tsx` ve cookies — `generateMetadata` `alternates.languages` + `canonical` set eder.
- [ ] `components/legal/{LegalLayout,LegalSection,LegalTable,LegalDisclaimer,index}.tsx` oluşturuldu.
- [ ] Footer bottom-bar 3-element layout, gizlilik + çerezler linkleri 4 locale'de doğru pathname'e götürür.
- [ ] CatalogRequestForm + ContactForm submit button altında consent notice satırı, link tıklayınca privacy sayfasına gider.
- [ ] +12 unit + 10 E2E test eklendi, hepsi yeşil.
- [ ] `pnpm verify` (typecheck + lint + format + 263 unit + audit + build + 76 e2e) yeşil.
- [ ] Codex Gate 2 review approve, 0 critical / 0 high.
- [ ] Squash merge → main, auto-deploy success, 4 locale × 2 sayfa = 8 URL canlı 200 döner.

---

## Sequencing (next-step)

1. `i18n/routing.ts` ek pathnames + `tests/unit/i18n/pathnames.test.ts` 8 yeni case (RED→GREEN).
2. `messages/tr/legal.json` canonical TR — full content.
3. LLM-assisted EN/RU/AR + terminoloji sözlüğü (`messages/{en,ru,ar}/legal.json`).
4. `components/legal/*` — LegalLayout, LegalSection, LegalTable, LegalDisclaimer, index.
5. `tests/unit/components/legal/LegalLayout.test.tsx` — 4 case.
6. `app/[locale]/legal/privacy/page.tsx` ve `cookies/page.tsx`.
7. `components/layout/Footer.tsx` bottom-bar 3-element + `Footer.test.tsx` 8 yeni assert.
8. `components/catalog/CatalogRequestForm.tsx` + `components/contact/ContactForm.tsx` consent notice satırı.
9. `tests/e2e/legal.spec.ts` 10 case.
10. `pnpm verify` full CI mirror; `rm -rf .next` ilk fail görüldüyse.
11. `codex-review-spec` Gate 1 (zaten bu spec içinde) → değişiklik gerektirmiyorsa skip; gerekirse fix.
12. PR aç → CI yeşil → `codex:codex-rescue` Gate 2 → low/medium PR body'e, critical/high inline fix.
13. Squash merge → auto-deploy → 8 URL canlı 200 smoke.
14. Memory + RESUME update; `/save-session`.

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
