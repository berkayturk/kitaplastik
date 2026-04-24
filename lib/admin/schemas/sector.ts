// lib/admin/schemas/sector.ts
import { z } from "zod";

export const I18nString = z.object({
  tr: z.string().trim().default(""),
  en: z.string().trim().default(""),
  ru: z.string().trim().default(""),
  ar: z.string().trim().default(""),
});

export const UpdateSectorSchema = z.object({
  name: I18nString.refine((v) => v.tr.length > 0, "TR ad zorunlu"),
  description: I18nString.nullable(),
  long_description: I18nString.nullable(),
  meta_title: I18nString.nullable(),
  meta_description: I18nString.nullable(),
  hero_image: z
    .object({
      path: z.string().min(1),
      alt: I18nString,
    })
    .nullable(),
  display_order: z.number().int().min(0).max(1000),
  active: z.boolean(),
});

export type UpdateSectorInput = z.infer<typeof UpdateSectorSchema>;
