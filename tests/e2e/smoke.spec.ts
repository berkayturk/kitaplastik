import { test, expect } from "@playwright/test";

test.describe("Anasayfa smoke", () => {
  test("anasayfa açılır ve marka adı görünür", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kıta Plastik");
  });

  test("1989 etiketi görünür", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/1989'dan beri/i)).toBeVisible();
  });
});
