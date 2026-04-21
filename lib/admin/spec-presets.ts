import type { Locale } from "@/i18n/routing";

export type SpecPresetId =
  | "material"
  | "dimension"
  | "color"
  | "moq"
  | "weight"
  | "certificate"
  | "production"
  | "recycling"
  | "shelfLife"
  | "tolerance";

export interface SpecPreset {
  id: SpecPresetId;
  labels: Record<Locale, string>;
}

export const SPEC_PRESETS: readonly SpecPreset[] = [
  { id: "material", labels: { tr: "Malzeme", en: "Material", ru: "Материал", ar: "مادة" } },
  { id: "dimension", labels: { tr: "Boyut", en: "Dimension", ru: "Размер", ar: "القياس" } },
  { id: "color", labels: { tr: "Renk", en: "Color", ru: "Цвет", ar: "اللون" } },
  { id: "moq", labels: { tr: "MOQ", en: "MOQ", ru: "MOQ", ar: "MOQ" } },
  { id: "weight", labels: { tr: "Ağırlık", en: "Weight", ru: "Вес", ar: "الوزن" } },
  {
    id: "certificate",
    labels: { tr: "Sertifika", en: "Certificate", ru: "Сертификат", ar: "شهادة" },
  },
  {
    id: "production",
    labels: { tr: "Üretim", en: "Production", ru: "Производство", ar: "الإنتاج" },
  },
  {
    id: "recycling",
    labels: { tr: "Geri Dönüşüm", en: "Recycling", ru: "Переработка", ar: "إعادة التدوير" },
  },
  {
    id: "shelfLife",
    labels: { tr: "Raf Ömrü", en: "Shelf Life", ru: "Срок хранения", ar: "مدة الصلاحية" },
  },
  { id: "tolerance", labels: { tr: "Tolerans", en: "Tolerance", ru: "Допуск", ar: "تحمل" } },
] as const;

const PRESET_MAP = new Map<SpecPresetId, SpecPreset>(SPEC_PRESETS.map((p) => [p.id, p]));

export function getPresetLabel(id: SpecPresetId, locale: Locale): string {
  const preset = PRESET_MAP.get(id);
  return preset?.labels[locale] ?? id;
}
