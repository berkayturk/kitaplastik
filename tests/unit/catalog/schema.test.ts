import { describe, it, expect } from "vitest";
import { catalogRequestSchema } from "@/lib/validation/catalog";

describe("catalogRequestSchema", () => {
  const base = {
    email: "user@example.com",
    locale: "tr",
    turnstileToken: "tok",
    honeypot: "",
  };

  it("defaults sector to 'all' when omitted (backward compat)", () => {
    const parsed = catalogRequestSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.sector).toBe("all");
  });

  it.each(["all", "cam-yikama", "otomotiv", "tekstil"])("accepts sector=%s", (s) => {
    const parsed = catalogRequestSchema.safeParse({ ...base, sector: s });
    expect(parsed.success).toBe(true);
  });

  it.each(["ALL", "glass", "", "cam yikama", "food"])("rejects unknown sector=%s", (s) => {
    const parsed = catalogRequestSchema.safeParse({ ...base, sector: s });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const parsed = catalogRequestSchema.safeParse({ ...base, email: "not-an-email" });
    expect(parsed.success).toBe(false);
  });

  it("rejects non-empty honeypot", () => {
    const parsed = catalogRequestSchema.safeParse({ ...base, honeypot: "bot" });
    expect(parsed.success).toBe(false);
  });
});
