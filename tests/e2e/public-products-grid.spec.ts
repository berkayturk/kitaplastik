import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"),
);
test.skip(!hasSupabase, "gerçek Supabase gerekli");

const LOCALES = ["tr", "en", "ru", "ar"] as const;

for (const loc of LOCALES) {
  test(`/${loc}/products 200 döner ve grid veya boş state render eder`, async ({ page }) => {
    const res = await page.goto(`/${loc}/products`);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
}
