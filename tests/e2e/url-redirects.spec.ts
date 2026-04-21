// tests/e2e/url-redirects.spec.ts
import { test, expect } from "@playwright/test";

const LOCALES = ["tr", "en", "ru", "ar"] as const;

const REDIRECTS: Array<[string, string]> = [
  ["/urunler", "/products"],
  ["/sektorler", "/sectors"],
  ["/sektorler/cam-yikama", "/sectors/bottle-washing"],
  ["/sektorler/kapak", "/sectors/caps"],
  ["/sektorler/tekstil", "/sectors/textile"],
  ["/hakkimizda", "/about"],
  ["/iletisim", "/contact"],
  ["/referanslar", "/references"],
  ["/teklif-iste", "/request-quote"],
  ["/teklif-iste/ozel-uretim", "/request-quote/custom"],
  ["/teklif-iste/standart", "/request-quote/standard"],
];

test.describe("Plan 4a: public URL 301 redirects", () => {
  for (const locale of LOCALES) {
    for (const [oldPath, newPath] of REDIRECTS) {
      const oldUrl = `/${locale}${oldPath}`;
      const newUrl = `/${locale}${newPath}`;

      test(`${oldUrl} → ${newUrl}`, async ({ page }) => {
        const response = await page.goto(oldUrl, {
          waitUntil: "domcontentloaded",
        });
        // Redirect sonrası yeni URL'de settled olmalı
        expect(page.url()).toContain(newUrl);
        // Yeni URL 2xx response dönmeli
        expect(response?.status()).toBeGreaterThanOrEqual(200);
        expect(response?.status()).toBeLessThan(300);
      });
    }
  }
});

test("admin: /admin/ayarlar/bildirimler → /admin/settings/notifications", async ({ page }) => {
  await page.goto("/admin/ayarlar/bildirimler", {
    waitUntil: "domcontentloaded",
  });
  // page.url() = post-navigation settled URL (response.url() redirect chain'in
  // ilk URL'sini döner, yanıltıcı)
  expect(page.url()).toMatch(/\/admin\/(settings\/notifications|login)/);
});
