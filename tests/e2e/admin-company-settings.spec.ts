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

    const brandInput = page.getByLabel(/marka adı/i);
    // Exact match "Birincil" (email) — avoids collision with "Birincil URL" (web)
    const emailPrimaryInput = page.getByLabel(/^Birincil$/i).first();
    const originalBrand = await brandInput.inputValue();
    const originalEmail = await emailPrimaryInput.inputValue();

    try {
      // Mark form dirty then invalidate email so RHF/zod disables submit
      await brandInput.fill(originalBrand + " ");
      await emailPrimaryInput.fill("not-an-email");
      const submit = page.getByRole("button", { name: /kaydet/i });
      await expect(submit).toBeDisabled();
    } finally {
      // Reset both fields back to captured originals — no server submit
      // occurs (we never saved), so resetting in-memory state is enough.
      await brandInput.fill(originalBrand);
      await emailPrimaryInput.fill(originalEmail);
    }
  });
});
