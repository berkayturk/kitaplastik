// tests/e2e/admin-product-create.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "ADMIN_EMAIL/ADMIN_PASSWORD gerekli");

test("admin can create a product with TR-only content", async ({ page, context }) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products/new");
  await page.selectOption('select[id="sector"]', { index: 1 });
  await page.fill('input[id="name"]', `E2E Test Ürün ${Date.now()}`);
  await page.fill('textarea[id="description"]', "E2E açıklama");
  await page.click("text=+ Özellik Ekle");
  await page.click("role=option[name=/malzeme/i]");
  await page.fill('input[aria-label="Malzeme değeri"]', "PET");
  await page.click('button:has-text("Kaydet ve Yayınla")');
  await expect(page).toHaveURL(/\/admin\/products\?success=created/);
});
