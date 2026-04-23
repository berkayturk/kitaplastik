// tests/unit/lib/admin/schemas/sector.test.ts
import { describe, it, expect } from "vitest";
import { UpdateSectorSchema } from "@/lib/admin/schemas/sector";

const valid = {
  name: { tr: "Cam Yıkama", en: "Glass Washing", ru: "", ar: "" },
  description: null,
  long_description: null,
  meta_title: null,
  meta_description: null,
  hero_image: null,
  display_order: 10,
  active: true,
};

describe("UpdateSectorSchema", () => {
  it("accepts minimum valid input (only TR name)", () => {
    expect(() => UpdateSectorSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty TR name", () => {
    expect(() =>
      UpdateSectorSchema.parse({ ...valid, name: { tr: "", en: "x", ru: "", ar: "" } }),
    ).toThrow();
  });

  it("accepts hero_image with path + 4-lang alt", () => {
    const input = {
      ...valid,
      hero_image: {
        path: "cam-yikama/abc.webp",
        alt: { tr: "Atölye", en: "Workshop", ru: "", ar: "" },
      },
    };
    expect(() => UpdateSectorSchema.parse(input)).not.toThrow();
  });

  it("accepts i18n optional fields as null", () => {
    expect(() => UpdateSectorSchema.parse(valid)).not.toThrow();
  });

  it("rejects negative display_order", () => {
    expect(() => UpdateSectorSchema.parse({ ...valid, display_order: -5 })).toThrow();
  });
});
