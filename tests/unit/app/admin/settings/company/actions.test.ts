import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE import
vi.mock("@/lib/admin/auth", () => ({
  requireAdminRole: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/admin/company", () => ({
  getCompanyForAdmin: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updateCompany } from "@/app/admin/settings/company/actions";
import { requireAdminRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompanyForAdmin } from "@/lib/admin/company";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const VALID_COMPANY = {
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
  email: { primary: "info@kitaplastik.com", secondary: "b@kitaplastik.com" },
  whatsapp: { display: "+90 224 216 16 94", wa: "905322371324" },
  telegram: { handle: "kitaplastik", display: "@kitaplastik" },
  web: { primary: "https://www.kitaplastik.com", alt: "https://www.kitaplastik.com.tr" },
};

function buildValidFormData(overrides: Partial<typeof VALID_COMPANY> = {}): FormData {
  const v = { ...VALID_COMPANY, ...overrides };
  const fd = new FormData();
  fd.set("legalName", v.legalName);
  fd.set("brandName", v.brandName);
  fd.set("shortName", v.shortName);
  fd.set("founded", String(v.founded));
  fd.set("address", JSON.stringify(v.address));
  fd.set("phone", JSON.stringify(v.phone));
  fd.set("cellPhone", JSON.stringify(v.cellPhone));
  fd.set("fax", JSON.stringify(v.fax));
  fd.set("email", JSON.stringify(v.email));
  fd.set("whatsapp", JSON.stringify(v.whatsapp));
  fd.set("telegram", JSON.stringify(v.telegram));
  fd.set("web", JSON.stringify(v.web));
  return fd;
}

describe("updateCompany server action", () => {
  const mockUser = {
    id: "user-1",
    email: "admin@test",
    role: "admin" as const,
    displayName: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminRole).mockResolvedValue(mockUser);
    vi.mocked(getCompanyForAdmin).mockResolvedValue({
      id: "company-1",
      data: VALID_COMPANY,
      updated_at: "2026-04-24T00:00:00Z",
      updated_by: null,
    });
    vi.mocked(createClient).mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ error: null }),
    } as never);
  });

  it("rejects invalid phone.tel (zod throws)", async () => {
    const fd = buildValidFormData();
    fd.set("phone", JSON.stringify({ display: "+90 224 216 16 94", tel: "invalid-no-plus" }));
    await expect(updateCompany(fd)).rejects.toThrow();
  });

  it("rejects invalid email.primary (zod throws)", async () => {
    const fd = buildValidFormData();
    fd.set("email", JSON.stringify({ primary: "not-email", secondary: "b@test.com" }));
    await expect(updateCompany(fd)).rejects.toThrow();
  });

  it("rejects non-Google maps URL (zod throws)", async () => {
    const fd = buildValidFormData();
    fd.set(
      "address",
      JSON.stringify({
        ...VALID_COMPANY.address,
        maps: "https://evil.example.com/maps",
      }),
    );
    await expect(updateCompany(fd)).rejects.toThrow();
  });

  it("propagates requireAdminRole redirect (sales/viewer blocked)", async () => {
    vi.mocked(requireAdminRole).mockRejectedValueOnce(
      new Error("NEXT_REDIRECT:/admin/catalog-requests"),
    );
    const fd = buildValidFormData();
    await expect(updateCompany(fd)).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it("calls RPC + recordAudit + revalidatePath on happy path", async () => {
    const fd = buildValidFormData({ brandName: "Kıta Plastik v2" });
    await expect(updateCompany(fd)).rejects.toThrow(
      /NEXT_REDIRECT:\/admin\/settings\/company\?success=updated/,
    );
    expect(recordAudit).toHaveBeenCalledTimes(1);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "company_updated",
        entity_type: "company_settings",
        entity_id: "company-1",
        user_id: "user-1",
        diff: expect.objectContaining({ changed_keys: ["brandName"] }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/settings/company", "page");
  });
});
