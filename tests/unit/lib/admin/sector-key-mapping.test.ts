// tests/unit/lib/admin/sector-key-mapping.test.ts
import { describe, it, expect } from "vitest";
import { dbSlugToSectorKey } from "@/lib/admin/sector-key-mapping";

describe("dbSlugToSectorKey", () => {
  it("maps all 3 seeded DB slugs to camelCase sector_key", () => {
    expect(dbSlugToSectorKey("cam-yikama")).toBe("camYikama");
    expect(dbSlugToSectorKey("kapak")).toBe("kapak");
    expect(dbSlugToSectorKey("tekstil")).toBe("tekstil");
  });

  it("throws on unknown DB slug", () => {
    expect(() => dbSlugToSectorKey("unknown")).toThrow(/Unknown sector DB slug/);
  });
});
