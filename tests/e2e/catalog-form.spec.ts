import { test, expect } from "@playwright/test";

// Smoke coverage for the sector selector added in the dynamic-catalog
// rollout. We intentionally do NOT submit the form here — submitting
// would hit Resend / the DB in CI and burn the per-IP rate budget.
// Submission path is exercised by existing integration + unit tests.

test.describe("catalog request form — sector selector", () => {
  test("renders all sector options with 'all' as default", async ({ page }) => {
    await page.goto("/tr/katalog");

    const sector = page.locator('select[name="sector"]');
    await expect(sector).toBeVisible();
    await expect(sector).toHaveValue("all");

    const options = await sector
      .locator("option")
      .evaluateAll((nodes) => (nodes as HTMLOptionElement[]).map((o) => o.value));
    expect(options.sort()).toEqual(["all", "cam-yikama", "otomotiv", "tekstil"].sort());
  });

  test("sector is user-editable", async ({ page }) => {
    await page.goto("/en/catalog");
    const sector = page.locator('select[name="sector"]');
    await sector.selectOption("otomotiv");
    await expect(sector).toHaveValue("otomotiv");
  });
});
