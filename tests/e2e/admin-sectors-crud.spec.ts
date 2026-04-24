// tests/e2e/admin-sectors-crud.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin, hasAdminCreds } from "./helpers/admin-login";

test.skip(!hasAdminCreds(), "ADMIN_EMAIL/ADMIN_PASSWORD gerekli");

test.describe("Admin sectors CRUD", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/sectors");
  });

  test("lists 3 seed sectors", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sektörler" })).toBeVisible();
    await expect(page.getByText("cam-yikama")).toBeVisible();
    await expect(page.getByText("kapak")).toBeVisible();
    await expect(page.getByText("tekstil")).toBeVisible();
  });

  test("edits cam-yikama TR name and sees success toast", async ({ page }) => {
    await page
      .getByRole("row", { name: /cam-yikama/ })
      .getByRole("link", { name: "Düzenle" })
      .click();
    await expect(page.getByLabel(/Ad \(TR\)/)).toHaveValue("Cam Yıkama");
    const newName = `Cam Yıkama — E2E ${Date.now()}`;
    await page.getByLabel(/Ad \(TR\)/).fill(newName);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/admin\/sectors\?success=updated/);
    await expect(page.getByText(newName)).toBeVisible();
  });

  test("public EN pathname /en/sectors/bottle-washing still returns 200", async ({ request }) => {
    const r = await request.get("/en/sectors/bottle-washing");
    expect(r.status()).toBe(200);
  });

  test("public TR pathname /tr/sektorler/cam-yikama still returns 200", async ({ request }) => {
    const r = await request.get("/tr/sektorler/cam-yikama");
    expect(r.status()).toBe(200);
  });

  test("public TR pathname shows freshly-edited TR name (revalidation)", async ({
    page,
    request,
  }) => {
    const uniqueLabel = `Cam Yıkama — rev-${Date.now()}`;
    // Edit
    await page.goto("/admin/sectors");
    await page
      .getByRole("row", { name: /cam-yikama/ })
      .getByRole("link", { name: "Düzenle" })
      .click();
    await page.getByLabel(/Ad \(TR\)/).fill(uniqueLabel);
    await page.getByRole("button", { name: "Kaydet" }).click();
    await expect(page).toHaveURL(/\/admin\/sectors\?success=updated/);

    // Public fresh render — revalidatePath propagation
    const r = await request.get("/tr/sektorler/cam-yikama", {
      headers: { "cache-control": "no-cache" },
    });
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toContain(uniqueLabel);

    // Revert for next test idempotency
    await page.goto("/admin/sectors");
    await page
      .getByRole("row", { name: /cam-yikama/ })
      .getByRole("link", { name: "Düzenle" })
      .click();
    await page.getByLabel(/Ad \(TR\)/).fill("Cam Yıkama");
    await page.getByRole("button", { name: "Kaydet" }).click();
  });
});
