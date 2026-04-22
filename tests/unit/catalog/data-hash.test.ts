import { describe, it, expect } from "vitest";
import { computeDataHash } from "@/lib/catalog/hash";

type Row = { updated_at: string };

describe("computeDataHash", () => {
  it("returns empty string for empty set (cache skip signal)", () => {
    expect(computeDataHash([])).toBe("");
  });

  it("is deterministic for the same max(updated_at)", () => {
    const a: Row[] = [{ updated_at: "2026-04-20T10:00:00Z" }];
    const b: Row[] = [{ updated_at: "2026-04-20T10:00:00Z" }];
    expect(computeDataHash(a as never)).toBe(computeDataHash(b as never));
  });

  it("depends only on the most recent updated_at (order-insensitive)", () => {
    const sorted: Row[] = [
      { updated_at: "2026-04-19T09:00:00Z" },
      { updated_at: "2026-04-20T09:00:00Z" },
      { updated_at: "2026-04-21T09:00:00Z" },
    ];
    const shuffled: Row[] = [sorted[2]!, sorted[0]!, sorted[1]!];
    expect(computeDataHash(sorted as never)).toBe(computeDataHash(shuffled as never));
  });

  it("rotates when the most recent updated_at advances", () => {
    const v1: Row[] = [{ updated_at: "2026-04-20T10:00:00Z" }];
    const v2: Row[] = [{ updated_at: "2026-04-20T10:00:01Z" }];
    expect(computeDataHash(v1 as never)).not.toBe(computeDataHash(v2 as never));
  });

  it("produces a hex digest of 16 characters", () => {
    const h = computeDataHash([{ updated_at: "2026-04-20T10:00:00Z" }] as never);
    expect(h).toMatch(/^[0-9a-f]{16}$/);
  });
});
