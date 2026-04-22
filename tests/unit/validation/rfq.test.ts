import { describe, it, expect } from "vitest";
import { customRfqSchema, standartRfqSchema } from "@/lib/validation/rfq";

const baseContact = {
  name: "Ali",
  email: "a@b.com",
  company: "Acme",
  phone: "+90 5551112233",
  country: "TR",
};

const validCustom = {
  contact: baseContact,
  sector: "cam-yikama" as const,
  description:
    "Bu proje icin plastik enjeksiyon ile uretim yapacak bir partnere ihtiyacimiz var ve uzun olmasi lazim.",
  materials: ["PP", "ABS"],
  annualVolume: "10k" as const,
  tolerance: "medium" as const,
  targetDate: "2026-12-31",
  ndaRequired: true,
  kvkkConsent: true,
  attachments: [{ path: "rfq/uuid/a.pdf", name: "a.pdf", size: 1024, mime: "application/pdf" }],
  locale: "tr" as const,
  turnstileToken: "tok",
  honeypot: "",
};

const validStandart = {
  contact: baseContact,
  items: [{ productSlug: "kapak-33mm", variant: "white", qty: 1000 }],
  deliveryCountry: "TR",
  incoterm: "EXW" as const,
  notes: "",
  urgent: false,
  kvkkConsent: true,
  locale: "tr" as const,
  turnstileToken: "tok",
  honeypot: "",
};

describe("customRfqSchema", () => {
  it("accepts valid payload", () => {
    expect(customRfqSchema.safeParse(validCustom).success).toBe(true);
  });
  it("requires kvkk consent = true", () => {
    expect(customRfqSchema.safeParse({ ...validCustom, kvkkConsent: false }).success).toBe(false);
  });
  it("enforces description length 50-2000", () => {
    expect(customRfqSchema.safeParse({ ...validCustom, description: "x".repeat(49) }).success).toBe(
      false,
    );
    expect(
      customRfqSchema.safeParse({ ...validCustom, description: "x".repeat(2001) }).success,
    ).toBe(false);
  });
  it("limits attachments to 5", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      path: `p${i}`,
      name: `${i}.pdf`,
      size: 100,
      mime: "application/pdf",
    }));
    expect(customRfqSchema.safeParse({ ...validCustom, attachments: many }).success).toBe(false);
  });
});

describe("standartRfqSchema", () => {
  it("accepts valid payload", () => {
    expect(standartRfqSchema.safeParse(validStandart).success).toBe(true);
  });
  it("requires at least 1 item", () => {
    expect(standartRfqSchema.safeParse({ ...validStandart, items: [] }).success).toBe(false);
  });
  it("qty must be positive int", () => {
    const bad = { ...validStandart, items: [{ productSlug: "x", variant: "", qty: 0 }] };
    expect(standartRfqSchema.safeParse(bad).success).toBe(false);
  });
});
