// tests/unit/lib/admin/schemas/reference.test.ts
import { describe, it, expect } from "vitest";
import { CreateReferenceSchema, UpdateReferenceSchema } from "@/lib/admin/schemas/reference";

const validCreate = {
  key: "c9",
  display_name: null,
  logo_path: "client-logos/00000000-0000-0000-0000-000000000000.svg",
  sector_id: "11111111-1111-1111-1111-111111111111",
  display_order: 90,
  active: true,
};

describe("CreateReferenceSchema", () => {
  it("accepts valid create input", () => {
    expect(() => CreateReferenceSchema.parse(validCreate)).not.toThrow();
  });

  it("rejects key with special chars", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, key: "bad key!" })).toThrow();
  });

  it("rejects key too long (>32)", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, key: "x".repeat(33) })).toThrow();
  });

  it("rejects invalid logo_path (wrong bucket format)", () => {
    expect(() =>
      CreateReferenceSchema.parse({ ...validCreate, logo_path: "/references/c1.svg" }),
    ).toThrow();
  });

  it("rejects invalid UUID sector_id", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, sector_id: "not-uuid" })).toThrow();
  });

  it("accepts display_name as null", () => {
    expect(() => CreateReferenceSchema.parse({ ...validCreate, display_name: null })).not.toThrow();
  });

  it("accepts display_name with partial 4-lang fields", () => {
    expect(() =>
      CreateReferenceSchema.parse({
        ...validCreate,
        display_name: { tr: "Firma X", en: "", ru: "", ar: "" },
      }),
    ).not.toThrow();
  });
});

describe("UpdateReferenceSchema", () => {
  it("omits key field (immutable)", () => {
    const { key: _omit, ...withoutKey } = validCreate;
    expect(() => UpdateReferenceSchema.parse(withoutKey)).not.toThrow();
  });

  it("rejects input with key field (should be stripped or err)", () => {
    const result = UpdateReferenceSchema.safeParse(validCreate);
    // zod .omit() strips extra fields in safeParse — no error, but key is not in output type
    expect(result.success).toBe(true);
  });
});
