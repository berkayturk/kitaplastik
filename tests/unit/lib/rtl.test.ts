import { describe, it, expect } from "vitest";
import { isRtl, getDir } from "@/lib/rtl";

describe("rtl helpers", () => {
  it("identifies ar as RTL", () => {
    expect(isRtl("ar")).toBe(true);
  });
  it("identifies tr/en/ru as LTR", () => {
    expect(isRtl("tr")).toBe(false);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("ru")).toBe(false);
  });
  it("getDir returns rtl/ltr", () => {
    expect(getDir("ar")).toBe("rtl");
    expect(getDir("tr")).toBe("ltr");
  });
});
