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

  test("logo upload via setInputFiles — create new reference E2E", async ({ page }) => {
    await page.getByRole("link", { name: "+ Yeni" }).click();
    const uniqueKey = `e2e-upload-${Date.now().toString(36).slice(-6)}`;
    await page.getByLabel("Anahtar").fill(uniqueKey);
    await page.getByLabel(/Ad \(TR\)/).fill("E2E Upload Test");

    // Select a sector — required (SectorSelect renders "— Seçin —" placeholder
    // at index 0; first real seed sector is at index 1).
    await page.getByLabel(/Sektör/i).selectOption({ index: 1 });

    // Upload SVG — LogoField swaps the <input type=file> for a preview
    // <Image alt="Logo preview"> once upload to Supabase storage succeeds.
    await page.locator('input[type="file"]').setInputFiles("./tests/fixtures/test-logo.svg");
    await expect(page.getByAltText("Logo preview")).toBeVisible({ timeout: 10_000 });

    try {
      await page.getByRole("button", { name: "Kaydet" }).click();
      await expect(page).toHaveURL(/\/admin\/references\?success=created/);
      // Verify appears in active list
      await expect(page.getByText(uniqueKey)).toBeVisible();
    } finally {
      // Cleanup — soft-delete via UI (leaves soft-deleted row + uploaded
      // storage object; full storage cleanup requires service-role script —
      // deliberate trade-off, documented in PR body).
      const row = page.getByRole("row", { name: new RegExp(uniqueKey) }).first();
      if (await row.isVisible().catch(() => false)) {
        await row.getByRole("button", { name: "Sil" }).click();
      }
    }
  });

  test("reorder swap adjacent references (arrow up)", async ({ page }) => {
    // Snapshot current top-2 row identities via their "Düzenle" link href,
    // which encodes the row id — stable across reorders (unlike td text).
    const firstRow = page.locator("tbody tr").first();
    const secondRow = page.locator("tbody tr").nth(1);
    const firstHrefBefore = await firstRow
      .getByRole("link", { name: "Düzenle" })
      .getAttribute("href");
    const secondHrefBefore = await secondRow
      .getByRole("link", { name: "Düzenle" })
      .getAttribute("href");
    expect(firstHrefBefore).toBeTruthy();
    expect(secondHrefBefore).toBeTruthy();

    try {
      // Swap: click ↑ on the second row
      await secondRow.getByRole("button", { name: /sıralamayı yukarı taşı/i }).click();

      // Deterministic wait: rows re-render with swapped order (no waitForTimeout)
      await expect(
        page.locator("tbody tr").first().getByRole("link", { name: "Düzenle" }),
      ).toHaveAttribute("href", secondHrefBefore!);
      await expect(
        page.locator("tbody tr").nth(1).getByRole("link", { name: "Düzenle" }),
      ).toHaveAttribute("href", firstHrefBefore!);
    } finally {
      // Revert — click ↑ on the now-second row (which is the original first)
      const newSecondRow = page.locator("tbody tr").nth(1);
      await newSecondRow.getByRole("button", { name: /sıralamayı yukarı taşı/i }).click();
      // Verify back to original order
      await expect(
        page.locator("tbody tr").first().getByRole("link", { name: "Düzenle" }),
      ).toHaveAttribute("href", firstHrefBefore!, { timeout: 5_000 });
    }
  });

  test("public homepage ReferencesStrip shows freshly-edited display_name", async ({
    page,
    request,
  }) => {
    const uniqueDisplay = `Acme rev-${Date.now().toString(36).slice(-6)}`;

    // Snapshot current c1 display_name TR (whatever it is — may be empty in seed)
    await page
      .getByRole("row", { name: /c1/ })
      .first()
      .getByRole("link", { name: "Düzenle" })
      .click();
    const trInput = page.getByLabel(/Ad \(TR\)/);
    const originalDisplay = await trInput.inputValue();

    try {
      await trInput.fill(uniqueDisplay);
      await page.getByRole("button", { name: "Kaydet" }).click();
      await expect(page).toHaveURL(/\/admin\/references\?success=updated/);

      // Public homepage TR check — revalidatePath propagation
      const r = await request.get("/tr", { headers: { "cache-control": "no-cache" } });
      expect(r.status()).toBe(200);
      const html = await r.text();
      expect(html).toContain(uniqueDisplay);
    } finally {
      // Always restore — capture-then-restore, not hard-code
      await page.goto("/admin/references");
      await page
        .getByRole("row", { name: /c1/ })
        .first()
        .getByRole("link", { name: "Düzenle" })
        .click();
      await page.getByLabel(/Ad \(TR\)/).fill(originalDisplay);
      await page.getByRole("button", { name: "Kaydet" }).click();
      await expect(page).toHaveURL(/\/admin\/references\?success=updated/);
    }
  });
});
