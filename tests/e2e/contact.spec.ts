// tests/e2e/contact.spec.ts
import { test, expect } from "@playwright/test";

test("contact form submits and shows success state", async ({ page }) => {
  await page.goto("/tr/contact");
  await page.fill('input[name="name"]', "Test Kullanıcı");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="phone"]', "+905551112233");
  await page.fill('input[name="company"]', "Acme");
  await page.selectOption('select[name="subject"]', "general");
  await page.fill(
    'textarea[name="message"]',
    "Bu bir test mesajıdır, test ortamında Turnstile test key'i her zaman başarılı döner.",
  );

  // Turnstile test site key always returns a valid token once the widget mounts;
  // the submit button enables after the onSuccess callback fires.
  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15_000 });

  await page.click('button[type="submit"]');
  await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
});

test("contact form keeps submit disabled when Turnstile is blocked", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.route("**/challenges.cloudflare.com/**", (route) => route.abort());
  const page = await ctx.newPage();
  await page.goto("/tr/contact");
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await ctx.close();
});
