import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

describe("references data (supabase-backed)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("maps rows to Reference[] on getReferences()", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                order: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "1",
                        key: "c1",
                        logo_path: "/references/c1.svg",
                        sector_key: "camYikama",
                        display_name: null,
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          }),
        }),
      }),
    }));
    const { getReferences } = await import("@/lib/references/data");
    const refs = await getReferences();
    expect(refs[0]).toEqual({
      id: "1",
      key: "c1",
      logoPath: "/references/c1.svg",
      sectorKey: "camYikama",
      displayName: null,
    });
  });

  it("returns [] on db error", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                order: () => Promise.resolve({ data: null, error: { message: "x" } }),
              }),
            }),
          }),
        }),
      }),
    }));
    const { getReferences } = await import("@/lib/references/data");
    await expect(getReferences()).resolves.toEqual([]);
  });

  it("getReferencesBySector filters by sectorKey", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => ({
                order: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "1",
                        key: "c1",
                        logo_path: "/references/c1.svg",
                        sector_key: "camYikama",
                        display_name: null,
                      },
                      {
                        id: "2",
                        key: "c2",
                        logo_path: "/references/c2.svg",
                        sector_key: "otomotiv",
                        display_name: null,
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          }),
        }),
      }),
    }));
    const { getReferencesBySector } = await import("@/lib/references/data");
    const refs = await getReferencesBySector("otomotiv");
    expect(refs).toHaveLength(1);
    expect(refs[0]!.key).toBe("c2");
  });
});
