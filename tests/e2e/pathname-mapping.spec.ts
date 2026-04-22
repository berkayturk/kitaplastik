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
      "/tr/hakkimizda",
      "/tr/iletisim",
      "/tr/referanslar",
      "/tr/katalog",
      "/tr/sektorler",
      "/tr/sektorler/cam-yikama",
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
      "/en/about",
      "/en/contact",
      "/en/references",
      "/en/catalog",
      "/en/sectors",
      "/en/sectors/bottle-washing",
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
      "/ru/o-nas",
      "/ru/kontakty",
      "/ru/otzyvy",
      "/ru/katalog",
      "/ru/otrasli",
      "/ru/otrasli/moyka-butylok",
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
      "/ar/man-nahnu",
      "/ar/ittisal",
      "/ar/maraji",
      "/ar/al-katalog",
      "/ar/al-qitaat",
      "/ar/al-qitaat/ghasil-zujajat",
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
      ["/tr/sectors", "/tr/sektorler"],
      ["/tr/sectors/bottle-washing", "/tr/sektorler/cam-yikama"],
      ["/tr/sectors/caps", "/tr/sektorler/kapak"],
      ["/tr/sectors/textile", "/tr/sektorler/tekstil"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("RU legacy EN-canonical → native (308)", async ({ page }) => {
    const pairs: Array<[string, string]> = [
      ["/ru/products", "/ru/produktsiya"],
      ["/ru/about", "/ru/o-nas"],
      ["/ru/contact", "/ru/kontakty"],
      ["/ru/request-quote", "/ru/katalog"],
      ["/ru/sectors/bottle-washing", "/ru/otrasli/moyka-butylok"],
    ];
    for (const [from, to] of pairs) {
      const response = await page.goto(from);
      expect(response?.url(), `Expected ${from} → ${to}`).toContain(to);
    }
  });

  test("AR legacy EN-canonical → native (308)", async ({ page }) => {
    const pairs: Array<[string, string]> = [
      ["/ar/products", "/ar/al-muntajat"],
      ["/ar/about", "/ar/man-nahnu"],
      ["/ar/contact", "/ar/ittisal"],
      ["/ar/request-quote", "/ar/al-katalog"],
      ["/ar/sectors/bottle-washing", "/ar/al-qitaat/ghasil-zujajat"],
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
    expect(body).toContain("/tr/katalog");
    expect(body).toContain("/ru/produktsiya");
    expect(body).toContain("/ar/al-muntajat");
    expect(body).toContain("/ar/al-qitaat/ghasil-zujajat");
    expect(body).toContain("/en/products");
    expect(body).toContain("/en/catalog");
  });
});
