import { test, expect } from "@playwright/test";

test("standart RFQ ürün picker: aranan yok → özel üretim formuna link gösterir", async ({
  page,
}) => {
  await page.goto("/tr/request-quote/standart");
  await page.click("text=+ Ürün Ekle");
  await page.fill('input[aria-label="Ürün ara"]', "bu-urun-kesin-yoktur-" + Date.now());
  await expect(page.locator("text=Özel üretim talep formundan")).toBeVisible();
  const link = page.locator('a:has-text("Özel üretim talep formundan")');
  await expect(link).toHaveAttribute(
    "href",
    /\/request-quote\/ozel-uretim|\/teklif-iste\/ozel-uretim/,
  );
});
