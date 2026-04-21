import { describe, it, expect, vi } from "vitest";
import { uniqueSlug } from "@/lib/utils/unique-slug";

describe("uniqueSlug", () => {
  it("slug free ise olduğu gibi döner", async () => {
    const exists = vi.fn(async () => false);
    expect(await uniqueSlug("pet-kapak", exists)).toBe("pet-kapak");
    expect(exists).toHaveBeenCalledWith("pet-kapak");
  });

  it("slug alınmışsa -2, -3 suffix dener", async () => {
    const taken = new Set(["pet-kapak", "pet-kapak-2"]);
    const exists = vi.fn(async (s: string) => taken.has(s));
    expect(await uniqueSlug("pet-kapak", exists)).toBe("pet-kapak-3");
  });

  it("çok fazla collision'da anlamlı hata fırlatır", async () => {
    const exists = vi.fn(async () => true);
    await expect(uniqueSlug("x", exists, { maxAttempts: 3 })).rejects.toThrow(/unique slug/i);
  });
});
