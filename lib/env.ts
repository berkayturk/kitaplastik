// lib/env.ts
// Server-only env. Re-exports `env` (NEXT_PUBLIC_*) from ./env.client plus adds
// `serverEnv` with secret-bearing keys (service role, resend, turnstile secret, etc).
// Importing this module from a Client Component throws at build time thanks to
// "server-only" below.
import "server-only";
import { z } from "zod";

import { env } from "./env.client";

export { env };
export type { PublicEnv } from "./env.client";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email().default("noreply@kitaplastik.com"),
  RESEND_TEAM_EMAIL: z.string().email().default("info@kitaplastik.com"),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  // Catalog PDF generator (Puppeteer). Empty in local dev when no Chromium
  // is installed; in Coolify the nixpacks.toml path is injected at build
  // time and mirrored at runtime.
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  // Shared secret the PDF route sets in an x-catalog-template-secret
  // header when calling /catalog-template/*; middleware rejects template
  // requests without it. Optional in dev (template accessible locally).
  CATALOG_TEMPLATE_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const serverRaw = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_TEAM_EMAIL: process.env.RESEND_TEAM_EMAIL,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH,
  CATALOG_TEMPLATE_SECRET: process.env.CATALOG_TEMPLATE_SECRET,
};

const result = serverEnvSchema.safeParse(serverRaw);

if (!result.success) {
  const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Geçersiz veya eksik ortam değişkenleri:\n${issues}\n\n` +
      `Lütfen .env.local dosyanızı .env.example'a göre doldurun.`,
  );
}

// Server-only typed accessor — only use in server-side code
export const serverEnv: ServerEnv = result.data;
