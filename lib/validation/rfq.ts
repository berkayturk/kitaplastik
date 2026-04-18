// lib/validation/rfq.ts
import { z } from "zod";

export const rfqLocales = ["tr", "en", "ru", "ar"] as const;
export const rfqSectors = ["cam-yikama", "kapak", "tekstil", "diger"] as const;
export const rfqVolumes = ["1k", "5k", "10k", "50k", "100k+", "unknown"] as const;
export const rfqTolerances = ["low", "medium", "high"] as const;
export const rfqIncoterms = ["EXW", "FOB", "CIF", "DAP"] as const;

const contact = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(5).max(40),
  country: z.string().trim().min(2).max(4),
});

const attachment = z.object({
  path: z.string().min(1),
  name: z.string().min(1).max(255),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(10 * 1024 * 1024),
  mime: z.string().min(1).max(120),
});

export const customRfqSchema = z.object({
  contact,
  sector: z.enum(rfqSectors),
  description: z.string().trim().min(50).max(2000),
  materials: z.array(z.string().max(40)).max(10).optional().default([]),
  annualVolume: z.enum(rfqVolumes),
  tolerance: z.enum(rfqTolerances).optional(),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  ndaRequired: z.boolean().default(false),
  kvkkConsent: z.literal(true),
  attachments: z.array(attachment).max(5).default([]),
  locale: z.enum(rfqLocales),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type CustomRfqInput = z.infer<typeof customRfqSchema>;

export const standartRfqSchema = z.object({
  contact,
  items: z
    .array(
      z.object({
        productSlug: z.string().min(1).max(80),
        variant: z.string().max(80).optional().or(z.literal("")),
        qty: z.number().int().positive().max(1_000_000),
      }),
    )
    .min(1)
    .max(20),
  deliveryCountry: z.string().max(4).optional().or(z.literal("")),
  incoterm: z.enum(rfqIncoterms).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  urgent: z.boolean().default(false),
  kvkkConsent: z.literal(true),
  locale: z.enum(rfqLocales),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type StandartRfqInput = z.infer<typeof standartRfqSchema>;
