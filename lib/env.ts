import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  // Server-only değişkenler ileriki planlarda eklenecek (RESEND_API_KEY, vb.)
});

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

export const env = result.data;
