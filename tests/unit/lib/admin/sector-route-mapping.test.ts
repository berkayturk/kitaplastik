// tests/unit/lib/admin/sector-route-mapping.test.ts
import { describe, it, expect } from "vitest";
import { dbSlugToRouteSlug, SECTOR_DB_TO_ROUTE } from "@/lib/admin/sector-route-mapping";

describe("dbSlugToRouteSlug", () => {
  it("maps all 3 seeded DB slugs to canonical EN", () => {
    expect(dbSlugToRouteSlug("cam-yikama")).toBe("bottle-washing");
    expect(dbSlugToRouteSlug("otomotiv")).toBe("automotive");
    expect(dbSlugToRouteSlug("tekstil")).toBe("textile");
  });

  it("throws on unknown DB slug", () => {
    expect(() => dbSlugToRouteSlug("unknown")).toThrow(/Unknown sector DB slug/);
  });

  it("SECTOR_DB_TO_ROUTE has exactly 3 entries (seeded sectors)", () => {
    expect(Object.keys(SECTOR_DB_TO_ROUTE)).toHaveLength(3);
  });
});
