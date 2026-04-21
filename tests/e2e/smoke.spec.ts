import { test, expect } from "@playwright/test";

test.describe("Anasayfa smoke", () => {
  test("anasayfa açılır ve marka adı görünür", async ({ page }) => {
    await page.goto("/tr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("mühendislik partneri");
  });

  test("1989 etiketi görünür", async ({ page }) => {
    await page.goto("/tr");
    await expect(page.getByText(/1989'dan beri/i).first()).toBeVisible();
  });

  test("3 sektör kartı görünür", async ({ page }) => {
    await page.goto("/tr");
    await expect(page.getByText(/cam yıkama/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /kapak/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /tekstil/i }).first()).toBeVisible();
  });

  test("footer şirket bilgisi görünür", async ({ page }) => {
    await page.goto("/tr");
    // Match the actual legal name in the footer (Turkish ı is not folded by JS /i flag)
    await expect(
      page.getByText("Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.").first(),
    ).toBeVisible();
  });
});
