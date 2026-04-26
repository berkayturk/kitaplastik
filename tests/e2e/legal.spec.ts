import { test, expect } from "@playwright/test";

const cases = [
  {
    locale: "tr",
    privacyPath: "/tr/yasal/gizlilik",
    cookiesPath: "/tr/yasal/cerezler",
    privacyTitle: /Gizlilik Politikası/,
    cookiesTitle: /Çerez Politikası/,
    disclaimerKeyword: /Yayın tarihi|Son güncelleme/,
  },
  {
    locale: "en",
    privacyPath: "/en/legal/privacy",
    cookiesPath: "/en/legal/cookies",
    privacyTitle: /Privacy Policy/i,
    cookiesTitle: /Cookie Policy/i,
    disclaimerKeyword: /Published|Last updated/i,
  },
  {
    locale: "ru",
    privacyPath: "/ru/pravovaya/konfidentsialnost",
    cookiesPath: "/ru/pravovaya/kuki",
    privacyTitle: /Политика конфиденциальности/i,
    cookiesTitle: /Политика использования файлов cookie/i,
    disclaimerKeyword: /Опубликовано|Последнее обновление/i,
  },
  {
    locale: "ar",
    privacyPath: "/ar/qanuni/khususiyya",
    cookiesPath: "/ar/qanuni/kuki",
    privacyTitle: /سياسة الخصوصية/,
    cookiesTitle: /سياسة ملفات تعريف الارتباط/,
    disclaimerKeyword: /تاريخ النشر|آخر تحديث/,
  },
];

for (const c of cases) {
  test(`${c.locale} privacy page: 200 + h1 + disclaimer`, async ({ page }) => {
    const res = await page.goto(c.privacyPath);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText(c.privacyTitle);
    await expect(page.getByTestId("legal-disclaimer")).toBeVisible();
  });

  test(`${c.locale} cookies page: 200 + h1 + inventory table`, async ({ page }) => {
    const res = await page.goto(c.cookiesPath);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText(c.cookiesTitle);
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByText("NEXT_LOCALE")).toBeVisible();
  });
}

test("footer privacy link round-trip (TR)", async ({ page }) => {
  await page.goto("/tr");
  const link = page.locator("footer").getByRole("link", { name: /Gizlilik Politikası/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/tr\/yasal\/gizlilik$/);
  await expect(page.locator("h1")).toContainText(/Gizlilik Politikası/);
});

test("catalog form consent link round-trip (TR)", async ({ page }) => {
  await page.goto("/tr/katalog");
  const link = page.locator("form").getByRole("link", { name: /Gizlilik Politikası/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/tr\/yasal\/gizlilik$/);
});
