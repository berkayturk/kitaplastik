import { describe, it, expect, vi, beforeEach } from "vitest";

const { deleteSpy, eqIdSpy, eqActiveSpy, removeSpy, fromSpy, getProductByIdMock, recordAuditMock } =
  vi.hoisted(() => {
    const eqActiveSpy = vi.fn().mockResolvedValue({ data: null, error: null, count: 1 });
    const eqIdSpy = vi.fn().mockReturnValue({ eq: eqActiveSpy });
    const deleteSpy = vi.fn().mockReturnValue({ eq: eqIdSpy });
    const removeSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    const fromSpy = vi.fn();
    return {
      deleteSpy,
      eqIdSpy,
      eqActiveSpy,
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
    eqActiveSpy.mockResolvedValue({ data: null, error: null, count: 1 });
    eqIdSpy.mockReturnValue({ eq: eqActiveSpy });
    deleteSpy.mockReturnValue({ eq: eqIdSpy });
    removeSpy.mockResolvedValue({ data: null, error: null });
    fromSpy.mockReturnValue({ delete: deleteSpy });
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

  it("deletes DB row first (atomic active=false guard) + storage objects after + records irreversible audit", async () => {
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

    expect(fromSpy).toHaveBeenCalledWith("products");
    expect(deleteSpy).toHaveBeenCalledWith({ count: "exact" });
    expect(eqIdSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000003");
    expect(eqActiveSpy).toHaveBeenCalledWith("active", false);

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(["p3/abc.jpg", "p3/def.jpg"]);

    const dbDeleteOrder = eqActiveSpy.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY;
    const storageRemoveOrder = removeSpy.mock.invocationCallOrder[0] ?? 0;
    expect(dbDeleteOrder).toBeLessThan(storageRemoveOrder);

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

  it("throws race error when DB delete affects zero rows (restore between read and write, or already gone)", async () => {
    getProductByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000010",
      slug: "p10",
      code: null,
      sector_id: null,
      images: [{ path: "p10/x.jpg", order: 0, alt_text: { tr: "" } }],
      active: false,
    });
    eqActiveSpy.mockResolvedValueOnce({ data: null, error: null, count: 0 });

    await expect(hardDeleteProduct("00000000-0000-0000-0000-000000000010")).rejects.toThrow(
      /silinemedi|aktif/i,
    );

    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("does NOT call storage cleanup when DB delete fails", async () => {
    getProductByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000011",
      slug: "p11",
      code: null,
      sector_id: null,
      images: [{ path: "p11/y.jpg", order: 0, alt_text: { tr: "" } }],
      active: false,
    });
    eqActiveSpy.mockResolvedValueOnce({
      data: null,
      error: { message: "RLS denied" },
      count: null,
    });

    await expect(hardDeleteProduct("00000000-0000-0000-0000-000000000011")).rejects.toThrow(
      /RLS denied/,
    );

    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("completes successfully even if post-DB storage cleanup fails (non-fatal)", async () => {
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

    expect(eqActiveSpy).toHaveBeenCalledWith("active", false);
    expect(removeSpy).toHaveBeenCalledTimes(1);
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
    expect(eqIdSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000005");
    expect(eqActiveSpy).toHaveBeenCalledWith("active", false);
    expect(recordAuditMock).toHaveBeenCalledTimes(1);
  });
});
