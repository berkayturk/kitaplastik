// lib/validation/catalog.ts
import { z } from "zod";

export const catalogLocales = ["tr", "en", "ru", "ar"] as const;
export const catalogSectors = ["all", "cam-yikama", "otomotiv", "tekstil"] as const;

export const catalogRequestSchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(catalogLocales),
  // Default "all" keeps the schema backward-compatible with form submissions
  // that predate the sector selector.
  sector: z.enum(catalogSectors).default("all"),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type CatalogRequestInput = z.infer<typeof catalogRequestSchema>;
