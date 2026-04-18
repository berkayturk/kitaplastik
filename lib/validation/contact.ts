// lib/validation/contact.ts
import { z } from "zod";

export const contactSubjects = ["general", "quote", "support", "other"] as const;
export const contactLocales = ["tr", "en", "ru", "ar"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.enum(contactSubjects),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(contactLocales),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
