// tests/e2e/admin-product-edit.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "creds gerekli");

test("slug edit form'da default kilitli + toggle ile açılır + uyarı görünür", async ({
  page,
  context,
}) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products");
  await page.click("text=Düzenle");
  const slugInput = page.locator('input[id="slug"]');
  await expect(slugInput).toHaveAttribute("readonly", "");
  await page.click('button:has-text("Slug\'ı düzenle")');
  await expect(slugInput).not.toHaveAttribute("readonly", "");
  await expect(page.locator("text=URL değişir")).toBeVisible();
});
