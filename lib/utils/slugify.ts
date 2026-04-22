import type { Locale } from "@/i18n/routing";

const TR_MAP: Record<string, string> = {
  ı: "i",
  I: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

// BGN/PCGN romanization (Yandex + Google RU standard)
const RU_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  А: "a",
  Б: "b",
  В: "v",
  Г: "g",
  Д: "d",
  Е: "e",
  Ё: "yo",
  Ж: "zh",
  З: "z",
  И: "i",
  Й: "y",
  К: "k",
  Л: "l",
  М: "m",
  Н: "n",
  О: "o",
  П: "p",
  Р: "r",
  С: "s",
  Т: "t",
  У: "u",
  Ф: "f",
  Х: "kh",
  Ц: "ts",
  Ч: "ch",
  Ш: "sh",
  Щ: "shch",
  Ъ: "",
  Ы: "y",
  Ь: "",
  Э: "e",
  Ю: "yu",
  Я: "ya",
};

// Arabic consonant-only transliteration (vowels absent in script)
const AR_MAP: Record<string, string> = {
  ا: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ء: "",
  ة: "h",
  ى: "a",
  آ: "a",
  أ: "a",
  إ: "i",
  ؤ: "w",
  ئ: "y",
};

const COMBINED_MAP: Record<string, string> = { ...TR_MAP, ...RU_MAP, ...AR_MAP };

function selectMap(locale?: Locale): Record<string, string> {
  switch (locale) {
    case "tr":
      return TR_MAP;
    case "ru":
      return RU_MAP;
    case "ar":
      return AR_MAP;
    default:
      return COMBINED_MAP;
  }
}

function toAscii(input: string, map: Record<string, string>): string {
  return Array.from(input)
    .map((ch) => map[ch] ?? ch)
    .join("");
}

export interface SlugifyOptions {
  locale?: Locale;
}

export function slugify(input: string, options?: SlugifyOptions): string {
  if (!input) return "";
  const map = selectMap(options?.locale);
  return toAscii(input, map)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Permissive variant for in-progress editing: preserves dashes (incl. trailing),
// so users can type "pet-" without the dash being stripped mid-keystroke.
// Apply slugify() on blur/submit for the final cleanup.
export function slugifyDraft(input: string, options?: SlugifyOptions): string {
  if (!input) return "";
  const map = selectMap(options?.locale);
  return toAscii(input, map)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}
