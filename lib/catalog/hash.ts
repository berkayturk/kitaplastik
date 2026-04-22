// lib/catalog/hash.ts
//
// Pure helper extracted from fetch-products so it is unit-testable without
// pulling in the server-only Supabase service client.

import { createHash } from "node:crypto";

export function computeDataHash(rows: ReadonlyArray<{ updated_at: string }>): string {
  if (rows.length === 0) return "";
  const maxUpdated = rows
    .map((r) => r.updated_at)
    .sort()
    .at(-1)!;
  return createHash("sha256").update(maxUpdated).digest("hex").slice(0, 16);
}
