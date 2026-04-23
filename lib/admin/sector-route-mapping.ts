// lib/admin/sector-route-mapping.ts
export const SECTOR_DB_TO_ROUTE: Readonly<Record<string, string>> = Object.freeze({
  "cam-yikama": "bottle-washing",
  kapak: "caps",
  tekstil: "textile",
});

export function dbSlugToRouteSlug(dbSlug: string): string {
  const route = SECTOR_DB_TO_ROUTE[dbSlug];
  if (!route) throw new Error(`Unknown sector DB slug: ${dbSlug}`);
  return route;
}
