import { describe, it, expect } from "vitest";
import { contactSchema } from "@/lib/validation/contact";

const valid = {
  name: "Ali Veli",
  email: "a@b.com",
  company: "Acme",
  phone: "+905551112233",
  subject: "general" as const,
  message: "Merhaba, lütfen bilgi veriniz.",
  locale: "tr" as const,
  turnstileToken: "xyz",
  honeypot: "",
};

describe("contactSchema", () => {
  it("accepts valid input", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("requires min-length name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects bad email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("requires min-length message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
  });

  it("rejects honeypot fill", () => {
    expect(contactSchema.safeParse({ ...valid, honeypot: "bot" }).success).toBe(false);
  });

  it("accepts all 4 locales", () => {
    for (const locale of ["tr", "en", "ru", "ar"] as const) {
      expect(contactSchema.safeParse({ ...valid, locale }).success).toBe(true);
    }
  });
});
