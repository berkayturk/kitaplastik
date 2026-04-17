import { test, expect } from "@playwright/test";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

test.describe("i18n routing", () => {
  test("root redirects to a locale prefix", async ({ page }) => {
    // next-intl detects Accept-Language by default, so the exact locale
    // depends on the browser — but it MUST land on one of the 4 locales.
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.url()).toMatch(/\/(tr|en|ru|ar)\/?$/);
  });

  for (const locale of LOCALES) {
    test(`homepage renders for ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const expectedDir = locale === "ar" ? "rtl" : "ltr";
      await expect(page.locator("html")).toHaveAttribute("dir", expectedDir);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("LocaleSwitcher navigates to selected locale", async ({ page }) => {
    await page.goto("/tr");
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL(/\/en/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
