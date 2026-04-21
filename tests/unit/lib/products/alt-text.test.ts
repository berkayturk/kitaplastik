import { describe, it, expect } from "vitest";
import { getImageAltText } from "@/lib/products/alt-text";

describe("getImageAltText", () => {
  const name = {
    tr: "PET Preform Kapak 28 mm",
    en: "PET Preform Cap 28 mm",
    ru: "ПЭТ Преформа Крышка 28 мм",
    ar: "غطاء PET preform مقاس 28 مم",
  };

  it("ana görselde (order=0) sadece ürün adını döner (TR)", () => {
    expect(getImageAltText({ name, locale: "tr", order: 0, imageLabel: "görsel" })).toBe(
      "PET Preform Kapak 28 mm",
    );
  });

  it("galeri görselinde order+1 + imageLabel ekler (EN)", () => {
    expect(getImageAltText({ name, locale: "en", order: 1, imageLabel: "image" })).toBe(
      "PET Preform Cap 28 mm — image 2",
    );
  });

  it("RU Cyrillic labelı doğru birleştirir", () => {
    expect(getImageAltText({ name, locale: "ru", order: 2, imageLabel: "изображение" })).toBe(
      "ПЭТ Преформа Крышка 28 мм — изображение 3",
    );
  });

  it("AR RTL için aynı format", () => {
    expect(getImageAltText({ name, locale: "ar", order: 3, imageLabel: "صورة" })).toBe(
      "غطاء PET preform مقاس 28 مم — صورة 4",
    );
  });
});
