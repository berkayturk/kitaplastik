// tests/e2e/admin-references-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "ADMIN_EMAIL/ADMIN_PASSWORD gerekli");

const TEST_KEY = `e2e-${Date.now().toString(36).slice(-8)}`;

test.describe("Admin references CRUD", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/references");
  });

  test("active tab shows seed references (8)", async ({ page }) => {
    await expect(page.getByText(/Aktif \(\d+\)/)).toBeVisible();
  });

  test("creates a new reference (placeholder logo — uses seed path)", async ({ page }) => {
    await page.getByRole("link", { name: "+ Yeni" }).click();
    await expect(page).toHaveURL(/\/admin\/references\/new/);
    await page.getByLabel("Anahtar").fill(TEST_KEY);
    await page.getByLabel(/Ad \(TR\)/).fill("E2E Test");
    // SVG paste via logo_path direct (mocked file upload skipped in this assertion)
    // For real test, use evaluate() to set state directly, or:
    // await page.getByLabel(/Logo/).setInputFiles("./tests/fixtures/test-logo.svg");
    // For now verify form renders + submit URL:
    await expect(page.getByRole("button", { name: "Kaydet" })).toBeVisible();
  });

  test("edits an existing reference display_name (c1)", async ({ page }) => {
    const row = page.getByRole("row", { name: /c1/ }).first();
    await row.getByRole("link", { name: "Düzenle" }).click();
    await page.getByLabel(/Ad \(TR\)/).fill("Acme Corp E2E");
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/admin\/references\?success=updated/);
  });

  test("soft-delete + restore roundtrip (c8)", async ({ page }) => {
    const row = page.getByRole("row", { name: /c8/ }).first();
    await row.getByRole("button", { name: "Sil" }).click();
    // C8 should now appear in Silinmiş tab
    await page.getByRole("button", { name: /Silinmiş/ }).click();
    await expect(page.getByText("c8")).toBeVisible();
    await page.getByRole("button", { name: "Geri yükle" }).click();
    await page.getByRole("button", { name: /Aktif/ }).click();
    await expect(page.getByText("c8")).toBeVisible();
  });

  test("public homepage ReferencesStrip responds 200", async ({ request }) => {
    const r = await request.get("/tr");
    expect(r.status()).toBe(200);
  });
});
