import { describe, it, expect } from "vitest";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/admin/schemas/product";

describe("CreateProductSchema", () => {
  const validBase = {
    sector_id: "00000000-0000-0000-0000-000000000001",
    name: { tr: "PET Kapak", en: "", ru: "", ar: "" },
    description: { tr: "Açıklama", en: "", ru: "", ar: "" },
    specs: [{ preset_id: "material", value: "PET" }],
    images: [{ path: "draft/abc.jpg", order: 0, alt_text: { tr: "", en: "", ru: "", ar: "" } }],
  };

  it("TR name zorunlu, diğerleri opsiyonel", () => {
    expect(CreateProductSchema.safeParse(validBase).success).toBe(true);

    const missingTr = { ...validBase, name: { tr: "", en: "Cap", ru: "", ar: "" } };
    expect(CreateProductSchema.safeParse(missingTr).success).toBe(false);
  });

  it("preset_id aynı olan iki spec reddedilir (unique)", () => {
    const duplicate = {
      ...validBase,
      specs: [
        { preset_id: "material", value: "PET" },
        { preset_id: "material", value: "EVOH" },
      ],
    };
    const result = CreateProductSchema.safeParse(duplicate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => /unique|duplicate/i.test(i.message))).toBe(true);
    }
  });

  it("bilinmeyen preset_id reddedilir", () => {
    const bad = { ...validBase, specs: [{ preset_id: "foo", value: "bar" }] };
    expect(CreateProductSchema.safeParse(bad).success).toBe(false);
  });

  it("max 5 görsel, 6 reddedilir", () => {
    const images = Array.from({ length: 6 }, (_, i) => ({
      path: `x/${i}.jpg`,
      order: i,
      alt_text: { tr: "", en: "", ru: "", ar: "" },
    }));
    expect(CreateProductSchema.safeParse({ ...validBase, images }).success).toBe(false);
  });

  it("name.tr whitespace-only reddedilir ve valid veri trim edilir", () => {
    const whitespaceOnly = { ...validBase, name: { tr: "   ", en: "", ru: "", ar: "" } };
    expect(CreateProductSchema.safeParse(whitespaceOnly).success).toBe(false);

    const surroundingWs = { ...validBase, name: { tr: "  PET Kapak  ", en: "", ru: "", ar: "" } };
    const result = CreateProductSchema.safeParse(surroundingWs);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name.tr).toBe("PET Kapak"); // trim'li
    }
  });
});

describe("UpdateProductSchema", () => {
  it("slug_override alanı opsiyonel, varsa slug formatı dayatır", () => {
    const validUpdate = {
      sector_id: "00000000-0000-0000-0000-000000000001",
      name: { tr: "Yeni Ad", en: "", ru: "", ar: "" },
      description: { tr: "", en: "", ru: "", ar: "" },
      specs: [],
      images: [],
      slug_override: "yeni-urun-slug",
    };
    expect(UpdateProductSchema.safeParse(validUpdate).success).toBe(true);

    const badSlug = { ...validUpdate, slug_override: "Boşluklu Slug!" };
    expect(UpdateProductSchema.safeParse(badSlug).success).toBe(false);
  });
});
