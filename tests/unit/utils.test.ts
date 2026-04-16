import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn helper", () => {
  it("birleştirir basit class string'lerini", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("falsy değerleri filtreler", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("Tailwind çakışmalarında son class'ı korur", () => {
    expect(cn("p-4 p-8")).toBe("p-8");
  });

  it("conditional object syntax destekler", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });
});
