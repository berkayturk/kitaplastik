# Plan 5b PR B — Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KVKK gizlilik politikası ve çerez politikası sayfalarını 4 locale × 2 sayfa = 8 route olarak canlıya çıkar; Footer + Catalog/Contact form altından erişilebilir; içerik Plan 5b PR A canlı state'iyle uyumlu (yalnız email+locale, 30 gün auto-purge); cookie consent banner eklenmeden.

**Architecture:** RSC + statik (SSG, `generateStaticParams` 4 locale); content `messages/<locale>/legal.json` namespace içinde; reusable component'ler `components/legal/` (`LegalLayout`, `LegalSection`, `LegalTable`, `LegalDisclaimer`, `LegalControllerBlock`); company facts `getCompany()` SOT'tan, KVKK-spesifik staticFacts JSON'dan; placeholder string'ler ile gönderim + ileride patch PR.

**Tech Stack:** Next.js 15 App Router, next-intl v4 (`localePrefix: "always"`, pathnames-based routing), Tailwind CSS, vitest + @testing-library/react (unit), Playwright (E2E), TypeScript strict.

**Spec reference:** `docs/superpowers/specs/2026-04-26-plan5b-prb-legal-pages-design.md` (hash `c60eb4d1...`).

---

## File Structure

**New files (created):**
- `messages/tr/legal.json` — TR canonical content (KVKK iskelet + Kıta Plastik özel)
- `messages/en/legal.json` — EN translation
- `messages/ru/legal.json` — RU translation
- `messages/ar/legal.json` — AR translation
- `components/legal/LegalLayout.tsx` — page-level container (title + intro + article + disclaimer slot)
- `components/legal/LegalSection.tsx` — `<section><h2>...</h2>{children}</section>`
- `components/legal/LegalTable.tsx` — responsive `<table>` with caption + a11y
- `components/legal/LegalDisclaimer.tsx` — sayfa sonu italik tek satır, props-only
- `components/legal/LegalControllerBlock.tsx` — Veri Sorumlusu `<dl>` block, `getCompany()` + staticFacts merge
- `components/legal/index.ts` — barrel export
- `app/[locale]/legal/privacy/page.tsx` — privacy RSC + SSG + `getCompany()` fetch
- `app/[locale]/legal/cookies/page.tsx` — cookies RSC + SSG (no company fetch)
- `tests/unit/components/legal/LegalLayout.test.tsx` — heading hierarchy + disclaimer
- `tests/unit/components/legal/LegalTable.test.tsx` — caption + scope + row/col mismatch
- `tests/unit/components/legal/LegalDisclaimer.test.tsx` — 3 prop render
- `tests/e2e/legal.spec.ts` — 10 case (8 smoke + 2 round-trip)

**Modified files:**
- `i18n/routing.ts` — add `/legal/privacy` + `/legal/cookies` pathnames
- `i18n/request.ts` — import `legal` namespace + add to messages object
- `lib/seo/routes.ts` — add 2 entries to `PUBLIC_ROUTES`
- `tests/unit/i18n/pathnames.test.ts` — add 2 new `it()` blocks (4 locale assertion each = 8 total)
- `components/layout/Footer.tsx` — bottom-bar 3-element layout + `useTranslations("legal")`
- `tests/unit/components/Footer.test.tsx` — add `legal` namespace messages + 8 new asserts
- `components/catalog/CatalogRequestForm.tsx` — submit altı consent notice satırı
- `components/contact/ContactForm.tsx` — submit altı consent notice satırı

---

## Task 0: Create feature branch

**Files:** none

- [ ] **Step 1: Switch from main to new feature branch**

```bash
git checkout main
git pull origin main
git checkout -b feat/plan5b-prb-legal-pages
```

Expected: `Switched to a new branch 'feat/plan5b-prb-legal-pages'`

- [ ] **Step 2: Verify clean state**

```bash
git status
```

Expected: `nothing to commit, working tree clean` (`.claude/scheduled_tasks.lock` runtime artifact ignore).

---

## Task 1: i18n routing + request wiring + PUBLIC_ROUTES

Adds two new pathnames, wires the `legal` namespace into i18n loader, and registers routes for SEO `buildAlternates` reuse.

**Files:**
- Modify: `tests/unit/i18n/pathnames.test.ts` (append 2 `it()` blocks at end of describe)
- Modify: `i18n/routing.ts:11-73` (extend pathnames object)
- Modify: `i18n/request.ts:9-22` (import + messages object)
- Modify: `lib/seo/routes.ts:4-15` (extend `PUBLIC_ROUTES` const)

- [ ] **Step 1: Write failing pathname tests**

Append to `tests/unit/i18n/pathnames.test.ts` inside the `describe(...)` block:

```ts
  it("/legal/privacy", () => {
    expect(getPathname({ href: "/legal/privacy", locale: "tr" })).toBe("/tr/yasal/gizlilik");
    expect(getPathname({ href: "/legal/privacy", locale: "en" })).toBe("/en/legal/privacy");
    expect(getPathname({ href: "/legal/privacy", locale: "ru" })).toBe("/ru/pravovaya/konfidentsialnost");
    expect(getPathname({ href: "/legal/privacy", locale: "ar" })).toBe("/ar/qanuni/khususiyya");
  });

  it("/legal/cookies", () => {
    expect(getPathname({ href: "/legal/cookies", locale: "tr" })).toBe("/tr/yasal/cerezler");
    expect(getPathname({ href: "/legal/cookies", locale: "en" })).toBe("/en/legal/cookies");
    expect(getPathname({ href: "/legal/cookies", locale: "ru" })).toBe("/ru/pravovaya/kuki");
    expect(getPathname({ href: "/legal/cookies", locale: "ar" })).toBe("/ar/qanuni/kuki");
  });
```

- [ ] **Step 2: Run tests, expect FAIL**

```bash
pnpm vitest run tests/unit/i18n/pathnames.test.ts
```

Expected: 2 failures (`Invalid href: /legal/privacy` veya `/legal/cookies`).

- [ ] **Step 3: Add pathnames to `i18n/routing.ts`**

In `i18n/routing.ts` `pathnames` object (after the existing `/sectors/textile` entry, before the closing `}`), add:

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

- [ ] **Step 4: Run tests, expect PASS**

```bash
pnpm vitest run tests/unit/i18n/pathnames.test.ts
```

Expected: all tests pass (existing + 2 new).

- [ ] **Step 5: Wire `legal` namespace into `i18n/request.ts`**

Replace the body of `getRequestConfig` callback in `i18n/request.ts`:

```ts
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const [common, home, nav, sectors, references, pages, catalog, legal] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/home.json`).then((m) => m.default),
    import(`../messages/${locale}/nav.json`).then((m) => m.default),
    import(`../messages/${locale}/sectors.json`).then((m) => m.default),
    import(`../messages/${locale}/references.json`).then((m) => m.default),
    import(`../messages/${locale}/pages.json`).then((m) => m.default),
    import(`../messages/${locale}/catalog.json`).then((m) => m.default),
    import(`../messages/${locale}/legal.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: { common, home, nav, sectors, references, pages, legal, ...catalog },
  };
});
```

- [ ] **Step 6: Add routes to `lib/seo/routes.ts`**

In `lib/seo/routes.ts` `PUBLIC_ROUTES`, append two entries before the closing `]`:

```ts
  "/legal/privacy",
  "/legal/cookies",
```

So the final array reads:

```ts
export const PUBLIC_ROUTES = [
  "/",
  "/sectors",
  "/sectors/bottle-washing",
  "/sectors/caps",
  "/sectors/textile",
  "/products",
  "/about",
  "/contact",
  "/references",
  "/request-quote",
  "/legal/privacy",
  "/legal/cookies",
] as const;
```

- [ ] **Step 7: Verify typecheck still clean**

```bash
pnpm typecheck
```

Expected: 0 errors. (Note: until messages files are created in Task 2/3, build will fail — that's OK, typecheck is what we're verifying.)

- [ ] **Step 8: Commit**

```bash
git add i18n/routing.ts i18n/request.ts lib/seo/routes.ts tests/unit/i18n/pathnames.test.ts
git commit -m "feat(legal): add /legal/{privacy,cookies} routes + i18n wiring + SEO routes"
```

---

## Task 2: TR canonical legal.json

Writes the canonical Turkish content. KVKK Resmi Aydınlatma Metni Hazırlama Rehberi (https://www.kvkk.gov.tr) iskeleti, Plan 5b PR A canlı state'iyle %100 uyumlu içerik. `staticFacts` 5 alanı "Bilgi güncelleniyor" placeholder.

**Files:**
- Create: `messages/tr/legal.json`

- [ ] **Step 1: Create `messages/tr/legal.json` with full content**

Write `messages/tr/legal.json`:

```jsonc
{
  "meta": {
    "publishedDate": "26 Nisan 2026",
    "lastUpdated": "26 Nisan 2026",
    "disclaimer": "Bu metin bilgilendirme amaçlıdır; bağlayıcı yorumda yetkili mercilere başvurun."
  },
  "shared": {
    "linkLabel": {
      "privacy": "Gizlilik Politikası",
      "cookies": "Çerez Politikası"
    },
    "formConsentNotice": "Bu formu göndererek <privacyLink>Gizlilik Politikası</privacyLink>'nı kabul etmiş olursunuz."
  },
  "privacy": {
    "title": "Gizlilik Politikası",
    "intro": "Kıta Plastik ve Tekstil Sanayi ve Ticaret Limited Şirketi (\"Kıta Plastik\", \"biz\") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"<kvkk>KVKK</kvkk>\") kapsamında işlediğimiz kişisel verilerinizle ilgili sizi bu metinle bilgilendiriyoruz. Web sitemizde yalnızca <strong>iletişim ve katalog talepleri için kesinlikle gerekli olan asgari veriyi</strong> işliyoruz; üçüncü taraf reklamcılık çerezleri ya da kullanıcı izleme yapmıyoruz.",
    "staticFacts": {
      "taxOffice": "Bilgi güncelleniyor",
      "mersisNo": "Bilgi güncelleniyor",
      "kep": "Bilgi güncelleniyor",
      "verbisStatus": "Bilgi güncelleniyor",
      "dpoStatus": "Bilgi güncelleniyor"
    },
    "sections": {
      "controller": {
        "heading": "1. Veri Sorumlusu",
        "fields": {
          "legalName": "Tüzel Ünvan",
          "address": "Adres",
          "phone": "Telefon",
          "email": "E-posta (KVKK başvuru)",
          "taxOffice": "Vergi Dairesi / Sicil No",
          "mersisNo": "MERSİS No",
          "kep": "KEP Adresi",
          "verbisStatus": "VERBIS Kaydı",
          "dpoStatus": "Veri Koruma Görevlisi (DPO)"
        }
      },
      "purposes": {
        "heading": "2. Kişisel Verilerin İşlenme Amaçları",
        "bullets": [
          "Talep ettiğiniz kataloğun e-posta adresinize gönderilmesi",
          "İletişim formundan ilettiğiniz mesajlara cevap verilmesi",
          "Hizmetlerimizle ilgili teklif ve fizibilite süreçlerinin yürütülmesi",
          "Bot ve istenmeyen taleplerin engellenmesi (Cloudflare Turnstile ile teknik koruma)",
          "Hizmetlerimizin yasal yükümlülükler kapsamında belgelenmesi (audit log)"
        ]
      },
      "legalBasis": {
        "heading": "3. Hukuki Sebep",
        "body": "Kişisel verileriniz, KVKK m.5/2-(c) <strong>sözleşmenin kurulması ve ifası için gerekli olması</strong>, m.5/2-(e) <strong>haklarımızın tesisi ve korunması için zorunlu olması</strong> ve m.5/2-(f) <strong>meşru menfaatimiz için gerekli olması</strong> hukuki sebeplerine dayanılarak işlenir. Açık rıza gerektiren bir işleme yapılmamaktadır."
      },
      "categories": {
        "heading": "4. İşlenen Veri Kategorileri",
        "cols": {
          "category": "Kategori",
          "data": "İşlenen Veri",
          "source": "Kaynak",
          "purpose": "Amaç"
        },
        "table": [
          {
            "category": "İletişim (Katalog Talebi)",
            "data": "E-posta adresi, dil tercihi (locale)",
            "source": "Katalog talep formu girişi",
            "purpose": "Katalog teslimi"
          },
          {
            "category": "Kimlik & İletişim (Mesaj Formu)",
            "data": "Ad-Soyad, e-posta, firma (opsiyonel), telefon (opsiyonel), konu, mesaj içeriği",
            "source": "İletişim formu girişi",
            "purpose": "Mesajınıza yanıt verme"
          },
          {
            "category": "İşlem Güvenliği",
            "data": "Audit log kayıtları (IP <strong>kaydedilmez</strong> – yalnızca işlem türü ve zaman damgası)",
            "source": "Sunucu logları",
            "purpose": "Yasal yükümlülük + güvenlik"
          }
        ]
      },
      "thirdParties": {
        "heading": "5. Aktarım & Üçüncü Taraflar",
        "body": "Verilerinizi yalnızca aşağıdaki <strong>hizmet sağlayıcı (veri işleyen)</strong> kuruluşlarla, yalnızca tanımlı işlevin yerine getirilmesi için paylaşıyoruz. Reklam, pazarlama veya analitik verisi satışı yapılmaz.",
        "cols": {
          "provider": "Hizmet Sağlayıcı",
          "purpose": "Amaç",
          "country": "Ülke / Bölge",
          "safeguards": "Önlemler"
        },
        "table": [
          {
            "provider": "Resend (e-posta gönderimi)",
            "purpose": "Katalog ve form mesajı teslimat",
            "country": "AB / ABD",
            "safeguards": "TLS 1.2+, hizmet sözleşmesi"
          },
          {
            "provider": "Cloudflare (CDN, Turnstile, bot mitigation)",
            "purpose": "Web sitesi teslimatı + anti-bot koruma",
            "country": "Global Edge",
            "safeguards": "TLS 1.2+, GDPR-uyumlu DPA"
          },
          {
            "provider": "Supabase (veritabanı)",
            "purpose": "Form taleplerinin saklanması (e-posta + locale)",
            "country": "AB (eu-central-1)",
            "safeguards": "AB içi veri ikametgahı, TLS 1.2+"
          },
          {
            "provider": "Plausible Analytics (self-host)",
            "purpose": "Web sitesi ziyaret istatistikleri (cookieless, anonim)",
            "country": "Almanya",
            "safeguards": "Çerez kullanmaz, IP hash'lenir"
          },
          {
            "provider": "Sentry (hata izleme)",
            "purpose": "Sunucu/istemci hata raporlama",
            "country": "AB",
            "safeguards": "Çerez kullanmaz, hassas veri filtrelenir"
          }
        ]
      },
      "retention": {
        "heading": "6. Saklama Süreleri",
        "body": "Verilerinizi yalnızca işleme amacı için gerekli olan süre kadar saklarız:",
        "cols": {
          "dataType": "Veri Türü",
          "period": "Süre",
          "basis": "Dayanak"
        },
        "table": [
          {
            "dataType": "Katalog talebi (e-posta + locale)",
            "period": "30 gün (otomatik silme)",
            "basis": "Veri minimizasyonu — pg_cron günlük 03:00 UTC"
          },
          {
            "dataType": "İletişim formu mesajı",
            "period": "Yanıt verilene kadar + 12 ay arşiv",
            "basis": "Mesajınıza dönüş + olası yasal yükümlülük"
          },
          {
            "dataType": "Audit log (IP'siz)",
            "period": "12 ay",
            "basis": "Güvenlik + yasal yükümlülük"
          }
        ]
      },
      "rights": {
        "heading": "7. İlgili Kişi Hakları (KVKK m.11)",
        "bullets": [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
          "İşlenmişse buna ilişkin bilgi talep etme",
          "İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
          "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme",
          "Eksik veya yanlış işlenmiş ise düzeltilmesini isteme",
          "Şartların gerçekleşmesi halinde silinmesini veya yok edilmesini isteme",
          "Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme",
          "Otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme",
          "Kanuna aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme"
        ]
      },
      "application": {
        "heading": "8. Başvuru Yöntemi",
        "body": "KVKK m.13 kapsamında haklarınızı kullanmak için <mail>info@kitaplastik.com</mail> adresine yazılı başvuru yapabilirsiniz. Başvurunuz en geç <strong>30 gün</strong> içinde sonuçlandırılır. Detaylı başvuru rehberi için <kvkk>KVKK Resmi Web Sitesi</kvkk>'ni inceleyebilirsiniz."
      }
    }
  },
  "cookies": {
    "title": "Çerez Politikası",
    "intro": "Web sitemiz <strong>yalnızca kesinlikle gerekli (zorunlu) çerezleri</strong> kullanır; reklam, pazarlama veya kullanıcı izleme amacıyla çerez yerleştirmez. Bu nedenle çerez onay banner'ı göstermiyoruz — kullandığımız tüm çerezler, web sitesinin çalışması için teknik olarak gerekli kategorisindedir (ePrivacy Direktifi madde 5(3) muafiyeti).",
    "sections": {
      "what": {
        "heading": "1. Çerez Nedir?",
        "body": "Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Site sahipleri bu dosyalar aracılığıyla tercihlerinizi hatırlayabilir, oturum bilgilerini saklayabilir veya site analitiği yapabilir. Tüm çerezler aynı kategoride değildir — bazıları sitenin çalışması için zorunludur, bazıları opsiyoneldir."
      },
      "approach": {
        "heading": "2. Yaklaşımımız",
        "body": "Kıta Plastik web sitesi yalnızca <strong>üç kategoride zorunlu teknik çerez</strong> kullanır: dil tercihi (locale), bot koruması (Cloudflare Turnstile), ve altyapı koruması (Cloudflare bot management). Bunların hepsi sitenin temel işlevlerini sağlamak için gereklidir; reklamcılık, profilleme veya çapraz site izleme yapılmaz."
      },
      "inventory": {
        "heading": "3. Çerez Envanteri",
        "cols": {
          "name": "İsim",
          "purpose": "Amaç",
          "party": "Sahip",
          "duration": "Süre",
          "category": "Kategori"
        },
        "table": [
          {
            "name": "NEXT_LOCALE",
            "purpose": "Seçilen dil tercihinizin hatırlanması",
            "party": "1. taraf (Kıta Plastik)",
            "duration": "1 yıl",
            "category": "Zorunlu"
          },
          {
            "name": "cf_chl_*",
            "purpose": "Cloudflare Turnstile bot koruması (form submitlerinde)",
            "party": "3. taraf (Cloudflare)",
            "duration": "Oturum",
            "category": "Zorunlu"
          },
          {
            "name": "__cf_bm",
            "purpose": "Cloudflare bot yönetimi (altyapı koruma)",
            "party": "3. taraf (Cloudflare)",
            "duration": "~30 dakika",
            "category": "Zorunlu"
          },
          {
            "name": "Plausible Analytics",
            "purpose": "Anonim sayfa görüntüleme istatistikleri",
            "party": "1. taraf (Kıta Plastik self-host)",
            "duration": "Çerez kullanmaz (cookieless)",
            "category": "Yok"
          },
          {
            "name": "Sentry",
            "purpose": "Hata izleme",
            "party": "3. taraf (Sentry.io)",
            "duration": "Çerez kullanmaz",
            "category": "Yok"
          }
        ]
      },
      "control": {
        "heading": "4. Tarayıcı Kontrolü",
        "body": "Tarayıcınızın ayarlarından çerezleri reddedebilir veya silebilirsiniz. Ancak <strong>zorunlu çerezler devre dışı bırakılırsa</strong> form gönderimleri ve dil tercihi gibi temel işlevler düzgün çalışmayabilir. Tarayıcınıza özel rehberler için tarayıcı sağlayıcısının yardım sayfalarına bakın (Chrome, Firefox, Safari, Edge)."
      },
      "changes": {
        "heading": "5. Politika Değişiklikleri",
        "body": "Bu politikada değişiklik yapıldığında, <strong>Son Güncelleme</strong> tarihi yenilenir ve metin bu sayfada yayınlanır. Önemli değişikliklerde web sitesi üzerinden bildirim sağlarız."
      }
    }
  }
}
```

- [ ] **Step 2: Validate JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('messages/tr/legal.json', 'utf8'))" && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add messages/tr/legal.json
git commit -m "feat(legal): add TR canonical messages/tr/legal.json"
```

---

## Task 3: EN/RU/AR translations

Translates TR canonical to three locales. Translator MUST honor terminology dictionary in spec; staticFacts placeholder string is locale-translated.

**Files:**
- Create: `messages/en/legal.json`
- Create: `messages/ru/legal.json`
- Create: `messages/ar/legal.json`

**Translator instructions (used during this task):**

```
Translate the entire content of messages/tr/legal.json into [TARGET LANGUAGE], preserving:
- All JSON keys (DO NOT translate keys, only values)
- All placeholder tags: <kvkk>, <strong>, <mail>, <privacyLink>, <cookiesLink>
- Cookie names AS-IS (NEXT_LOCALE, cf_chl_*, __cf_bm, Plausible Analytics, Sentry)
- Provider names AS-IS (Resend, Cloudflare, Supabase, Plausible, Sentry)
- Numbers AS-IS (1 yıl → 1 year / 1 год / سنة واحدة, 30 gün → 30 days / 30 дней / 30 يوم)
- staticFacts placeholder string: "Bilgi güncelleniyor" → locale-appropriate equivalent

Terminology dictionary (TR → target):
- veri sorumlusu → data controller / оператор персональных данных / المتحكم في البيانات
- veri işleyen → data processor / обработчик данных / معالج البيانات
- ilgili kişi → data subject / субъект данных / صاحب البيانات
- açık rıza → explicit consent / явное согласие / الموافقة الصريحة
- meşru menfaat → legitimate interest / законный интерес / المصلحة المشروعة
- KVKK → KVKK (Turkish PDPL) / KVKK (Закон о ЗПД, Турция) / KVKK (قانون حماية البيانات الشخصية، تركيا)
- zorunlu çerez → strict-necessary cookie / строго необходимый cookie / ملف تعريف ارتباط ضروري
- üçüncü taraf → third party / третья сторона / طرف ثالث
- saklama süresi → retention period / срок хранения / فترة الاحتفاظ
- veri aktarımı → data transfer / передача данных / نقل البيانات
- ilgili kişi hakları → data subject rights / права субъекта данных / حقوق صاحب البيانات
- staticFacts placeholder → "Information being updated" / "Информация обновляется" / "المعلومات قيد التحديث"

Output the entire JSON file, valid syntax, ready to save.
```

- [ ] **Step 1: Translate TR → EN, save as `messages/en/legal.json`**

Use the translator instructions above with target language English. Save to `messages/en/legal.json`.

Key conversion notes for EN:
- `meta.publishedDate` → "April 26, 2026"
- `meta.lastUpdated` → "April 26, 2026"
- `staticFacts.*` placeholder → "Information being updated"

- [ ] **Step 2: Translate TR → RU, save as `messages/ru/legal.json`**

Use translator instructions with target language Russian.

Key conversion notes for RU:
- `meta.publishedDate` → "26 апреля 2026 г."
- `meta.lastUpdated` → "26 апреля 2026 г."
- `staticFacts.*` placeholder → "Информация обновляется"

- [ ] **Step 3: Translate TR → AR, save as `messages/ar/legal.json`**

Use translator instructions with target language Arabic. Note: AR uses RTL; numbers stay LTR.

Key conversion notes for AR:
- `meta.publishedDate` → "26 أبريل 2026"
- `meta.lastUpdated` → "26 أبريل 2026"
- `staticFacts.*` placeholder → "المعلومات قيد التحديث"

- [ ] **Step 4: Validate all 3 JSON files**

```bash
for l in en ru ar; do
  node -e "JSON.parse(require('fs').readFileSync('messages/$l/legal.json', 'utf8'))" && echo "$l OK"
done
```

Expected: `en OK / ru OK / ar OK`.

- [ ] **Step 5: Verify key parity (all 4 locales same key tree)**

```bash
node -e "
const tr = JSON.parse(require('fs').readFileSync('messages/tr/legal.json'));
const flatten = (o, p='') => Object.entries(o).flatMap(([k,v]) =>
  typeof v === 'object' && !Array.isArray(v) ? flatten(v, p+k+'.') : [p+k]
);
const trKeys = new Set(flatten(tr));
for (const loc of ['en','ru','ar']) {
  const m = JSON.parse(require('fs').readFileSync('messages/'+loc+'/legal.json'));
  const keys = new Set(flatten(m));
  const missing = [...trKeys].filter(k => !keys.has(k));
  const extra = [...keys].filter(k => !trKeys.has(k));
  console.log(loc, 'missing:', missing.length, 'extra:', extra.length);
  if (missing.length) console.log('  missing keys:', missing);
  if (extra.length) console.log('  extra keys:', extra);
}
"
```

Expected: 0 missing / 0 extra for each of en/ru/ar.

- [ ] **Step 6: Commit**

```bash
git add messages/en/legal.json messages/ru/legal.json messages/ar/legal.json
git commit -m "feat(legal): add EN/RU/AR translations of legal.json (LLM-assisted + audit dict)"
```

---

## Task 4: LegalDisclaimer component (TDD)

Simplest component, props-only. No `useTranslations`, no children. Tests run first.

**Files:**
- Create: `tests/unit/components/legal/LegalDisclaimer.test.tsx`
- Create: `components/legal/LegalDisclaimer.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/unit/components/legal/LegalDisclaimer.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

describe("LegalDisclaimer", () => {
  it("renders publishedDate, lastUpdated, and disclaimer text", () => {
    render(
      <LegalDisclaimer
        publishedDate="26 Nisan 2026"
        lastUpdated="26 Nisan 2026"
        text="Bu metin bilgilendirme amaçlıdır."
      />,
    );
    expect(screen.getByText(/26 Nisan 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Bu metin bilgilendirme amaçlıdır/)).toBeInTheDocument();
  });

  it("renders inside a footer-like region with role contentinfo or aside", () => {
    const { container } = render(
      <LegalDisclaimer publishedDate="x" lastUpdated="y" text="z" />,
    );
    const small = container.querySelector("small, .legal-disclaimer, [data-testid='legal-disclaimer']");
    expect(small).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
pnpm vitest run tests/unit/components/legal/LegalDisclaimer.test.tsx
```

Expected: FAIL `Cannot find module '@/components/legal/LegalDisclaimer'`.

- [ ] **Step 3: Implement minimal `LegalDisclaimer.tsx`**

Create `components/legal/LegalDisclaimer.tsx`:

```tsx
interface LegalDisclaimerProps {
  publishedDate: string;
  lastUpdated: string;
  text: string;
}

export function LegalDisclaimer({ publishedDate, lastUpdated, text }: LegalDisclaimerProps) {
  return (
    <small
      data-testid="legal-disclaimer"
      className="text-text-tertiary mt-12 block border-t border-[var(--color-border-hairline)] pt-6 text-[12px] leading-[1.6] italic"
    >
      Yayın tarihi: {publishedDate} · Son güncelleme: {lastUpdated} · {text}
    </small>
  );
}
```

- [ ] **Step 4: Run test, expect PASS**

```bash
pnpm vitest run tests/unit/components/legal/LegalDisclaimer.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/legal/LegalDisclaimer.tsx tests/unit/components/legal/LegalDisclaimer.test.tsx
git commit -m "feat(legal): LegalDisclaimer component (props-only, footer text)"
```

---

## Task 5: LegalSection component

Trivial wrapper — `<section>` + `<h2>`. No test needed beyond integration via LegalLayout.

**Files:**
- Create: `components/legal/LegalSection.tsx`

- [ ] **Step 1: Implement `LegalSection.tsx`**

Create `components/legal/LegalSection.tsx`:

```tsx
import type { ReactNode } from "react";

interface LegalSectionProps {
  heading: string;
  children: ReactNode;
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="mt-10">
      <h2 className="text-text-primary text-[22px] font-semibold leading-[1.3] md:text-[26px]">
        {heading}
      </h2>
      <div className="text-text-secondary mt-3 space-y-3 text-[15px] leading-[1.7]">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/legal/LegalSection.tsx
git commit -m "feat(legal): LegalSection component (h2 + body wrapper)"
```

---

## Task 6: LegalTable component (TDD)

Responsive table with `<caption>` (sr-only) + `<th scope="col">` + mobile `<dl>` stack. Dev-mode warn on cols/rows mismatch.

**Files:**
- Create: `tests/unit/components/legal/LegalTable.test.tsx`
- Create: `components/legal/LegalTable.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/components/legal/LegalTable.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalTable } from "@/components/legal/LegalTable";

describe("LegalTable", () => {
  const cols = { name: "İsim", purpose: "Amaç", duration: "Süre" };
  const rows = [
    { name: "NEXT_LOCALE", purpose: "Locale tercihi", duration: "1 yıl" },
    { name: "__cf_bm", purpose: "Bot mgmt", duration: "30 dk" },
  ];

  it("renders <caption> sr-only with provided text", () => {
    render(<LegalTable caption="Çerez Envanteri" cols={cols} rows={rows} />);
    const caption = screen.getByText("Çerez Envanteri");
    expect(caption.tagName.toLowerCase()).toBe("caption");
    expect(caption).toHaveClass("sr-only");
  });

  it("renders all column headers as <th scope='col'>", () => {
    render(<LegalTable caption="x" cols={cols} rows={rows} />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    for (const h of screen.getAllByRole("columnheader")) {
      expect(h.getAttribute("scope")).toBe("col");
    }
  });

  it("renders all row cells in document order matching cols keys", () => {
    render(<LegalTable caption="x" cols={cols} rows={rows} />);
    expect(screen.getByText("NEXT_LOCALE")).toBeInTheDocument();
    expect(screen.getByText("Locale tercihi")).toBeInTheDocument();
    expect(screen.getByText("1 yıl")).toBeInTheDocument();
    expect(screen.getByText("__cf_bm")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL**

```bash
pnpm vitest run tests/unit/components/legal/LegalTable.test.tsx
```

Expected: FAIL `Cannot find module '@/components/legal/LegalTable'`.

- [ ] **Step 3: Implement `LegalTable.tsx`**

Create `components/legal/LegalTable.tsx`:

```tsx
interface LegalTableProps {
  caption?: string;
  cols: Record<string, string>;
  rows: Record<string, string>[];
}

export function LegalTable({ caption, cols, rows }: LegalTableProps) {
  const colKeys = Object.keys(cols);
  if (process.env.NODE_ENV !== "production" && rows.length > 0) {
    const rowKeys = Object.keys(rows[0]);
    const missing = colKeys.filter((k) => !rowKeys.includes(k));
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.error("LegalTable: row missing keys", missing);
    }
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-[14px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b-2 border-[var(--color-border-default)]">
            {colKeys.map((k) => (
              <th
                key={k}
                scope="col"
                className="text-text-primary px-3 py-2.5 text-start font-semibold"
              >
                {cols[k]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--color-border-hairline)] last:border-b-0"
            >
              {colKeys.map((k) => (
                <td
                  key={k}
                  className="text-text-secondary px-3 py-3 align-top text-[14px] leading-[1.6]"
                >
                  {row[k] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Run tests, expect PASS**

```bash
pnpm vitest run tests/unit/components/legal/LegalTable.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/legal/LegalTable.tsx tests/unit/components/legal/LegalTable.test.tsx
git commit -m "feat(legal): LegalTable with caption + scope=col + dev-mode mismatch warn"
```

---

## Task 7: LegalLayout component (TDD)

Page-level container: hero (title + intro) + `<article>` + disclaimer slot. Heading hierarchy: `<h1>` once, `<h2>` from sections.

**Files:**
- Create: `tests/unit/components/legal/LegalLayout.test.tsx`
- Create: `components/legal/LegalLayout.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/components/legal/LegalLayout.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalLayout } from "@/components/legal/LegalLayout";

describe("LegalLayout", () => {
  it("renders title as <h1>", () => {
    render(
      <LegalLayout title="Gizlilik Politikası" intro={<>Intro text</>}>
        <p>section content</p>
      </LegalLayout>,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Gizlilik Politikası");
  });

  it("renders intro and children", () => {
    render(
      <LegalLayout title="t" intro={<>Welcome paragraph</>}>
        <p>section content</p>
      </LegalLayout>,
    );
    expect(screen.getByText("Welcome paragraph")).toBeInTheDocument();
    expect(screen.getByText("section content")).toBeInTheDocument();
  });

  it("wraps body in an <article>", () => {
    const { container } = render(
      <LegalLayout title="t" intro="i">
        <p>section</p>
      </LegalLayout>,
    );
    expect(container.querySelector("article")).not.toBeNull();
  });

  it("does NOT render any extra <h1> (hierarchy)", () => {
    render(
      <LegalLayout title="t" intro="i">
        <h2>section heading</h2>
        <p>x</p>
      </LegalLayout>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL**

```bash
pnpm vitest run tests/unit/components/legal/LegalLayout.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `LegalLayout.tsx`**

Create `components/legal/LegalLayout.tsx`:

```tsx
import type { ReactNode } from "react";

interface LegalLayoutProps {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}

export function LegalLayout({ title, intro, children }: LegalLayoutProps) {
  return (
    <section className="container mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="text-text-primary text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        <div className="text-text-secondary mt-5 text-[17px] leading-[1.65]">
          {intro}
        </div>
      </header>
      <article className="prose-legal">{children}</article>
    </section>
  );
}
```

- [ ] **Step 4: Run tests, expect PASS**

```bash
pnpm vitest run tests/unit/components/legal/LegalLayout.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/legal/LegalLayout.tsx tests/unit/components/legal/LegalLayout.test.tsx
git commit -m "feat(legal): LegalLayout with h1 title + article wrapper + hierarchy"
```

---

## Task 8: LegalControllerBlock component

Renders Veri Sorumlusu block as `<dl>`. Props-driven, no `useTranslations`. Test via E2E (server fetch needed for getCompany).

**Files:**
- Create: `components/legal/LegalControllerBlock.tsx`

- [ ] **Step 1: Implement `LegalControllerBlock.tsx`**

Create `components/legal/LegalControllerBlock.tsx`:

```tsx
import type { Company } from "@/lib/admin/schemas/company";

interface LegalControllerBlockProps {
  company: Company;
  labels: {
    legalName: string;
    address: string;
    phone: string;
    email: string;
    taxOffice: string;
    mersisNo: string;
    kep: string;
    verbisStatus: string;
    dpoStatus: string;
  };
  staticFacts: {
    taxOffice: string;
    mersisNo: string;
    kep?: string | null;
    verbisStatus: string;
    dpoStatus: string;
  };
}

export function LegalControllerBlock({ company, labels, staticFacts }: LegalControllerBlockProps) {
  const addressFull = `${company.address.street}, ${company.address.district} / ${company.address.city}`;
  const fields: { label: string; value: string }[] = [
    { label: labels.legalName, value: company.legalName },
    { label: labels.address, value: addressFull },
    { label: labels.phone, value: company.phone.display },
    { label: labels.email, value: company.email.primary },
    { label: labels.taxOffice, value: staticFacts.taxOffice },
    { label: labels.mersisNo, value: staticFacts.mersisNo },
    ...(staticFacts.kep ? [{ label: labels.kep, value: staticFacts.kep }] : []),
    { label: labels.verbisStatus, value: staticFacts.verbisStatus },
    { label: labels.dpoStatus, value: staticFacts.dpoStatus },
  ];

  return (
    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 text-[15px] sm:grid-cols-[max-content_1fr]">
      {fields.map((f) => (
        <div key={f.label} className="contents">
          <dt className="text-text-tertiary font-medium">{f.label}:</dt>
          <dd className="text-text-secondary">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/legal/LegalControllerBlock.tsx
git commit -m "feat(legal): LegalControllerBlock dl with company SOT + staticFacts merge"
```

---

## Task 9: components/legal/index.ts barrel

**Files:**
- Create: `components/legal/index.ts`

- [ ] **Step 1: Create barrel export**

Create `components/legal/index.ts`:

```ts
export { LegalLayout } from "./LegalLayout";
export { LegalSection } from "./LegalSection";
export { LegalTable } from "./LegalTable";
export { LegalDisclaimer } from "./LegalDisclaimer";
export { LegalControllerBlock } from "./LegalControllerBlock";
```

- [ ] **Step 2: Verify**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/legal/index.ts
git commit -m "feat(legal): components/legal barrel export"
```

---

## Task 10: app/[locale]/legal/privacy/page.tsx

Privacy page — RSC + SSG, `getCompany()` fetch, all 8 sections rendered.

**Files:**
- Create: `app/[locale]/legal/privacy/page.tsx`

- [ ] **Step 1: Create privacy page**

Create `app/[locale]/legal/privacy/page.tsx`:

```tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { getCompany } from "@/lib/company";
import {
  LegalLayout,
  LegalSection,
  LegalTable,
  LegalDisclaimer,
  LegalControllerBlock,
} from "@/components/legal";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/legal/privacy", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("intro").replace(/<[^>]+>/g, "").slice(0, 160),
    alternates: {
      canonical: alternates.languages[locale],
      languages: alternates.languages,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tMeta, tShared, company] = await Promise.all([
    getTranslations("legal.privacy"),
    getTranslations("legal.meta"),
    getTranslations("legal.shared"),
    getCompany(),
  ]);

  const richTags = {
    mail: (chunks: ReactNode) => (
      <a href="mailto:info@kitaplastik.com" className="underline">
        {chunks}
      </a>
    ),
    strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
    kvkk: (chunks: ReactNode) => (
      <a
        href="https://www.kvkk.gov.tr"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        {chunks}
      </a>
    ),
  };

  const purposesBulletsRaw = t.raw("sections.purposes.bullets") as unknown;
  const purposesBullets = Array.isArray(purposesBulletsRaw)
    ? (purposesBulletsRaw as string[])
    : [];

  const rightsBulletsRaw = t.raw("sections.rights.bullets") as unknown;
  const rightsBullets = Array.isArray(rightsBulletsRaw)
    ? (rightsBulletsRaw as string[])
    : [];

  const staticFactsRaw = t.raw("staticFacts") as Record<string, string>;

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
          staticFacts={{
            taxOffice: staticFactsRaw.taxOffice,
            mersisNo: staticFactsRaw.mersisNo,
            kep: staticFactsRaw.kep,
            verbisStatus: staticFactsRaw.verbisStatus,
            dpoStatus: staticFactsRaw.dpoStatus,
          }}
        />
      </LegalSection>

      <LegalSection heading={t("sections.purposes.heading")}>
        <ul className="ms-5 list-disc space-y-1.5">
          {purposesBullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection heading={t("sections.legalBasis.heading")}>
        <p>{t.rich("sections.legalBasis.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.categories.heading")}>
        <LegalTable
          caption={t("sections.categories.heading")}
          cols={t.raw("sections.categories.cols") as Record<string, string>}
          rows={t.raw("sections.categories.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.thirdParties.heading")}>
        <p>{t.rich("sections.thirdParties.body", richTags)}</p>
        <LegalTable
          caption={t("sections.thirdParties.heading")}
          cols={t.raw("sections.thirdParties.cols") as Record<string, string>}
          rows={t.raw("sections.thirdParties.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.retention.heading")}>
        <p>{t.rich("sections.retention.body", richTags)}</p>
        <LegalTable
          caption={t("sections.retention.heading")}
          cols={t.raw("sections.retention.cols") as Record<string, string>}
          rows={t.raw("sections.retention.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.rights.heading")}>
        <ul className="ms-5 list-disc space-y-1.5">
          {rightsBullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection heading={t("sections.application.heading")}>
        <p>{t.rich("sections.application.body", richTags)}</p>
      </LegalSection>

      <p className="text-text-secondary mt-12 text-[14px]">
        {tShared.rich("formConsentNotice", {
          privacyLink: (chunks) => (
            <Link href="/legal/privacy" className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>

      <LegalDisclaimer
        publishedDate={tMeta("publishedDate")}
        lastUpdated={tMeta("lastUpdated")}
        text={tMeta("disclaimer")}
      />
    </LegalLayout>
  );
}
```

- [ ] **Step 2: Verify build (full app build with new page)**

```bash
pnpm typecheck && pnpm build
```

Expected: build succeeds, 4 new static routes generated (`/[locale]/legal/privacy` × 4 locales).

If build fails with "Module not found: '@/lib/env'" — check existing pages use `import { env } from "@/lib/env"` pattern; the file exists per Plan 5a Phase 1.

- [ ] **Step 3: Manual smoke test (dev)**

```bash
pnpm dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tr/yasal/gizlilik
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/legal/privacy
```

Expected: `200` for each.

Kill dev server: `pkill -f "next dev"`.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/legal/privacy/page.tsx
git commit -m "feat(legal): app/[locale]/legal/privacy page (RSC + SSG + getCompany)"
```

---

## Task 11: app/[locale]/legal/cookies/page.tsx

Cookies page — RSC + SSG, no company fetch, simpler structure (5 sections).

**Files:**
- Create: `app/[locale]/legal/cookies/page.tsx`

- [ ] **Step 1: Create cookies page**

Create `app/[locale]/legal/cookies/page.tsx`:

```tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import {
  LegalLayout,
  LegalSection,
  LegalTable,
  LegalDisclaimer,
} from "@/components/legal";

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.cookies" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  const alternates = buildAlternates("/legal/cookies", origin);
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("intro").replace(/<[^>]+>/g, "").slice(0, 160),
    alternates: {
      canonical: alternates.languages[locale],
      languages: alternates.languages,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CookiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tMeta, tShared] = await Promise.all([
    getTranslations("legal.cookies"),
    getTranslations("legal.meta"),
    getTranslations("legal.shared"),
  ]);

  const richTags = {
    strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
    privacyLink: (chunks: ReactNode) => (
      <Link href="/legal/privacy" className="underline">
        {chunks}
      </Link>
    ),
  };

  return (
    <LegalLayout title={t("title")} intro={t.rich("intro", richTags)}>
      <LegalSection heading={t("sections.what.heading")}>
        <p>{t.rich("sections.what.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.approach.heading")}>
        <p>{t.rich("sections.approach.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.inventory.heading")}>
        <LegalTable
          caption={t("sections.inventory.heading")}
          cols={t.raw("sections.inventory.cols") as Record<string, string>}
          rows={t.raw("sections.inventory.table") as Record<string, string>[]}
        />
      </LegalSection>

      <LegalSection heading={t("sections.control.heading")}>
        <p>{t.rich("sections.control.body", richTags)}</p>
      </LegalSection>

      <LegalSection heading={t("sections.changes.heading")}>
        <p>{t.rich("sections.changes.body", richTags)}</p>
      </LegalSection>

      <p className="text-text-secondary mt-12 text-[14px]">
        {tShared.rich("formConsentNotice", {
          privacyLink: (chunks) => (
            <Link href="/legal/privacy" className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>

      <LegalDisclaimer
        publishedDate={tMeta("publishedDate")}
        lastUpdated={tMeta("lastUpdated")}
        text={tMeta("disclaimer")}
      />
    </LegalLayout>
  );
}
```

- [ ] **Step 2: Build + manual smoke test**

```bash
pnpm build
```

Expected: build succeeds, 8 total new static routes (privacy + cookies × 4 locales).

```bash
pnpm dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/tr/yasal/cerezler
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ru/pravovaya/kuki
pkill -f "next dev"
```

Expected: `200` for each.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/legal/cookies/page.tsx
git commit -m "feat(legal): app/[locale]/legal/cookies page (RSC + SSG)"
```

---

## Task 12: Footer bottom-bar 3-element layout (TDD)

Footer bottom-bar gains a `<ul>` between copyright and tagline with 2 legal links. Test 4 locales × 2 links = 8 link-href asserts.

**Files:**
- Modify: `tests/unit/components/Footer.test.tsx` (add `legal` namespace + 8 asserts)
- Modify: `components/layout/Footer.tsx:13-66`

- [ ] **Step 1: Read existing Footer.test.tsx fully to see message setup**

```bash
cat tests/unit/components/Footer.test.tsx
```

Note the structure of `messages` object (`common`, `nav`, etc.). Ad you'll add a `legal` block.

- [ ] **Step 2: Add legal namespace to Footer test messages + new asserts**

In `tests/unit/components/Footer.test.tsx`, find the `const messages = { ... }` block and add a `legal` field (alongside `common` and `nav`):

```ts
  legal: {
    shared: {
      linkLabel: {
        privacy: "Gizlilik Politikası",
        cookies: "Çerez Politikası",
      },
    },
  },
```

Then append a new `it()` test inside the `describe(...)` block:

```ts
  it("renders bottom-bar legal links (privacy + cookies)", () => {
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <Footer company={TEST_COMPANY} />
      </NextIntlClientProvider>,
    );
    const privacy = screen.getByRole("link", { name: "Gizlilik Politikası" });
    const cookies = screen.getByRole("link", { name: "Çerez Politikası" });
    expect(privacy).toBeInTheDocument();
    expect(cookies).toBeInTheDocument();
    expect(privacy.getAttribute("href")).toBe("/legal/privacy");
    expect(cookies.getAttribute("href")).toBe("/legal/cookies");
  });
```

(The mock from line 7 returns `href` as-is, so we assert the route shape — actual locale-pathname mapping is covered by `pathnames.test.ts`.)

- [ ] **Step 3: Run test, expect FAIL**

```bash
pnpm vitest run tests/unit/components/Footer.test.tsx
```

Expected: new test fails (Footer doesn't yet render legal links).

- [ ] **Step 4: Modify `components/layout/Footer.tsx`**

In `components/layout/Footer.tsx`, modify the imports (line 1-6):

```tsx
import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "./Container";
import { KitaLogo } from "./KitaLogo";
import type { Company } from "@/lib/company";
```

Inside the `Footer` component, add:

```tsx
  const tLegal = useTranslations("legal.shared.linkLabel");
```

Replace the bottom-bar `<div>` block (lines 59-62) with:

```tsx
        <div className="flex flex-col gap-3 border-t border-[rgba(250,250,247,0.1)] py-6 text-[13px] text-[rgba(250,250,247,0.5)] md:flex-row md:flex-wrap md:items-center md:justify-between">
          <p className="font-mono">{tFooter("copyright", { year: currentYear })}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            <li>
              <Link
                href="/legal/privacy"
                className="transition-colors duration-200 ease-out hover:text-[var(--color-text-inverse)]"
              >
                {tLegal("privacy")}
              </Link>
            </li>
            <li>
              <Link
                href="/legal/cookies"
                className="transition-colors duration-200 ease-out hover:text-[var(--color-text-inverse)]"
              >
                {tLegal("cookies")}
              </Link>
            </li>
          </ul>
          <p>{tCommon("brand.tagline")}</p>
        </div>
```

- [ ] **Step 5: Run all unit tests**

```bash
pnpm vitest run tests/unit/components/Footer.test.tsx
```

Expected: all Footer tests pass (existing + new legal link test).

- [ ] **Step 6: Commit**

```bash
git add components/layout/Footer.tsx tests/unit/components/Footer.test.tsx
git commit -m "feat(legal): footer bottom-bar 3-element with legal links (privacy + cookies)"
```

---

## Task 13: Form consent notice (CatalogRequestForm + ContactForm)

Add a small text under the submit button on both forms linking to privacy.

**Files:**
- Modify: `components/catalog/CatalogRequestForm.tsx` (add notice after Button JSX)
- Modify: `components/contact/ContactForm.tsx` (add notice after submit button)

- [ ] **Step 1: Modify CatalogRequestForm.tsx**

In `components/catalog/CatalogRequestForm.tsx`:

Add to imports (top of file with other imports):

```tsx
import { Link } from "@/i18n/navigation";
```

Add after the `useTranslations("catalog.form")` etc. lines:

```tsx
  const tShared = useTranslations("legal.shared");
```

After the `<Button ...>...</Button>` element (currently line 220-229), but still inside the `<form>`, add:

```tsx
        <p className="text-text-secondary text-[12px] leading-[1.5]">
          {tShared.rich("formConsentNotice", {
            privacyLink: (chunks) => (
              <Link href="/legal/privacy" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
```

- [ ] **Step 2: Modify ContactForm.tsx**

Read first:

```bash
grep -n 'submit\|Button\|"submit"' components/contact/ContactForm.tsx | head -10
```

Locate the submit button JSX. Below it (still inside the form), add the same `<p>` block as Task 13 Step 1, with `tShared` setup at the top of the component (`useTranslations("legal.shared")`).

If `import { Link } from "@/i18n/navigation"` is not already imported in ContactForm.tsx, add it.

- [ ] **Step 3: Verify typecheck + run all unit tests**

```bash
pnpm typecheck && pnpm vitest run
```

Expected: 0 type errors, all unit tests pass.

- [ ] **Step 4: Manual smoke (dev)**

```bash
pnpm dev &
sleep 5
curl -s http://localhost:3000/tr/katalog | grep -c "Gizlilik Politikası"
curl -s http://localhost:3000/tr/iletisim | grep -c "Gizlilik Politikası"
pkill -f "next dev"
```

Expected: each curl returns `1` or higher.

- [ ] **Step 5: Commit**

```bash
git add components/catalog/CatalogRequestForm.tsx components/contact/ContactForm.tsx
git commit -m "feat(legal): catalog + contact form submit-altı consent notice"
```

---

## Task 14: E2E tests (legal.spec.ts)

10 cases: 8 smoke (4 locales × 2 pages) + 2 round-trip (footer + form).

**Files:**
- Create: `tests/e2e/legal.spec.ts`

- [ ] **Step 1: Create `tests/e2e/legal.spec.ts`**

Write `tests/e2e/legal.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const cases = [
  {
    locale: "tr",
    privacyPath: "/tr/yasal/gizlilik",
    cookiesPath: "/tr/yasal/cerezler",
    privacyTitle: /Gizlilik Politikası/,
    cookiesTitle: /Çerez Politikası/,
    disclaimerKeyword: /Yayın tarihi|Son güncelleme/,
  },
  {
    locale: "en",
    privacyPath: "/en/legal/privacy",
    cookiesPath: "/en/legal/cookies",
    privacyTitle: /Privacy Policy/i,
    cookiesTitle: /Cookie Policy/i,
    disclaimerKeyword: /Published|Last updated/i,
  },
  {
    locale: "ru",
    privacyPath: "/ru/pravovaya/konfidentsialnost",
    cookiesPath: "/ru/pravovaya/kuki",
    privacyTitle: /Политика конфиденциальности|Конфиденциальность/i,
    cookiesTitle: /политика|cookie/i,
    disclaimerKeyword: /Опубликовано|Обновлено/i,
  },
  {
    locale: "ar",
    privacyPath: "/ar/qanuni/khususiyya",
    cookiesPath: "/ar/qanuni/kuki",
    privacyTitle: /الخصوصية/,
    cookiesTitle: /كوكي|ملفات تعريف/,
    disclaimerKeyword: /تاريخ النشر|آخر تحديث/,
  },
];

for (const c of cases) {
  test(`${c.locale} privacy page: 200 + h1 + disclaimer`, async ({ page }) => {
    const res = await page.goto(c.privacyPath);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText(c.privacyTitle);
    await expect(page.getByTestId("legal-disclaimer")).toBeVisible();
  });

  test(`${c.locale} cookies page: 200 + h1 + inventory table`, async ({ page }) => {
    const res = await page.goto(c.cookiesPath);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText(c.cookiesTitle);
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByText("NEXT_LOCALE")).toBeVisible();
  });
}

test("footer privacy link round-trip (TR)", async ({ page }) => {
  await page.goto("/tr");
  const link = page.locator("footer").getByRole("link", { name: /Gizlilik Politikası/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/tr\/yasal\/gizlilik$/);
  await expect(page.locator("h1")).toContainText(/Gizlilik Politikası/);
});

test("catalog form consent link round-trip (TR)", async ({ page }) => {
  await page.goto("/tr/katalog");
  const link = page.locator("form").getByRole("link", { name: /Gizlilik Politikası/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/tr\/yasal\/gizlilik$/);
});
```

- [ ] **Step 2: Run E2E tests**

```bash
rm -rf .next
pnpm test:e2e -- tests/e2e/legal.spec.ts
```

Expected: 10 tests pass. (Note: if first run fails with `JSON.parse: Unexpected non-whitespace`, the `.next` cache is stale — already cleared.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/legal.spec.ts
git commit -m "test(legal): e2e smoke 4 locale x 2 page + 2 round-trip"
```

---

## Task 15: Full pnpm verify (CI mirror)

Run the full CI-mirror gate: typecheck + lint + format + unit + audit + build + e2e.

**Files:** none (verification only)

- [ ] **Step 1: Clean + run verify**

```bash
rm -rf .next
pnpm verify 2>&1 | tee /tmp/verify-prb.log
```

Expected: full success. Look for tail with `passed (XXm)` and 0 failures.

- [ ] **Step 2: Confirm test counts**

```bash
grep -E '(unit-tests|e2e)' /tmp/verify-prb.log | tail -5
```

Expected: ≥263 unit tests passing, ≥76 e2e tests passing (28 skip).

If failures, fix root cause then re-run from Step 1. Do NOT skip steps.

- [ ] **Step 3: No commit (verification only) — proceed to Task 16**

---

## Task 16: Open PR + Codex Gate 2

PR aç, CI yeşil bekle, Codex Gate 2 review koş, low/medium PR body'ye, critical/high inline fix.

**Files:** none (PR creation)

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/plan5b-prb-legal-pages
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "feat(legal): Plan 5b PR B — KVKK gizlilik + çerez politikası 4 dil" --body "$(cat <<'EOF'
## Summary
- 4 locale × 2 sayfa = 8 yeni route: `/legal/{privacy,cookies}` (TR/EN/RU/AR)
- Plan 5b PR A canlı state'iyle uyumlu içerik (yalnız email+locale, 30 gün auto-purge)
- Reusable components: LegalLayout/Section/Table/Disclaimer/ControllerBlock
- Footer bottom-bar 3-element + Catalog/Contact form altı consent notice
- Cookie consent banner GEREKMEZ (PR A envanter konfirme: ePrivacy 5(3) muafiyet)

## Patch PR follow-up notu
Bu PR'da KVKK staticFacts alanları (`taxOffice`, `mersisNo`, `kep`, `verbisStatus`, `dpoStatus`) "Bilgi güncelleniyor" placeholder string ile gönderilmiştir. User net değerleri verince ~5dk'lık follow-up patch PR atılacak (sadece 4 messages JSON dosyası değişir).

## Test plan
- [x] Pathnames test: 8 yeni case
- [x] LegalLayout/Table/Disclaimer unit test
- [x] Footer test 8 yeni assert
- [x] E2E 10 case (8 smoke + 2 round-trip)
- [x] pnpm verify CI mirror yeşil
- [ ] PR sonrası: 8 URL canlı 200 doğrulama
- [ ] AR/RU footer responsive 768/900/1280px görsel doğrulama

🔍 Reviewed by: Claude (self) + Codex Gate 1 (spec) + Codex Gate 2 (PR diff)
EOF
)"
```

- [ ] **Step 3: Wait for CI green**

```bash
gh pr view --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name): \(.conclusion // .status)"'
```

Expected: all 10 checks (`lint`, `typecheck`, `format`, `unit-tests`, `audit`, `build`, `e2e-shard-1/2/3`, `ci-success`) → `SUCCESS`.

If any check fails, investigate the run log (`gh run view <id> --log-failed`), fix root cause, push, repeat.

- [ ] **Step 4: Run Codex Gate 2 review**

Use the `codex-review-pr` slash command (or invoke `codex:codex-rescue` subagent with PR diff context):

```
/codex-review-pr <PR-URL>
```

Disposition rule (memory `feedback_codex_dual_review_gate.md`):
- 0 critical / 0 high → approve immediately
- low/medium → append "🔍 Reviewed by: Claude + Codex (GPT-5.4)" footer + bullet list to PR body
- critical/high → inline fix (push) → re-run Gate 2

- [ ] **Step 5: Squash merge**

```bash
gh pr merge --squash --delete-branch
```

Expected: merge SHA logged, branch deleted.

- [ ] **Step 6: Verify auto-deploy**

```bash
gh run list --workflow=deploy.yml --limit 3
```

Expected: latest Deploy run is `completed / success` for the merge SHA.

---

## Task 17: Post-merge live smoke

8 URL canlı 200 + AR/RU footer görsel doğrulama.

**Files:** none

- [ ] **Step 1: 8 URL × 200 OK probe**

```bash
for url in \
  "https://kitaplastik.com/tr/yasal/gizlilik" \
  "https://kitaplastik.com/en/legal/privacy" \
  "https://kitaplastik.com/ru/pravovaya/konfidentsialnost" \
  "https://kitaplastik.com/ar/qanuni/khususiyya" \
  "https://kitaplastik.com/tr/yasal/cerezler" \
  "https://kitaplastik.com/en/legal/cookies" \
  "https://kitaplastik.com/ru/pravovaya/kuki" \
  "https://kitaplastik.com/ar/qanuni/kuki"; do
  printf "%-60s %s\n" "$url" "$(curl -s -o /dev/null -w '%{http_code}' $url)"
done
```

Expected: all 8 URLs return `200`.

- [ ] **Step 2: AR/RU footer responsive görsel doğrulama**

Open in browser at viewport widths 768px / 900px / 1280px:
- `https://kitaplastik.com/ar/qanuni/khususiyya`
- `https://kitaplastik.com/ru/pravovaya/konfidentsialnost`

Verify: footer bottom-bar legal link group not overlapping copyright/tagline; AR RTL text direction correct.

If layout issue at any breakpoint, file a separate fix PR (small CSS tweak, do not bundle).

- [ ] **Step 3: Sample one privacy page → footer privacy link → form privacy link round-trip in browser**

Manual check (5 minutes):
1. Open `https://kitaplastik.com/tr` → click footer "Gizlilik Politikası" → verify URL `/tr/yasal/gizlilik` + h1 visible.
2. Open `https://kitaplastik.com/tr/katalog` → click form-altı "Gizlilik Politikası" → verify same URL.

---

## Task 18: Memory + RESUME update + save-session

Final hygiene: project memory updated, RESUME flipped to "PR B canlı + patch PR pending", session saved.

**Files:**
- Modify: `~/.claude/projects/-Users-bt-claude-kitaplastik/memory/project_kitaplastik.md`
- Modify: `~/.claude/projects/-Users-bt-claude-kitaplastik/memory/MEMORY.md` (line 1)
- Modify: `docs/superpowers/RESUME.md`

- [ ] **Step 1: Update project memory frontmatter description**

In `~/.claude/projects/-Users-bt-claude-kitaplastik/memory/project_kitaplastik.md`, update the frontmatter `description` field to reflect "Plan 5b PR B ✅ canlıda + patch PR follow-up pending".

- [ ] **Step 2: Update MEMORY.md line 1**

In `~/.claude/projects/-Users-bt-claude-kitaplastik/memory/MEMORY.md`, refresh line 1 (project descriptor) with PR B canlı state + patch PR pending note.

- [ ] **Step 3: Update RESUME.md kickoff to "patch PR follow-up"**

In `docs/superpowers/RESUME.md`, the Kickoff section pivots from "PR B" to:
- PR A ✅ canlı (mevcut)
- PR B ✅ canlı (yeni — squashed merge SHA, 8 URL canlı)
- Sonraki: 5dk patch PR — staticFacts net değer fill (vergi/MERSİS/KEP/VERBIS/DPO)

- [ ] **Step 4: Commit RESUME.md (paths-ignore deploy skip)**

```bash
git add docs/superpowers/RESUME.md
git commit -m "docs(resume): Plan 5b PR B ✅ canlıda — patch PR follow-up pending"
git push origin main
```

Expected: deploy skipped per `feedback_ci_paths_ignore_docs.md` pattern.

- [ ] **Step 5: Run save-session**

```bash
/save-session
```

Expected: new session file in `~/.claude/sessions/2026-04-XX-plan5b-prb-session.tmp`.

---

## Self-Review Notes (post-write)

- [x] **Spec coverage:** Each spec section maps to a task. Routes (T1), wiring (T1), legal.json (T2-T3), components (T4-T9), pages (T10-T11), Footer (T12), forms (T13), E2E (T14), verify (T15), PR (T16), live smoke (T17), memory (T18). No gaps.
- [x] **Placeholder scan:** No `TBD`/`TODO`/"implement later" — all code complete in steps. The `staticFacts` placeholder string ("Bilgi güncelleniyor") is intentional content, not a plan placeholder.
- [x] **Type consistency:** `LegalDisclaimerProps`, `LegalTableProps`, `LegalLayoutProps`, `LegalControllerBlockProps` field names match across Task 4/6/7/8 and Task 10/11 page consumers.
- [x] **Translator instructions:** Task 3 includes terminology dictionary; not "translate it" with no guidance.
