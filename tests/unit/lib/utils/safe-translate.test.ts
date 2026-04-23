// tests/unit/lib/utils/safe-translate.test.ts
import { describe, it, expect } from "vitest";
import { safeTranslate } from "@/lib/utils/safe-translate";

describe("safeTranslate", () => {
  it("returns string when key exists", () => {
    const t = (k: string) => {
      if (k === "foo.bar") return "Hello";
      throw new Error(`missing: ${k}`);
    };
    expect(safeTranslate(t, "foo.bar")).toBe("Hello");
  });

  it("returns null when translator throws (missing key)", () => {
    const t = (k: string) => {
      throw new Error(`missing: ${k}`);
    };
    expect(safeTranslate(t, "nope")).toBeNull();
  });

  it("returns null when translator returns the key itself (echo fallback)", () => {
    const t = (k: string) => k;
    expect(safeTranslate(t, "echo.me")).toBeNull();
  });

  it("returns null when translator returns empty string", () => {
    const t = (_: string) => "";
    expect(safeTranslate(t, "empty")).toBeNull();
  });

  it("returns null when translator returns undefined", () => {
    const t = (_: string) => undefined as unknown as string;
    expect(safeTranslate(t, "undef")).toBeNull();
  });
});
