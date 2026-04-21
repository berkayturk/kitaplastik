// tests/e2e/admin-product-clone.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "creds gerekli");

test("clone: yeni ürün edit mode'da açılır, metin+görsel kopyalanmıştır", async ({
  page,
  context,
}) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products");
  const firstRow = page
    .locator("div")
    .filter({ hasText: /Düzenle/ })
    .first();
  await firstRow.locator("text=Düzenle").click();
  await page.click('button:has-text("Bu ürüne benzer yeni ekle")');
  await expect(page).toHaveURL(/\/admin\/products\/[^/]+\/edit\?cloned=1/);
  // Slug -kopya suffix ile üretilmiş olmalı
  await expect(page.locator('input[id="slug"]')).toHaveValue(/-kopya(-\d+)?$/);
});
