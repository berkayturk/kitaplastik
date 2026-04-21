import type { Locale } from "@/i18n/routing";

export interface ProductName {
  tr: string;
  en?: string;
  ru?: string;
  ar?: string;
}

interface Args {
  name: ProductName;
  locale: Locale;
  order: number;
  imageLabel: string;
}

export function getImageAltText({ name, locale, order, imageLabel }: Args): string {
  const base = name[locale] ?? name.tr;
  if (order === 0) return base;
  return `${base} — ${imageLabel} ${order + 1}`;
}
