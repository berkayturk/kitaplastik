import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  deleteSpy,
  eqIdSpy,
  eqActiveSpy,
  removeSpy,
  fromSpy,
  getReferenceByIdMock,
  recordAuditMock,
} = vi.hoisted(() => {
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
    eqActiveSpy.mockResolvedValue({ data: null, error: null, count: 1 });
    eqIdSpy.mockReturnValue({ eq: eqActiveSpy });
    deleteSpy.mockReturnValue({ eq: eqIdSpy });
    removeSpy.mockResolvedValue({ data: null, error: null });
    fromSpy.mockReturnValue({ delete: deleteSpy });
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

    await expect(
      hardDeleteReference("00000000-0000-0000-0000-000000000011", "client-a"),
    ).rejects.toThrow(/pasifleştir/i);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("throws when reference is not found", async () => {
    getReferenceByIdMock.mockResolvedValue(null);
    await expect(
      hardDeleteReference("00000000-0000-0000-0000-000000000012", "any"),
    ).rejects.toThrow(/bulunamadı/i);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("throws when confirm token does not match the reference key", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000031",
      key: "client-real-key",
      logo_path: "client-logos/r.svg",
      sector_id: null,
      active: false,
    });

    await expect(
      hardDeleteReference("00000000-0000-0000-0000-000000000031", "wrong-token"),
    ).rejects.toThrow(/onay/i);

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("deletes DB row first (atomic active=false guard) + storage logo after + records irreversible audit", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000013",
      key: "client-c",
      logo_path: "client-logos/clientc.svg",
      sector_id: "s1",
      active: false,
    });

    await hardDeleteReference("00000000-0000-0000-0000-000000000013", "client-c");

    expect(fromSpy).toHaveBeenCalledWith("clients");
    expect(deleteSpy).toHaveBeenCalledWith({ count: "exact" });
    expect(eqIdSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000013");
    expect(eqActiveSpy).toHaveBeenCalledWith("active", false);

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(["clientc.svg"]);

    const dbDeleteOrder = eqActiveSpy.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY;
    const storageRemoveOrder = removeSpy.mock.invocationCallOrder[0] ?? 0;
    expect(dbDeleteOrder).toBeLessThan(storageRemoveOrder);

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

  it("throws race error when DB delete affects zero rows (restore between read and write, or already gone)", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000020",
      key: "client-r",
      logo_path: "client-logos/r.svg",
      sector_id: null,
      active: false,
    });
    eqActiveSpy.mockResolvedValueOnce({ data: null, error: null, count: 0 });

    await expect(
      hardDeleteReference("00000000-0000-0000-0000-000000000020", "client-r"),
    ).rejects.toThrow(/silinemedi|aktif/i);

    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("does NOT call storage cleanup when DB delete fails", async () => {
    getReferenceByIdMock.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000021",
      key: "client-s",
      logo_path: "client-logos/s.svg",
      sector_id: null,
      active: false,
    });
    eqActiveSpy.mockResolvedValueOnce({
      data: null,
      error: { message: "RLS denied" },
      count: null,
    });

    await expect(
      hardDeleteReference("00000000-0000-0000-0000-000000000021", "client-s"),
    ).rejects.toThrow(/RLS denied/);

    expect(removeSpy).not.toHaveBeenCalled();
    expect(recordAuditMock).not.toHaveBeenCalled();
  });

  it("completes successfully even if post-DB storage cleanup fails (non-fatal)", async () => {
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

    await hardDeleteReference("00000000-0000-0000-0000-000000000014", "client-d");

    expect(eqActiveSpy).toHaveBeenCalledWith("active", false);
    expect(removeSpy).toHaveBeenCalledTimes(1);
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

    await hardDeleteReference("00000000-0000-0000-0000-000000000015", "client-e");

    expect(removeSpy).not.toHaveBeenCalled();
    expect(eqIdSpy).toHaveBeenCalledWith("id", "00000000-0000-0000-0000-000000000015");
    expect(eqActiveSpy).toHaveBeenCalledWith("active", false);
    expect(recordAuditMock).toHaveBeenCalledTimes(1);
  });
});
