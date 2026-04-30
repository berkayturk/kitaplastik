import { test, expect } from "@playwright/test";

// Per-locale native canonical slugs (Plan 4d). EN stays unchanged.
const NATIVE_ROUTES: Record<string, string[]> = {
  en: [
    "/",
    "/sectors",
    "/sectors/bottle-washing",
    "/sectors/automotive",
    "/sectors/textile",
    "/products",
    "/about",
    "/contact",
    "/references",
  ],
  tr: [
    "/",
    "/sektorler",
    "/sektorler/cam-yikama",
    "/sektorler/otomotiv",
    "/sektorler/tekstil",
    "/urunler",
    "/hakkimizda",
    "/iletisim",
    "/referanslar",
  ],
  ru: [
    "/",
    "/otrasli",
    "/otrasli/moyka-butylok",
    "/otrasli/avtoprom",
    "/otrasli/tekstil",
    "/produktsiya",
    "/o-nas",
    "/kontakty",
    "/otzyvy",
  ],
  ar: [
    "/",
    "/al-qitaat",
    "/al-qitaat/ghasil-zujajat",
    "/al-qitaat/al-sayyarat",
    "/al-qitaat/al-mansujat",
    "/al-muntajat",
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
