// lib/utils/assert.ts
// Lightweight runtime assertions for action/server entry points.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Throws if `id` is not a canonical UUID string.
 * Use at the top of server actions that accept an id path param — prevents
 * SQL/path injection via maliciously crafted ids and fails fast before any DB I/O.
 */
export function assertUuid(id: string, label = "id"): void {
  if (!UUID_RE.test(id)) {
    throw new Error(`Geçersiz ${label}`);
  }
}
