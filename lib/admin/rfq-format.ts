// lib/admin/rfq-format.ts
//
// Format RFQ payload JSON into human-readable label/value entries for the
// admin detail view and team notification email. TR-only labels (admin is
// Turkish-only). Unknown keys fall back to a generic rendering.

import { getCountryName } from "@/lib/countries";

export interface FieldEntry {
  key: string;
  label: string;
  value: string;
  /** Render across both columns (long text, lists). */
  fullWidth?: boolean;
  /** Multi-value lists render as chips, single values as plain text. */
  kind?: "text" | "chips" | "boolean" | "longtext" | "link";
}

const SECTOR_LABELS: Record<string, string> = {
  "cam-yikama": "Cam Yıkama",
  kapak: "Kapak",
  tekstil: "Tekstil",
  diger: "Diğer",
};

const VOLUME_LABELS: Record<string, string> = {
  "1k": "1.000 adet/yıl",
  "5k": "5.000 adet/yıl",
  "10k": "10.000 adet/yıl",
  "50k": "50.000 adet/yıl",
  "100k+": "100.000+ adet/yıl",
  unknown: "Belirtilmedi",
};

const TOLERANCE_LABELS: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

const LOCALE_LABELS: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  ru: "Русский",
  ar: "العربية",
};

function formatDateTr(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

function boolLabel(v: unknown): string {
  if (v === true) return "Evet";
  if (v === false) return "Hayır";
  return "—";
}

function nonEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * Format a custom (özel üretim) RFQ payload into admin/email display entries.
 * Returns only non-empty fields, in a stable presentation order.
 */
export function formatCustomPayload(payload: Record<string, unknown>): FieldEntry[] {
  const entries: FieldEntry[] = [];

  if (nonEmpty(payload.sector)) {
    const key = String(payload.sector);
    entries.push({
      key: "sector",
      label: "Sektör",
      value: SECTOR_LABELS[key] ?? key,
    });
  }

  if (nonEmpty(payload.annualVolume)) {
    const key = String(payload.annualVolume);
    entries.push({
      key: "annualVolume",
      label: "Yıllık Hacim",
      value: VOLUME_LABELS[key] ?? key,
    });
  }

  if (nonEmpty(payload.tolerance)) {
    const key = String(payload.tolerance);
    entries.push({
      key: "tolerance",
      label: "Tolerans",
      value: TOLERANCE_LABELS[key] ?? key,
    });
  }

  if (nonEmpty(payload.targetDate)) {
    entries.push({
      key: "targetDate",
      label: "Hedef Tarih",
      value: formatDateTr(String(payload.targetDate)),
    });
  }

  if (Array.isArray(payload.materials) && payload.materials.length > 0) {
    entries.push({
      key: "materials",
      label: "Malzemeler",
      value: payload.materials.map((x) => String(x)).join(", "),
      kind: "chips",
    });
  }

  entries.push({
    key: "ndaRequired",
    label: "NDA Gerekli",
    value: boolLabel(payload.ndaRequired),
    kind: "boolean",
  });

  entries.push({
    key: "kvkkConsent",
    label: "KVKK Onayı",
    value: boolLabel(payload.kvkkConsent),
    kind: "boolean",
  });

  if (nonEmpty(payload.locale)) {
    const key = String(payload.locale);
    entries.push({
      key: "locale",
      label: "Form Dili",
      value: LOCALE_LABELS[key] ?? key,
    });
  }

  if (nonEmpty(payload.description)) {
    entries.push({
      key: "description",
      label: "Proje Açıklaması",
      value: String(payload.description),
      fullWidth: true,
      kind: "longtext",
    });
  }

  return entries;
}

/**
 * Format a standart (katalog ürün) RFQ payload into display entries.
 * Products array is rendered as a newline-separated bullet list text.
 */
export function formatStandartPayload(payload: Record<string, unknown>): FieldEntry[] {
  const entries: FieldEntry[] = [];

  if (nonEmpty(payload.deliveryCountry)) {
    entries.push({
      key: "deliveryCountry",
      label: "Teslimat Ülkesi",
      value: getCountryName(String(payload.deliveryCountry), "tr"),
    });
  }

  if (nonEmpty(payload.incoterm)) {
    entries.push({
      key: "incoterm",
      label: "Incoterm",
      value: String(payload.incoterm),
    });
  }

  entries.push({
    key: "urgent",
    label: "Acil",
    value: boolLabel(payload.urgent),
    kind: "boolean",
  });

  entries.push({
    key: "kvkkConsent",
    label: "KVKK Onayı",
    value: boolLabel(payload.kvkkConsent),
    kind: "boolean",
  });

  if (nonEmpty(payload.locale)) {
    const key = String(payload.locale);
    entries.push({
      key: "locale",
      label: "Form Dili",
      value: LOCALE_LABELS[key] ?? key,
    });
  }

  if (nonEmpty(payload.notes)) {
    entries.push({
      key: "notes",
      label: "Notlar",
      value: String(payload.notes),
      fullWidth: true,
      kind: "longtext",
    });
  }

  if (Array.isArray(payload.items) && payload.items.length > 0) {
    const lines = payload.items
      .map((raw, idx) => {
        const it = raw as Record<string, unknown>;
        const name = String(it.name ?? it.productName ?? it.product ?? `Ürün ${idx + 1}`);
        const qty = nonEmpty(it.qty)
          ? `${String(it.qty)} adet`
          : nonEmpty(it.quantity)
            ? `${String(it.quantity)} adet`
            : null;
        const variant = nonEmpty(it.variant) ? String(it.variant) : null;
        const notes = nonEmpty(it.notes) ? String(it.notes) : null;
        const parts = [name, qty, variant, notes].filter((x): x is string => Boolean(x));
        return `• ${parts.join(" · ")}`;
      })
      .join("\n");
    entries.push({
      key: "items",
      label: `Ürünler (${payload.items.length})`,
      value: lines,
      fullWidth: true,
      kind: "longtext",
    });
  }

  return entries;
}

/**
 * Pick the right formatter based on RFQ type.
 */
export function formatRfqPayload(
  type: "custom" | "standart",
  payload: Record<string, unknown>,
): FieldEntry[] {
  return type === "custom" ? formatCustomPayload(payload) : formatStandartPayload(payload);
}
