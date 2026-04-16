import { test, expect } from "@playwright/test";

test("404 sayfası anlamlı bir hata mesajı gösterir", async ({ page }) => {
  const response = await page.goto("/var-olmayan-sayfa");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/sayfa bulunamadı/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /anasayfaya dön/i })).toBeVisible();
});
