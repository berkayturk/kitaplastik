import { describe, it, expect, vi } from "vitest";

// Stub the server-only Supabase service client so importing cache.ts in
// jsdom does not force env.ts to parse production secrets.
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    storage: {
      from: () => ({
        download: async () => ({ data: null, error: { statusCode: 404, message: "Not found" } }),
        upload: async () => ({ data: null, error: null }),
      }),
    },
  }),
}));

const { cacheKey, CATALOG_CACHE_BUCKET } = await import("@/lib/catalog/cache");

describe("catalog cache key", () => {
  it("produces the documented {sector}-{lang}-{hash}.pdf format", () => {
    expect(cacheKey("otomotiv", "tr", "abcd1234")).toBe("otomotiv-tr-abcd1234.pdf");
    expect(cacheKey("all", "ar", "deadbeefcafebabe")).toBe("all-ar-deadbeefcafebabe.pdf");
  });

  it("changes when any component changes", () => {
    const a = cacheKey("otomotiv", "tr", "h1");
    const b = cacheKey("otomotiv", "tr", "h2");
    const c = cacheKey("otomotiv", "en", "h1");
    const d = cacheKey("tekstil", "tr", "h1");
    expect(new Set([a, b, c, d]).size).toBe(4);
  });

  it("targets the private catalog-cache bucket", () => {
    expect(CATALOG_CACHE_BUCKET).toBe("catalog-cache");
  });
});
