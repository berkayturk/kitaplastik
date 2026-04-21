import { describe, it, expect } from "vitest";
import { SPEC_PRESETS, getPresetLabel, type SpecPresetId } from "@/lib/admin/spec-presets";

describe("SPEC_PRESETS", () => {
  it("tam olarak 10 preset tanımlı", () => {
    expect(SPEC_PRESETS).toHaveLength(10);
  });

  it("her preset 4 dilde label'a sahip", () => {
    for (const p of SPEC_PRESETS) {
      expect(p.labels.tr).toBeTruthy();
      expect(p.labels.en).toBeTruthy();
      expect(p.labels.ru).toBeTruthy();
      expect(p.labels.ar).toBeTruthy();
    }
  });

  it("id'ler unique", () => {
    const ids = SPEC_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getPresetLabel", () => {
  it("verilen locale'de label döner", () => {
    expect(getPresetLabel("material", "tr")).toBe("Malzeme");
    expect(getPresetLabel("material", "en")).toBe("Material");
    expect(getPresetLabel("material", "ru")).toBe("Материал");
    expect(getPresetLabel("material", "ar")).toBe("مادة");
  });

  it("bilinmeyen preset için id fallback", () => {
    expect(getPresetLabel("unknown" as SpecPresetId, "tr")).toBe("unknown");
  });
});
