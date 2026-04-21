import { test, expect } from "@playwright/test";

const hasRealSupabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL != null &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

test.describe("references", () => {
  test.skip(
    !hasRealSupabase,
    "Supabase placeholder (CI without real backend); production smoke covers this",
  );

  test("ReferencesStrip visible above the fold on 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tr");
    const strip = page.getByRole("heading", { name: /Bizi seçen markalar/ });
    await expect(strip).toBeVisible();
    const box = await strip.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(900);
  });

  test("clicking 'Tüm referanslar' navigates to /references", async ({ page }) => {
    await page.goto("/tr");
    await page.getByRole("link", { name: /Tüm referanslar/ }).click();
    await expect(page).toHaveURL(/\/references/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/references lists 8 client cards", async ({ page }) => {
    await page.goto("/tr/references");
    const cards = page.locator("article");
    await expect(cards).toHaveCount(8);
  });
});
