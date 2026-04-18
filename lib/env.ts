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

const result = schema.safeParse(process.env);

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
