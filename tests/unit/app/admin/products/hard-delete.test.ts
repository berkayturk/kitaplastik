import { describe, it, expect, vi, beforeEach } from "vitest";

const { deleteSpy, removeSpy, fromSpy, getProductByIdMock, recordAuditMock } = vi.hoisted(() => {
  const deleteSpy = vi.fn().mockResolvedValue({ data: null, error: null });
  const removeSpy = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromSpy = vi.fn();
  return {
    deleteSpy,
    removeSpy,
    fromSpy,
    getProductByIdMock: vi.fn(),
    recordAuditMock: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/admin/auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({ id: "admin-uuid", email: "admin@kp.com" }),
}));

vi.mock("@/lib/admin/products", () => ({
  getProductById: getProductByIdMock,
  slugExists: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: fromSpy,
    storage: { from: () => ({ remove: removeSpy }) },
  }),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit: recordAuditMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { hardDeleteProduct } from "@/app/admin/products/actions";

describe("hardDeleteProduct — irreversible delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteSpy.mockResolvedValue({ data: null, error: null });
    removeSpy.mockResolvedValue({ data: null, error: null });
    fromSpy.mockReturnValue({
      delete: () => ({ eq: deleteSpy }),
    });
    recordAuditMock.mockResolvedValue(undefined);
  });

  it("throws when product is still active (soft-delete required first)", async () => {
    getProductByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      slug: "p1",
      code: "P-001",
      sector_id: "s1",
      images: [],
      active: true,
    });

    await expect(hardDeleteProduct("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
      /pasifleştir/i,
    );

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("throws when product is not found", async () => {
    getProductByIdMock.mockResolvedValue(null);
    await expect(hardDeleteProduct("00000000-0000-0000-0000-000000000002")).rejects.toThrow(
      /bulunamadı/i,
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("deletes DB row + storage objects + records irreversible audit", async () => {
    getProductByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000003",
      slug: "p3",
      code: "P-003",
      sector_id: "s1",
      images: [
        { path: "p3/abc.jpg", order: 0, alt_text: { tr: "" } },
        { path: "p3/def.jpg", order: 1, alt_text: { tr: "" } },
      ],
      active: false,
    });

    await hardDeleteProduct("00000000-0000-0000-0000-000000000003");

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(["p3/abc.jpg", "p3/def.jpg"]);

    expect(fromSpy).toHaveBeenCalledWith("products");
    expect(deleteSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000003");

    expect(recordAuditMock).toHaveBeenCalledTimes(1);
    const auditEntry = recordAuditMock.mock.calls[0]?.[0];
    expect(auditEntry).toMatchObject({
      action: "product_hard_deleted",
      entity_type: "product",
      entity_id: "00000000-0000-0000-0000-000000000003",
      user_id: "admin-uuid",
      ip: null,
    });
    expect(auditEntry.diff).toMatchObject({
      irreversible: true,
      snapshot: { slug: "p3", code: "P-003", image_count: 2 },
    });
  });

  it("continues DB delete even if storage cleanup fails (non-fatal)", async () => {
    getProductByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000004",
      slug: "p4",
      code: null,
      sector_id: null,
      images: [{ path: "p4/x.jpg", order: 0, alt_text: { tr: "" } }],
      active: false,
    });
    removeSpy.mockResolvedValueOnce({
      data: null,
      error: { message: "storage offline" },
    });

    await hardDeleteProduct("00000000-0000-0000-0000-000000000004");

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000004");
    expect(recordAuditMock).toHaveBeenCalledTimes(1);
  });

  it("skips storage cleanup when product has no images", async () => {
    getProductByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000005",
      slug: "p5",
      code: null,
      sector_id: null,
      images: [],
      active: false,
    });

    await hardDeleteProduct("00000000-0000-0000-0000-000000000005");

    expect(removeSpy).not.toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000005");
    expect(recordAuditMock).toHaveBeenCalledTimes(1);
  });
});
