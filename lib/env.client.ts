// lib/env.client.ts
// Client-safe env — importable from "use client" components.
// For server-only vars (service role key, resend key, turnstile secret),
// use lib/env.ts (which imports "server-only").
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

// Explicit references so bundlers inline NEXT_PUBLIC_* into the client chunk.
// Passing `process.env` as a whole object defeats static analysis in Turbopack/Webpack.
const raw = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

const result = publicEnvSchema.safeParse(raw);

if (!result.success) {
  const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Geçersiz veya eksik ortam değişkenleri:\n${issues}\n\n` +
      `Lütfen .env.local dosyanızı .env.example'a göre doldurun.`,
  );
}

export const env: PublicEnv = result.data;
