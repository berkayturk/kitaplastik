// lib/catalog/i18n.ts
//
// UI dictionary for the PDF catalog template. Kept separate from the
// product/sectors JSONB (that is content, this is chrome). No runtime
// fetch — static, small, tree-shaken into the template bundle.

import type { CatalogLocale } from "./types";

export interface CatalogChrome {
  /** Top-right cover strip (establishment marker). */
  establishment: string;
  /** Cover pre-title ("VOLUME I"). */
  volume: string;
  /** Cover main title. Ends with a literal "." — renderer paints the
   * final period in blue as an editorial detail. */
  coverTitle: string;
  /** Cover italic tagline. */
  coverTagline: string;
  /** Bottom-left footer metadata on the cover. */
  coverMeta: string;
  /** Cover sector list chip. */
  coverSectors: string;
  /** Body-page bottom-strip brand mark. */
  runningFooter: string;
  /** Used in the cover's "— Sektör 02 / Kapak" notation. */
  sectorWord: string;

  /** Section header eyebrow on list pages (e.g., "KAPAK ÜRÜNLERİ"). */
  sectionEyebrow: (sectorTitle: string) => string;

  /** Info-grid labels (mono uppercase); one per product row. */
  labels: {
    material: string;
    dimension: string;
    usage: string;
    weight: string;
  };

  /** Back cover content. */
  backCover: {
    contactTitle: string;
    addressLabel: string;
    phoneLabel: string;
    emailLabel: string;
    webLabel: string;
    address: string;
    phone: string;
    email: string;
    web: string;
    copyright: string;
  };

  /** Sector editorial content — subtitles and overview paragraphs,
   * keyed by sector slug. */
  sectors: Record<
    "cam-yikama" | "kapak" | "tekstil",
    {
      subtitle: string;
      overview: string[];
      stats: Array<{ label: string; value: string }>;
    }
  >;
}

const YEAR = "2026";
const copyrightLine = `© ${YEAR} Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.`;
const address = "Bursa · Türkiye";
const phone = "+90 224 000 00 00";
const email = "info@kitaplastik.com";
const web = "kitaplastik.com";

export const CATALOG_CHROME: Record<CatalogLocale, CatalogChrome> = {
  tr: {
    establishment: `EST · 1989 · BURSA`,
    volume: `CİLT I — VOLUME I`,
    coverTitle: `Ürün Kataloğu ${YEAR}.`,
    coverTagline: "Plastik enjeksiyonun mühendislik partneri.",
    coverMeta: "3 SEKTÖR · 36 YIL · ±0.02MM",
    coverSectors: "Cam Yıkama · Kapak · Tekstil",
    runningFooter: `KITAPLASTIK · KATALOG ${YEAR}`,
    sectorWord: "Sektör",
    sectionEyebrow: (title) => `${title.toLocaleUpperCase("tr")} ÜRÜNLERİ`,
    labels: { material: "Malzeme", dimension: "Ölçü", usage: "Kullanım", weight: "Ağırlık" },
    backCover: {
      contactTitle: "İletişim",
      addressLabel: "Adres",
      phoneLabel: "Telefon",
      emailLabel: "E-posta",
      webLabel: "Web",
      address,
      phone,
      email,
      web,
      copyright: copyrightLine,
    },
    sectors: {
      "cam-yikama": {
        subtitle: "Endüstriyel cam yıkama için mühendislik bileşenleri",
        overview: [
          "Yüksek hacimli cam yıkama hatlarında çalışan plastik bileşenler — makine ömrü boyunca aşınmayı tolere etmek için mühendislik termoplastiklerinden üretilir.",
          "Tasarım, ıslak ortam, yüksek sıcaklık ve sürekli mekanik yüke göre optimize edilir; her parça ±0,02 mm toleransla enjeksiyon kalıplanır.",
        ],
        stats: [
          { label: "Malzeme", value: "POM · PA66 · PP" },
          { label: "Tolerans", value: "±0.02 mm" },
          { label: "MOQ", value: "500 adet" },
          { label: "Sertifika", value: "ISO 9001" },
        ],
      },
      kapak: {
        subtitle: "Gıda & kozmetik ambalajı",
        overview: [
          "Gıda ve kozmetik hatlarında kullanılan kapak ve kapak sistemleri — tamper-evident ve child-resistant varyantlar dahil.",
          "Hammadde gıda onaylıdır; üretim temiz oda koşullarında yapılır. Ø 20 mm ile Ø 110 mm arasında geniş bir spektrum.",
        ],
        stats: [
          { label: "Çap aralığı", value: "Ø 20 — 110 mm" },
          { label: "Malzeme", value: "HDPE · PP" },
          { label: "MOQ", value: "10.000 adet" },
          { label: "Sertifika", value: "FDA · EU 10/2011" },
        ],
      },
      tekstil: {
        subtitle: "Tekstil aksesuarları",
        overview: [
          "Dokuma ve örgü hatlarına entegre plastik aksesuarlar — düşük sürtünmeli, iplik kırılmasına karşı optimize edilmiş yüzey geometrisi.",
          "Renk eşleşmesi ve özel tasarım partner makineleri için müşteriye özel üretime uygun.",
        ],
        stats: [
          { label: "Malzeme", value: "POM · PA" },
          { label: "Tolerans", value: "±0.03 mm" },
          { label: "MOQ", value: "1.000 adet" },
          { label: "Renk", value: "Custom" },
        ],
      },
    },
  },
  en: {
    establishment: `EST · 1989 · BURSA`,
    volume: `VOLUME I`,
    coverTitle: `Product Catalog ${YEAR}.`,
    coverTagline: "The engineering partner for plastic injection.",
    coverMeta: "3 SECTORS · 36 YEARS · ±0.02MM",
    coverSectors: "Glass Washing · Caps · Textile",
    runningFooter: `KITAPLASTIK · CATALOG ${YEAR}`,
    sectorWord: "Sector",
    sectionEyebrow: (title) => `${title.toUpperCase()} PRODUCTS`,
    labels: { material: "Material", dimension: "Dimension", usage: "Usage", weight: "Weight" },
    backCover: {
      contactTitle: "Contact",
      addressLabel: "Address",
      phoneLabel: "Phone",
      emailLabel: "Email",
      webLabel: "Web",
      address,
      phone,
      email,
      web,
      copyright: copyrightLine,
    },
    sectors: {
      "cam-yikama": {
        subtitle: "Engineering components for industrial glass washing",
        overview: [
          "Plastic components that run inside high-throughput glass-washing lines — produced from engineering thermoplastics to tolerate wear across the machine's full lifetime.",
          "Designed for wet environments, elevated temperature and continuous mechanical load; every part is injection-moulded within ±0.02 mm tolerance.",
        ],
        stats: [
          { label: "Material", value: "POM · PA66 · PP" },
          { label: "Tolerance", value: "±0.02 mm" },
          { label: "MOQ", value: "500 units" },
          { label: "Certificate", value: "ISO 9001" },
        ],
      },
      kapak: {
        subtitle: "Food & cosmetic packaging",
        overview: [
          "Closures and cap systems for food and cosmetic lines — including tamper-evident and child-resistant variants.",
          "Raw materials are food-contact approved; production runs in clean-room conditions. Broad spectrum from Ø 20 mm to Ø 110 mm.",
        ],
        stats: [
          { label: "Diameter", value: "Ø 20 — 110 mm" },
          { label: "Material", value: "HDPE · PP" },
          { label: "MOQ", value: "10,000 units" },
          { label: "Certificate", value: "FDA · EU 10/2011" },
        ],
      },
      tekstil: {
        subtitle: "Textile accessories",
        overview: [
          "Plastic accessories embedded in weaving and knitting lines — low-friction surface geometry optimised against yarn breakage.",
          "Suitable for custom production with matched colour and bespoke design against partner-machine specifications.",
        ],
        stats: [
          { label: "Material", value: "POM · PA" },
          { label: "Tolerance", value: "±0.03 mm" },
          { label: "MOQ", value: "1,000 units" },
          { label: "Colour", value: "Custom" },
        ],
      },
    },
  },
  ru: {
    establishment: `EST · 1989 · БУРСА`,
    volume: `ТОМ I`,
    coverTitle: `Каталог продукции ${YEAR}.`,
    coverTagline: "Инженерный партнёр по литью пластмасс.",
    coverMeta: "3 СЕКТОРА · 36 ЛЕТ · ±0.02ММ",
    coverSectors: "Мойка стекла · Крышки · Текстиль",
    runningFooter: `KITAPLASTIK · КАТАЛОГ ${YEAR}`,
    sectorWord: "Сектор",
    sectionEyebrow: (title) => `${title.toUpperCase()} — ПРОДУКЦИЯ`,
    labels: { material: "Материал", dimension: "Размер", usage: "Применение", weight: "Вес" },
    backCover: {
      contactTitle: "Контакты",
      addressLabel: "Адрес",
      phoneLabel: "Телефон",
      emailLabel: "E-mail",
      webLabel: "Сайт",
      address,
      phone,
      email,
      web,
      copyright: copyrightLine,
    },
    sectors: {
      "cam-yikama": {
        subtitle: "Инженерные компоненты для промышленной мойки стекла",
        overview: [
          "Пластиковые компоненты, работающие в линиях мойки стекла с высокой пропускной способностью — произведены из инженерных термопластов для устойчивости к износу на протяжении всего срока службы машины.",
          "Разработаны для влажной среды, повышенной температуры и постоянной механической нагрузки; каждая деталь отливается в рамках допуска ±0,02 мм.",
        ],
        stats: [
          { label: "Материал", value: "POM · PA66 · PP" },
          { label: "Допуск", value: "±0.02 мм" },
          { label: "MOQ", value: "500 шт." },
          { label: "Сертификат", value: "ISO 9001" },
        ],
      },
      kapak: {
        subtitle: "Упаковка продуктов и косметики",
        overview: [
          "Крышки и системы укупорки для пищевой и косметической промышленности — включая варианты с индикацией вскрытия и защитой от детей.",
          "Сырьё одобрено для контакта с пищей; производство ведётся в условиях чистой комнаты. Спектр от Ø 20 мм до Ø 110 мм.",
        ],
        stats: [
          { label: "Диаметр", value: "Ø 20 — 110 мм" },
          { label: "Материал", value: "HDPE · PP" },
          { label: "MOQ", value: "10 000 шт." },
          { label: "Сертификат", value: "FDA · EU 10/2011" },
        ],
      },
      tekstil: {
        subtitle: "Текстильные аксессуары",
        overview: [
          "Пластиковые аксессуары для ткацких и вязальных линий — низкое трение, геометрия поверхности оптимизирована против обрыва пряжи.",
          "Подходит для индивидуального производства с подбором цвета и дизайна под партнёрские машины.",
        ],
        stats: [
          { label: "Материал", value: "POM · PA" },
          { label: "Допуск", value: "±0.03 мм" },
          { label: "MOQ", value: "1 000 шт." },
          { label: "Цвет", value: "Индивидуально" },
        ],
      },
    },
  },
  ar: {
    establishment: `EST · 1989 · بورصة`,
    volume: `المجلد الأول`,
    coverTitle: `كتالوج المنتجات ${YEAR}.`,
    coverTagline: "الشريك الهندسي لحقن البلاستيك.",
    coverMeta: "3 قطاعات · 36 سنة · ±0.02مم",
    coverSectors: "غسيل الزجاج · الأغطية · النسيج",
    runningFooter: `KITAPLASTIK · الكتالوج ${YEAR}`,
    sectorWord: "قطاع",
    sectionEyebrow: (title) => `منتجات ${title}`,
    labels: { material: "مادة", dimension: "القياس", usage: "الاستخدام", weight: "الوزن" },
    backCover: {
      contactTitle: "اتصل بنا",
      addressLabel: "العنوان",
      phoneLabel: "الهاتف",
      emailLabel: "البريد",
      webLabel: "الموقع",
      address: "بورصة · تركيا",
      phone,
      email,
      web,
      copyright: copyrightLine,
    },
    sectors: {
      "cam-yikama": {
        subtitle: "مكونات هندسية لغسيل الزجاج الصناعي",
        overview: [
          "مكونات بلاستيكية تعمل داخل خطوط غسيل الزجاج عالية الإنتاجية — مصنوعة من لدائن هندسية لتحمل التآكل طوال عمر الآلة.",
          "مصممة لبيئات رطبة، ودرجات حرارة مرتفعة، وأحمال ميكانيكية مستمرة؛ تُصنع كل قطعة بحقن الإنجكشن ضمن دقة ±0.02 مم.",
        ],
        stats: [
          { label: "المادة", value: "POM · PA66 · PP" },
          { label: "الدقة", value: "±0.02 مم" },
          { label: "الحد الأدنى", value: "500 قطعة" },
          { label: "الشهادات", value: "ISO 9001" },
        ],
      },
      kapak: {
        subtitle: "تعبئة الأغذية ومستحضرات التجميل",
        overview: [
          "أغطية وأنظمة إغلاق لخطوط الأغذية ومستحضرات التجميل — بما في ذلك الأنماط الدالة على العبث والمقاومة للأطفال.",
          "المواد الخام معتمدة للتلامس مع الغذاء؛ الإنتاج يتم في بيئة غرف نظيفة. النطاق من Ø 20 مم إلى Ø 110 مم.",
        ],
        stats: [
          { label: "القطر", value: "Ø 20 — 110 مم" },
          { label: "المادة", value: "HDPE · PP" },
          { label: "الحد الأدنى", value: "10,000 قطعة" },
          { label: "الشهادات", value: "FDA · EU 10/2011" },
        ],
      },
      tekstil: {
        subtitle: "إكسسوارات النسيج",
        overview: [
          "إكسسوارات بلاستيكية مدمجة في خطوط النسج والحياكة — هندسة سطح منخفضة الاحتكاك مُحسَّنة ضد انقطاع الخيط.",
          "مناسبة للإنتاج المخصص بمطابقة اللون والتصميم وفق آلات الشركاء.",
        ],
        stats: [
          { label: "المادة", value: "POM · PA" },
          { label: "الدقة", value: "±0.03 مم" },
          { label: "الحد الأدنى", value: "1,000 قطعة" },
          { label: "اللون", value: "مخصص" },
        ],
      },
    },
  },
};

export function getCatalogChrome(locale: CatalogLocale): CatalogChrome {
  return CATALOG_CHROME[locale];
}
