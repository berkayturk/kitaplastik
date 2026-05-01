import { test, expect } from "@playwright/test";

// Each test iterates multiple routes sequentially; raise per-test timeout
// beyond the 30s default so slow CI/dev-server warmup doesn't cause flakes.
const MULTI_ROUTE_TIMEOUT = 90_000;

test.describe("Pathname mapping — canonical URLs", () => {
  test("TR canonical URLs return 200", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const routes = [
      "/tr",
      "/tr/urunler",
      "/tr/urunler/cam-yikama",
      "/tr/urunler/otomotiv",
      "/tr/urunler/tekstil",
      "/tr/hakkimizda",
      "/tr/iletisim",
      "/tr/referanslar",
      "/tr/katalog",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });

  test("EN canonical URLs return 200", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const routes = [
      "/en",
      "/en/products",
      "/en/products/bottle-washing",
      "/en/products/automotive",
      "/en/products/textile",
      "/en/about",
      "/en/contact",
      "/en/references",
      "/en/catalog",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });

  test("RU canonical URLs return 200", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const routes = [
      "/ru",
      "/ru/produktsiya",
      "/ru/produktsiya/moyka-butylok",
      "/ru/produktsiya/avtoprom",
      "/ru/produktsiya/tekstil",
      "/ru/o-nas",
      "/ru/kontakty",
      "/ru/otzyvy",
      "/ru/katalog",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });

  test("AR canonical URLs return 200", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const routes = [
      "/ar",
      "/ar/al-muntajat",
      "/ar/al-muntajat/ghasil-zujajat",
      "/ar/al-muntajat/al-sayyarat",
      "/ar/al-muntajat/al-mansujat",
      "/ar/man-nahnu",
      "/ar/ittisal",
      "/ar/maraji",
      "/ar/al-katalog",
    ];
    for (const r of routes) {
      const response = await page.goto(r);
      expect(response?.status(), `Expected 200 for ${r}`).toBeLessThan(400);
    }
  });
});

test.describe("Pathname mapping — legacy redirects", () => {
  test("TR legacy EN-canonical → native (308)", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const pairs: Array<[string, string]> = [
      ["/tr/products", "/tr/urunler"],
      ["/tr/about", "/tr/hakkimizda"],
      ["/tr/contact", "/tr/iletisim"],
      ["/tr/references", "/tr/referanslar"],
      ["/tr/request-quote", "/tr/katalog"],
      // 2026-05-01: /sectors → /products taşıması
      ["/tr/sectors", "/tr/urunler"],
      ["/tr/sektorler", "/tr/urunler"],
      ["/tr/sectors/bottle-washing", "/tr/urunler/cam-yikama"],
      ["/tr/sektorler/cam-yikama", "/tr/urunler/cam-yikama"],
      ["/tr/sectors/automotive", "/tr/urunler/otomotiv"],
      ["/tr/sektorler/otomotiv", "/tr/urunler/otomotiv"],
      ["/tr/sectors/textile", "/tr/urunler/tekstil"],
      ["/tr/sektorler/tekstil", "/tr/urunler/tekstil"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("RU legacy EN-canonical → native (308)", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const pairs: Array<[string, string]> = [
      ["/ru/products", "/ru/produktsiya"],
      ["/ru/about", "/ru/o-nas"],
      ["/ru/contact", "/ru/kontakty"],
      ["/ru/request-quote", "/ru/katalog"],
      // 2026-05-01: /sectors → /products taşıması
      ["/ru/sectors", "/ru/produktsiya"],
      ["/ru/otrasli", "/ru/produktsiya"],
      ["/ru/sectors/bottle-washing", "/ru/produktsiya/moyka-butylok"],
      ["/ru/otrasli/moyka-butylok", "/ru/produktsiya/moyka-butylok"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("AR legacy EN-canonical → native (308)", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const pairs: Array<[string, string]> = [
      ["/ar/products", "/ar/al-muntajat"],
      ["/ar/about", "/ar/man-nahnu"],
      ["/ar/contact", "/ar/ittisal"],
      ["/ar/request-quote", "/ar/al-katalog"],
      // 2026-05-01: /sectors → /products taşıması
      ["/ar/sectors", "/ar/al-muntajat"],
      ["/ar/al-qitaat", "/ar/al-muntajat"],
      ["/ar/sectors/bottle-washing", "/ar/al-muntajat/ghasil-zujajat"],
      ["/ar/al-qitaat/ghasil-zujajat", "/ar/al-muntajat/ghasil-zujajat"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("EN legacy /sectors → /products (308)", async ({ page }) => {
    test.setTimeout(MULTI_ROUTE_TIMEOUT);
    const pairs: Array<[string, string]> = [
      ["/en/sectors", "/en/products"],
      ["/en/sectors/bottle-washing", "/en/products/bottle-washing"],
      ["/en/sectors/automotive", "/en/products/automotive"],
      ["/en/sectors/textile", "/en/products/textile"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("Plan 3 TR legacy → new canonical 1-hop", async ({ page }) => {
    const pairs: Array<[string, string]> = [
      ["/tr/teklif-iste", "/tr/katalog"],
      ["/tr/teklif-iste/ozel-uretim", "/tr/katalog"],
      ["/tr/teklif-iste/standart", "/tr/katalog"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });
});

test.describe("Pathname mapping — sitemap", () => {
  test("sitemap.xml contains native slugs", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("/tr/urunler");
    expect(body).toContain("/tr/urunler/cam-yikama");
    expect(body).toContain("/tr/katalog");
    expect(body).toContain("/ru/produktsiya");
    expect(body).toContain("/ru/produktsiya/moyka-butylok");
    expect(body).toContain("/ar/al-muntajat");
    expect(body).toContain("/ar/al-muntajat/ghasil-zujajat");
    expect(body).toContain("/en/products");
    expect(body).toContain("/en/products/bottle-washing");
    expect(body).toContain("/en/catalog");
  });
});
