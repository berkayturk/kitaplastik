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

export function slugify(input: string): string {
  if (!input) return "";
  const asciified = Array.from(input)
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("");
  return asciified
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
