import { describe, it, expect } from "vitest";
import { getReferences, getReferencesBySector } from "@/lib/references/data";

describe("references data", () => {
  it("returns 8 references", () => {
    expect(getReferences()).toHaveLength(8);
  });

  it("each reference has id, key, logoPath, sectorKey", () => {
    const refs = getReferences();
    for (const ref of refs) {
      expect(ref.id).toBeTruthy();
      expect(ref.key).toBeTruthy();
      expect(ref.logoPath).toMatch(/^\/references\/.+\.svg$/);
      expect(["camYikama", "kapak", "tekstil"]).toContain(ref.sectorKey);
    }
  });

  it("filters by sector", () => {
    const glass = getReferencesBySector("camYikama");
    expect(glass.length).toBeGreaterThan(0);
    expect(glass.every((r) => r.sectorKey === "camYikama")).toBe(true);
  });
});
