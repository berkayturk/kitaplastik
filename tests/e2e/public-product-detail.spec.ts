import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"),
);
test.skip(!hasSupabase, "gerçek Supabase gerekli");

test("ürün detay: Schema.org Product + alt text auto-fallback", async ({ page }) => {
  await page.goto("/tr/products");
  const firstCard = page.locator("a[href*='/products/']").first();
  const cardCount = await firstCard.count();
  if (cardCount === 0) test.skip(true, "canlıda ürün yok");
  await firstCard.click();

  const ldJson = await page.locator('script[type="application/ld+json"]').textContent();
  expect(ldJson).toContain('"@type":"Product"');

  const h1 = await page.locator("h1").textContent();
  if (h1) {
    const mainAlt = await page.locator("article img").first().getAttribute("alt");
    expect(mainAlt).toContain(h1.trim());
  }
});
