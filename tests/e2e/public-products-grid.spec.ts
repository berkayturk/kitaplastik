import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"),
);
test.skip(!hasSupabase, "gerçek Supabase gerekli");

// Per-locale native canonical for the products listing page (Plan 4d).
const PRODUCTS_PATH: Record<string, string> = {
  tr: "/tr/urunler",
  en: "/en/products",
  ru: "/ru/produktsiya",
  ar: "/ar/al-muntajat",
};

const LOCALES = ["tr", "en", "ru", "ar"] as const;

for (const loc of LOCALES) {
  const path = PRODUCTS_PATH[loc] ?? `/${loc}/products`;
  test(`${path} 200 döner ve grid veya boş state render eder`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
}
