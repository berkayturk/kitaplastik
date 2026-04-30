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
    "cam-yikama" | "otomotiv" | "tekstil",
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
// Empty until the real number lands; BackCover filters empty rows so
// the row is hidden instead of displaying a dummy "+90 224 000 00 00".
const phone = "";
const email = "info@kitaplastik.com";
const web = "kitaplastik.com";

export const CATALOG_CHROME: Record<CatalogLocale, CatalogChrome> = {
  tr: {
    establishment: `EST · 1989 · BURSA`,
    volume: `CİLT I — VOLUME I`,
    coverTitle: `Ürün Kataloğu ${YEAR}.`,
    coverTagline: "Plastik enjeksiyonun mühendislik partneri.",
    coverMeta: "3 SEKTÖR · 36 YIL · ±0.02MM",
    coverSectors: "Cam Yıkama · Otomotiv · Tekstil",
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
      otomotiv: {
        subtitle: "Otomotiv yan sanayi & EV güvenliği",
        overview: [
          "Elektrikli, hibrit ve içten yanmalı araçlar için plastik enjeksiyon çözümleri — güvenlik aksesuarları, iç trim ve bağlantı elemanları.",
          "EV-özel acil çıkış aksesuarlarından (imdat çekici, kemer kesici, kapı bypass) standart döşeme klipslerine geniş bir spektrum.",
        ],
        stats: [
          { label: "Malzeme", value: "ABS · PC · PP · TPE" },
          { label: "Tolerans", value: "±0.05 mm" },
          { label: "MOQ", value: "1.000 adet" },
          { label: "Sertifika", value: "ISO 9001 · IATF 16949 hedef" },
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
    coverSectors: "Glass Washing · Automotive · Textile",
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
      otomotiv: {
        subtitle: "Automotive supply & EV safety",
        overview: [
          "Plastic injection solutions for EV, hybrid and ICE vehicles — safety accessories, interior trim and fastening components.",
          "Range from EV-specific egress accessories (escape hammers, seatbelt cutters, door-bypass lanyards) to standard interior trim clips.",
        ],
        stats: [
          { label: "Material", value: "ABS · PC · PP · TPE" },
          { label: "Tolerance", value: "±0.05 mm" },
          { label: "MOQ", value: "1,000 units" },
          { label: "Certificate", value: "ISO 9001 · IATF 16949 target" },
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
    coverSectors: "Мойка стекла · Автопром · Текстиль",
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
      otomotiv: {
        subtitle: "Автопром & безопасность EV",
        overview: [
          "Решения по литью пластика для электромобилей, гибридов и авто с ДВС — аксессуары безопасности, элементы интерьера и крепёж.",
          "От аксессуаров аварийного выхода для EV (молотки, ножи для ремней, шнуры открытия дверей) до стандартных клипс обивки.",
        ],
        stats: [
          { label: "Материал", value: "ABS · PC · PP · TPE" },
          { label: "Допуск", value: "±0.05 мм" },
          { label: "MOQ", value: "1 000 шт." },
          { label: "Сертификат", value: "ISO 9001 · IATF 16949 (цель)" },
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
    coverSectors: "غسيل الزجاج · السيارات · النسيج",
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
      otomotiv: {
        subtitle: "صناعة السيارات وسلامة المركبات الكهربائية",
        overview: [
          "حلول الحقن البلاستيكي للمركبات الكهربائية والهجينة ومركبات الاحتراق الداخلي — ملحقات السلامة والديكور الداخلي وعناصر التثبيت.",
          "نطاق يمتد من ملحقات الخروج الطارئ المخصصة للمركبات الكهربائية (مطارق، قواطع أحزمة، حبال فتح الأبواب) إلى مشابك التنجيد القياسية.",
        ],
        stats: [
          { label: "المادة", value: "ABS · PC · PP · TPE" },
          { label: "التفاوت", value: "±0.05 مم" },
          { label: "الحد الأدنى", value: "1,000 قطعة" },
          { label: "الشهادات", value: "ISO 9001 · IATF 16949 (مستهدف)" },
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
