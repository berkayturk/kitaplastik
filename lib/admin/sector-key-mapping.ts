// lib/admin/sector-key-mapping.ts
const DB_SLUG_TO_KEY: Readonly<Record<string, string>> = Object.freeze({
  "cam-yikama": "camYikama",
  otomotiv: "otomotiv",
  tekstil: "tekstil",
});

export function dbSlugToSectorKey(dbSlug: string): string {
  const key = DB_SLUG_TO_KEY[dbSlug];
  if (!key) throw new Error(`Unknown sector DB slug: ${dbSlug}`);
  return key;
}
