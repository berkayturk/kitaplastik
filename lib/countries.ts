// lib/countries.ts
//
// Locale-aware country name helpers backed by i18n-iso-countries.
// - `getCountries(locale)` returns all 250+ ISO-2 territories, sorted by
//   locale-native name (locale-aware collation).
// - `POPULAR_CODES` are surfaced in an optgroup at the top of the selector
//   (Bursa / Turkey-centric business markets: EU + Gulf + CIS).
// - Falls back to English when a locale translation is missing.

import countries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import enLocale from "i18n-iso-countries/langs/en.json";
import ruLocale from "i18n-iso-countries/langs/ru.json";
import trLocale from "i18n-iso-countries/langs/tr.json";

countries.registerLocale(enLocale);
countries.registerLocale(trLocale);
countries.registerLocale(ruLocale);
countries.registerLocale(arLocale);

import { DIAL_CODES } from "./phone-dial-codes";

export type Locale = "tr" | "en" | "ru" | "ar";

export interface CountryOption {
  code: string; // ISO-2
  name: string; // localized
}

/**
 * Turkey-centric business markets shown at the top of the country list.
 * Ordered roughly by relevance: home / EU trade partners / Gulf / CIS-MENA.
 */
export const POPULAR_CODES: readonly string[] = [
  "TR",
  "DE",
  "US",
  "GB",
  "FR",
  "IT",
  "ES",
  "NL",
  "RU",
  "SA",
  "AE",
  "AZ",
  "IR",
  "QA",
  "SY",
  "IQ",
];

/**
 * Country codes that have an entry in our dial-code map.
 * Used to filter ISO listings down to phone-dial-compatible territories.
 */
const DIAL_CODE_SET = new Set(DIAL_CODES.map((d) => d.code));

/**
 * Return all countries translated for the given locale, sorted by
 * locale-native name (Intl.Collator, base strength).
 */
export function getCountries(locale: Locale): CountryOption[] {
  const names = countries.getNames(locale, { select: "official" });
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  return Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

/**
 * Popular countries in the order defined by POPULAR_CODES (not alphabetical).
 * Missing translations fall back to English names.
 */
export function getPopularCountries(locale: Locale): CountryOption[] {
  return POPULAR_CODES.map((code) => ({
    code,
    name:
      countries.getName(code, locale, { select: "official" }) ??
      countries.getName(code, "en", { select: "official" }) ??
      code,
  }));
}

/**
 * Resolve an ISO-2 country code to its locale name. Returns the raw input if
 * no translation is found (graceful fallback for legacy payloads containing
 * free-text values like "tkrü").
 */
export function getCountryName(code: string, locale: Locale): string {
  if (!code) return "";
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return code;
  return (
    countries.getName(normalized, locale, { select: "official" }) ??
    countries.getName(normalized, "en", { select: "official" }) ??
    code
  );
}

/**
 * Whitelisted ISO-2 codes that we ship in the phone-dial map (used to
 * constrain the country selector to countries we can also represent in
 * phone UIs, so selection and dial options stay aligned).
 */
export function isKnownCountryCode(code: string): boolean {
  return DIAL_CODE_SET.has(code.toUpperCase());
}
