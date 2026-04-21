// tests/e2e/helpers/admin-login.ts
import type { Page, BrowserContext } from "@playwright/test";

interface LoginArgs {
  page: Page;
  context: BrowserContext;
}

/**
 * Admin giriş akışı: ADMIN_EMAIL + ADMIN_PASSWORD env'leri varsa form doldurup
 * submit eder; /admin/inbox veya /admin/products'a redirect olana kadar bekler.
 * Gerçek Supabase creds yoksa test.skip kullan.
 */
export async function loginAsAdmin({ page }: LoginArgs): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL/ADMIN_PASSWORD gerekli");

  await page.goto("/admin/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL(/\/admin\/(inbox|products)/, { timeout: 10_000 }),
    page.click('button[type="submit"]'),
  ]);
}

export function hasAdminCreds(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}
