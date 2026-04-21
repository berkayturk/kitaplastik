import { describe, it, expect } from "vitest";
import { toSafeLdJson } from "@/lib/products/json-ld";

describe("toSafeLdJson", () => {
  it("standart JSON objesi için geçerli string üretir", () => {
    const out = toSafeLdJson({ a: 1, b: "hi" });
    expect(JSON.parse(out)).toEqual({ a: 1, b: "hi" });
  });

  it("string içindeki </script bayrağını escape eder", () => {
    const malicious = { name: "bad</script><script>alert(1)</script>" };
    const out = toSafeLdJson(malicious);
    expect(out).not.toMatch(/<\/script/);
    expect(out).toMatch(/\\u003c\/script/i);
  });

  it("string içindeki HTML yorum açılışını da escape eder", () => {
    const out = toSafeLdJson({ x: "<!-- comment" });
    expect(out).not.toContain("<!--");
    expect(out).toMatch(/\\u003c!--/);
  });

  it("U+2028 / U+2029 line separators escape edilir (JSON'da geçerli, JS'de değil)", () => {
    const out = toSafeLdJson({ x: "line sep" });
    expect(out).not.toContain(" ");
    expect(out).toContain("\\u2028");
  });

  it("U+2029 paragraph separator da escape edilir", () => {
    const out = toSafeLdJson({ x: "para sep" });
    expect(out).not.toContain(" ");
    expect(out).toContain("\\u2029");
  });

  it("round-trip: JSON.parse çıktıyı orijinal objeye geri döner", () => {
    const input = {
      title: "Kıta Plastik",
      tags: ["a", "b"],
      nested: { n: 42, s: "</script>" },
    };
    const out = toSafeLdJson(input);
    expect(JSON.parse(out)).toEqual(input);
  });
});
