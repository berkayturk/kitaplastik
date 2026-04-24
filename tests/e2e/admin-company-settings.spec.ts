// tests/e2e/admin-company-settings.spec.ts
import { test, expect } from "@playwright/test";
import { hasAdminCreds, loginAsAdmin } from "./helpers/admin-login";

test.describe("Admin company settings", () => {
  test.skip(!hasAdminCreds(), "admin creds not set — skipping in CI");

  test("renders form + edits phone + public reflects", async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/settings/company");

    await expect(page.getByRole("heading", { name: /şirket bilgileri/i })).toBeVisible();

    const phoneDisplayInput = page.getByLabel(/sabit hat \(görünen\)/i);
    const original = await phoneDisplayInput.inputValue();
    const testValue = "+90 224 111 11 11";

    await phoneDisplayInput.fill(testValue);
    await page.getByRole("button", { name: /kaydet/i }).click();

    await page.waitForURL(/\/admin\/settings\/company\?success=updated/);
    await expect(phoneDisplayInput).toHaveValue(testValue);

    // Public reflect — revalidatePath propagation
    await page.goto("/tr/iletisim");
    await expect(page.getByText(testValue)).toBeVisible({ timeout: 10_000 });

    // Revert to keep prod clean
    await page.goto("/admin/settings/company");
    await phoneDisplayInput.fill(original);
    await page.getByRole("button", { name: /kaydet/i }).click();
    await page.waitForURL(/success=updated/);
  });

  test("client-side zod validation blocks submit on invalid email", async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/settings/company");
    // Mark a change so isDirty=true
    const originalBrand = await page.getByLabel(/marka adı/i).inputValue();
    await page.getByLabel(/marka adı/i).fill(originalBrand + " ");
    // Now break email format
    await page
      .getByLabel(/Birincil/i)
      .first()
      .fill("not-an-email");
    // Submit button should be disabled (RHF resolver catches it client-side)
    const submit = page.getByRole("button", { name: /kaydet/i });
    await expect(submit).toBeDisabled();
    // Reset (revert both edits)
    await page
      .getByLabel(/Birincil/i)
      .first()
      .fill("info@kitaplastik.com");
    await page.getByLabel(/marka adı/i).fill(originalBrand);
  });
});
