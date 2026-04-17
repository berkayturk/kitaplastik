import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/sektorler",
  "/sektorler/cam-yikama",
  "/sektorler/kapak",
  "/sektorler/tekstil",
  "/urunler",
  "/hakkimizda",
  "/iletisim",
  "/referanslar",
];

const LOCALES = ["tr", "en", "ru", "ar"];

test.describe("public pages smoke", () => {
  for (const locale of LOCALES) {
    for (const route of PUBLIC_ROUTES) {
      test(`${locale}${route} returns 200 and has h1`, async ({ page }) => {
        const response = await page.goto(`/${locale}${route === "/" ? "" : route}`);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1").first()).toBeVisible();
      });
    }
  }
});
