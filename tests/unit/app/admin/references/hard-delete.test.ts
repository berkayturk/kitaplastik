import { describe, it, expect, vi, beforeEach } from "vitest";

const { deleteSpy, removeSpy, fromSpy, getReferenceByIdMock, recordAuditMock } = vi.hoisted(() => {
  const deleteSpy = vi.fn().mockResolvedValue({ data: null, error: null });
  const removeSpy = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromSpy = vi.fn();
  return {
    deleteSpy,
    removeSpy,
    fromSpy,
    getReferenceByIdMock: vi.fn(),
    recordAuditMock: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/admin/auth", () => ({
  requireAdminRole: vi.fn().mockResolvedValue({ id: "admin-uuid", email: "admin@kp.com" }),
}));

vi.mock("@/lib/admin/references", () => ({
  getReferenceById: getReferenceByIdMock,
  keyExists: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/admin/sectors", () => ({
  getSectorById: vi.fn().mockResolvedValue(null),
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

import { hardDeleteReference } from "@/app/admin/references/actions";

describe("hardDeleteReference — irreversible delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteSpy.mockResolvedValue({ data: null, error: null });
    removeSpy.mockResolvedValue({ data: null, error: null });
    fromSpy.mockReturnValue({
      delete: () => ({ eq: deleteSpy }),
    });
    recordAuditMock.mockResolvedValue(undefined);
  });

  it("throws when reference is still active (soft-delete required first)", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000011",
      key: "client-a",
      logo_path: "client-logos/a.svg",
      sector_id: "s1",
      active: true,
    });

    await expect(hardDeleteReference("00000000-0000-0000-0000-000000000011")).rejects.toThrow(
      /pasifleştir/i,
    );

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("throws when reference is not found", async () => {
    getReferenceByIdMock.mockResolvedValue(null);
    await expect(hardDeleteReference("00000000-0000-0000-0000-000000000012")).rejects.toThrow(
      /bulunamadı/i,
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("deletes DB row + storage logo + records irreversible audit", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000013",
      key: "client-c",
      logo_path: "client-logos/clientc.svg",
      sector_id: "s1",
      active: false,
    });

    await hardDeleteReference("00000000-0000-0000-0000-000000000013");

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(["clientc.svg"]);

    expect(fromSpy).toHaveBeenCalledWith("clients");
    expect(deleteSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000013");

    expect(recordAuditMock).toHaveBeenCalledTimes(1);
    const auditEntry = recordAuditMock.mock.calls[0]?.[0];
    expect(auditEntry).toMatchObject({
      action: "reference_hard_deleted",
      entity_type: "client",
      entity_id: "00000000-0000-0000-0000-000000000013",
      user_id: "admin-uuid",
      ip: null,
    });
    expect(auditEntry.diff).toMatchObject({
      irreversible: true,
      snapshot: { key: "client-c", logo_path: "client-logos/clientc.svg" },
    });
  });

  it("continues DB delete even if storage cleanup fails (non-fatal)", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000014",
      key: "client-d",
      logo_path: "client-logos/d.svg",
      sector_id: null,
      active: false,
    });
    removeSpy.mockResolvedValueOnce({
      data: null,
      error: { message: "storage offline" },
    });

    await hardDeleteReference("00000000-0000-0000-0000-000000000014");

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000014");
    expect(recordAuditMock).toHaveBeenCalledTimes(1);
  });

  it("skips storage cleanup when logo_path is external URL (not in client-logos bucket)", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000015",
      key: "client-e",
      logo_path: "/references/legacy.svg",
      sector_id: null,
      active: false,
    });

    await hardDeleteReference("00000000-0000-0000-0000-000000000015");

    expect(removeSpy).not.toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000015");
    expect(recordAuditMock).toHaveBeenCalledTimes(1);
  });
});
