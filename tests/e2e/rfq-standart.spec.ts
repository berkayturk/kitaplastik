// tests/e2e/rfq-standart.spec.ts
import { test, expect } from "@playwright/test";

test("standart RFQ submits with one product row", async ({ page }) => {
  await page.goto("/tr/teklif-iste/standart");

  // First product row is pre-rendered with empty slug; fill it.
  await page.getByPlaceholder("Ürün adı / kodu").first().fill("kapak-33mm");

  await page.fill('input[name="name"]', "Test");
  await page.fill('input[name="company"]', "TestCo");
  await page.fill('input[name="email"]', "t@t.co");
  await page.fill('input[name="phone"]', "+905551112233");
  await page.fill('input[name="country"]', "TR");
  await page.check('input[name="consent"]');

  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15_000 });
  await page.click('button[type="submit"]');
  await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
});
