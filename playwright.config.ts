import { defineConfig, devices } from "@playwright/test";

// CI/local parity: the webServer below is spawned with the same placeholder
// values CI uses (.github/workflows/ci.yml). This makes `pnpm test:e2e`
// deterministic regardless of the developer's .env.local (which typically
// points at real prod Supabase + domain-bound Turnstile keys that reject
// localhost). Keep this in sync with the CI job's env block.
// Use a dedicated test port so `pnpm test:e2e` never collides with a
// developer's long-running `pnpm dev` on 3000 (which would be reused by
// Playwright and bypass the env override below, breaking CI parity).
const TEST_PORT = 3001;
const TEST_ORIGIN = `http://localhost:${TEST_PORT}`;

const testServerEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-role-key",
  NEXT_PUBLIC_SITE_URL: TEST_ORIGIN,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  RESEND_API_KEY: "re_placeholder_ci",
  RESEND_FROM_EMAIL: "noreply@kitaplastik.com",
  RESEND_TEAM_EMAIL: "info@kitaplastik.com",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: TEST_ORIGIN,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${TEST_PORT}`,
    url: TEST_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Override .env.local so local runs mirror CI behaviour.
    env: testServerEnv,
  },
});
