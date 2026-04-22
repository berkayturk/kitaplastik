import { describe, it, expect } from "vitest";
import {
  isCatalogLocale,
  isCatalogSector,
  CATALOG_LOCALES,
  CATALOG_SECTORS,
} from "@/lib/catalog/types";

describe("catalog type guards", () => {
  it.each(CATALOG_LOCALES)("isCatalogLocale accepts %s", (l) => {
    expect(isCatalogLocale(l)).toBe(true);
  });

  it.each(["", "de", "fr", "TR", "EN"])("isCatalogLocale rejects %s", (l) => {
    expect(isCatalogLocale(l)).toBe(false);
  });

  it.each(CATALOG_SECTORS)("isCatalogSector accepts %s", (s) => {
    expect(isCatalogSector(s)).toBe(true);
  });

  it.each(["", "ALL", "food", "cam yikama", "kapak "])("isCatalogSector rejects %s", (s) => {
    expect(isCatalogSector(s)).toBe(false);
  });
});
