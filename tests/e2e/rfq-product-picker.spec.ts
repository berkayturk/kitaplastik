import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder"),
);
test.skip(!hasSupabase, "gerçek Supabase gerekli");

test("standart RFQ ürün picker: aranan yok → özel üretim formuna link gösterir", async ({
  page,
}) => {
  await page.goto("/tr/request-quote/standard");
  // Form zaten bir boş picker satırı ile açılır; ekstra ekleme gerekmez
  await page
    .locator('input[aria-label="Ürün ara"]')
    .first()
    .fill("bu-urun-kesin-yoktur-" + Date.now());
  await expect(page.locator("text=Özel üretim talep formundan")).toBeVisible();
  const link = page.locator('a:has-text("Özel üretim talep formundan")');
  await expect(link).toHaveAttribute(
    "href",
    /\/request-quote\/ozel-uretim|\/teklif-iste\/ozel-uretim/,
  );
});
