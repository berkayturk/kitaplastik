// tests/e2e/admin-product-delete-restore.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "creds gerekli");

test("soft delete → Silinmiş tab → restore → Yayında tab", async ({ page, context }) => {
  await loginAsAdmin({ page, context });
  await page.goto("/admin/products");
  const activeLabel = page.locator('button:has-text("Yayında")');
  const beforeText = await activeLabel.textContent();
  await page.locator('button[aria-label="Sil"]').first().click();
  await page.click('button:has-text("Evet, sil")');
  await page.click('button:has-text("Silinmiş")');
  await page.locator("text=Geri yükle").first().click();
  await page.click('button:has-text("Yayında")');
  const afterText = await activeLabel.textContent();
  expect(afterText).toBe(beforeText);
});
