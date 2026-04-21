import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/sectors",
  "/sectors/bottle-washing",
  "/sectors/caps",
  "/sectors/textile",
  "/products",
  "/about",
  "/contact",
  "/references",
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
