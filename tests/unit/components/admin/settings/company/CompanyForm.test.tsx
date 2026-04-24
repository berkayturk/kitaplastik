// tests/unit/components/admin/settings/company/CompanyForm.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CompanyForm } from "@/components/admin/settings/company/CompanyForm";
import type { Company } from "@/lib/admin/schemas/company";

const DEFAULTS: Company = {
  legalName: "Test Ltd.",
  brandName: "TestBrand",
  shortName: "TEST",
  founded: 2000,
  address: {
    street: "Some street 1",
    district: "Somewhere",
    city: "Istanbul",
    countryCode: "TR",
    maps: "https://www.google.com/maps/search/?api=1&query=test",
  },
  phone: { display: "+90 224 000 00 00", tel: "+902240000000" },
  cellPhone: { display: "+90 532 000 00 00", tel: "+905320000000" },
  fax: { display: "+90 224 000 00 00" },
  email: { primary: "a@test.com", secondary: "b@test.com" },
  whatsapp: { display: "+90 224 000 00 00", wa: "902240000000" },
  telegram: { handle: "handle", display: "@handle" },
  web: { primary: "https://a.test", alt: "https://b.test" },
};

describe("CompanyForm", () => {
  it("renders all sections with defaultValues", () => {
    const noop = vi.fn();
    render(<CompanyForm defaultValues={DEFAULTS} action={noop} />);
    expect(screen.getByLabelText(/marka adı/i)).toHaveValue("TestBrand");
    expect(screen.getByLabelText(/tam.ünvan|legal/i)).toHaveValue("Test Ltd.");
    expect(screen.getAllByText(/BÖLÜM/).length).toBe(4);
  });

  it("enables submit only after a valid change", async () => {
    const user = userEvent.setup();
    const noop = vi.fn();
    render(<CompanyForm defaultValues={DEFAULTS} action={noop} />);
    const submit = screen.getByRole("button", { name: /kaydet/i });
    expect(submit).toBeDisabled();

    const brandInput = screen.getByLabelText(/marka adı/i);
    await user.clear(brandInput);
    await user.type(brandInput, "Yeni Marka");

    expect(submit).toBeEnabled();
  });
});
