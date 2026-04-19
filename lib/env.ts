// lib/env.ts
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email().default("noreply@kitaplastik.com"),
  RESEND_TEAM_EMAIL: z.string().email().default("info@kitaplastik.com"),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

const isServer = typeof window === "undefined";
const schema = isServer ? serverEnvSchema : publicEnvSchema;

// Explicit references so bundlers inline NEXT_PUBLIC_* into the client chunk.
// Passing `process.env` as a whole object defeats static analysis in Turbopack/Webpack.
const publicRaw = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

const raw = isServer
  ? {
      ...publicRaw,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      RESEND_TEAM_EMAIL: process.env.RESEND_TEAM_EMAIL,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    }
  : publicRaw;

const result = schema.safeParse(raw);

if (!result.success) {
  const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Geçersiz veya eksik ortam değişkenleri:\n${issues}\n\n` +
      `Lütfen .env.local dosyanızı .env.example'a göre doldurun.`,
  );
}

export const env = result.data as PublicEnv;

// Server-only typed accessor — only use in server-side code
export const serverEnv = result.data as ServerEnv;
