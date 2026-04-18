// tests/e2e/admin.spec.ts
import { test, expect } from "@playwright/test";

test("unauthenticated /admin redirects to /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("/admin/login renders email form", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

// Authenticated admin flow requires programmatic magic-link cookie injection
// against a real Supabase project. Deferred to Plan 4 once we have a reliable
// test-user provisioning hook (e.g., supabase-js admin invite + code exchange).
test.skip("authenticated admin sees inbox", async () => {
  // TODO(plan4): programmatic session + /admin/inbox assertion
});
