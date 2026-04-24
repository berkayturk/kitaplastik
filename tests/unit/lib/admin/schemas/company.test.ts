import { describe, it, expect } from "vitest";
import { CompanySchema } from "@/lib/admin/schemas/company";

const VALID = {
  legalName: "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
  brandName: "Kıta Plastik",
  shortName: "KITA",
  founded: 1989,
  address: {
    street: "Eski Gemlik Yolu Kadem Sk. No: 37-40",
    district: "Osmangazi",
    city: "Bursa",
    countryCode: "TR",
    maps: "https://www.google.com/maps/search/?api=1&query=test",
  },
  phone: { display: "+90 224 216 16 94", tel: "+902242161694" },
  cellPhone: { display: "+90 532 237 13 24", tel: "+905322371324" },
  fax: { display: "+90 224 215 05 25" },
  email: { primary: "info@kitaplastik.com", secondary: "hotmail@kitaplastik.com" },
  whatsapp: { display: "+90 224 216 16 94", wa: "905322371324" },
  telegram: { handle: "kitaplastik", display: "@kitaplastik" },
  web: { primary: "https://www.kitaplastik.com", alt: "https://www.kitaplastik.com.tr" },
};

describe("CompanySchema", () => {
  it("parses current lib/company.ts seed shape", () => {
    const r = CompanySchema.safeParse(VALID);
    expect(r.success).toBe(true);
  });

  it("rejects phone.tel without leading +", () => {
    const bad = { ...VALID, phone: { ...VALID.phone, tel: "902242161694" } };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects invalid email.primary", () => {
    const bad = { ...VALID, email: { ...VALID.email, primary: "not-an-email" } };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects http:// for web.primary (https-only)", () => {
    const bad = { ...VALID, web: { ...VALID.web, primary: "http://www.kitaplastik.com" } };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects non-Google host for address.maps", () => {
    const bad = {
      ...VALID,
      address: { ...VALID.address, maps: "https://evil.example.com/maps" },
    };
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects missing legalName", () => {
    const { legalName: _drop, ...bad } = VALID;
    const r = CompanySchema.safeParse(bad);
    expect(r.success).toBe(false);
  });
});
