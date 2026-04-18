// tests/e2e/rfq-custom.spec.ts
import { test, expect } from "@playwright/test";

test("custom RFQ submits successfully", async ({ page }) => {
  await page.goto("/tr/teklif-iste/ozel-uretim");

  await page.fill('input[name="name"]', "Test Mühendis");
  await page.fill('input[name="company"]', "TestCo");
  await page.fill('input[name="email"]', "eng@test.co");
  await page.fill('input[name="phone"]', "+905551112233");
  await page.fill('input[name="country"]', "TR");
  await page.selectOption('select[name="sector"]', "kapak");
  await page.fill(
    'textarea[name="description"]',
    "Plastik enjeksiyon ile üretilecek 33mm geniş bir kapak tasarımı için tedarikçi arıyoruz; yıllık 50k adet planlanıyor ve ISO sertifikalı üretici tercih edilecektir.",
  );
  await page.selectOption('select[name="annualVolume"]', "50k");
  await page.selectOption('select[name="tolerance"]', "medium");
  await page.check('input[name="consent"]');

  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15_000 });
  await page.click('button[type="submit"]');
  await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
});
