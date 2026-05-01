import { test, expect } from "@playwright/test";

// Per-locale native canonical slugs.
// 2026-05-01: /sectors → /products kategori taşıması (sektörler /products altında).
const NATIVE_ROUTES: Record<string, string[]> = {
  en: [
    "/",
    "/products",
    "/products/bottle-washing",
    "/products/automotive",
    "/products/textile",
    "/about",
    "/contact",
    "/references",
  ],
  tr: [
    "/",
    "/urunler",
    "/urunler/cam-yikama",
    "/urunler/otomotiv",
    "/urunler/tekstil",
    "/hakkimizda",
    "/iletisim",
    "/referanslar",
  ],
  ru: [
    "/",
    "/produktsiya",
    "/produktsiya/moyka-butylok",
    "/produktsiya/avtoprom",
    "/produktsiya/tekstil",
    "/o-nas",
    "/kontakty",
    "/otzyvy",
  ],
  ar: [
    "/",
    "/al-muntajat",
    "/al-muntajat/ghasil-zujajat",
    "/al-muntajat/al-sayyarat",
    "/al-muntajat/al-mansujat",
    "/man-nahnu",
    "/ittisal",
    "/maraji",
  ],
};

const LOCALES = ["tr", "en", "ru", "ar"];

test.describe("public pages smoke", () => {
  for (const locale of LOCALES) {
    const routes = NATIVE_ROUTES[locale] ?? [];
    for (const route of routes) {
      test(`${locale}${route} returns 200 and has h1`, async ({ page }) => {
        const response = await page.goto(`/${locale}${route === "/" ? "" : route}`);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1").first()).toBeVisible();
      });
    }
  }
});
