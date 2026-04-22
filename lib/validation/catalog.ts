// lib/validation/catalog.ts
import { z } from "zod";

export const catalogLocales = ["tr", "en", "ru", "ar"] as const;

export const catalogRequestSchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(catalogLocales),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type CatalogRequestInput = z.infer<typeof catalogRequestSchema>;
