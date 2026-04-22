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

function toAscii(input: string): string {
  return Array.from(input)
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");
}

export function slugify(input: string): string {
  if (!input) return "";
  return toAscii(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Permissive variant for in-progress editing: preserves dashes (incl. trailing),
// so users can type "pet-" without the dash being stripped mid-keystroke.
// Apply slugify() on blur/submit for the final cleanup.
export function slugifyDraft(input: string): string {
  if (!input) return "";
  return toAscii(input)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}
