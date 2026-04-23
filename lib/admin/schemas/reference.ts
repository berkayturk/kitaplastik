// lib/admin/schemas/reference.ts
import { z } from "zod";
import { I18nString } from "./sector";

const LOGO_PATH_REGEX = /^[a-z0-9-]+\/[a-f0-9-]{36}\.(svg|png|jpg|jpeg|webp)$/i;
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const CreateReferenceSchema = z.object({
  key: z
    .string()
    .regex(/^[a-z0-9-]+$/i, "Yalnızca harf/rakam/tire")
    .min(1)
    .max(32),
  display_name: I18nString.nullable(),
  logo_path: z.string().regex(LOGO_PATH_REGEX, "Geçersiz logo yolu"),
  sector_id: z.string().regex(UUID_RE, "Geçersiz sector_id"),
  display_order: z.number().int().min(0).max(10000),
  active: z.boolean().default(true),
});

export const UpdateReferenceSchema = CreateReferenceSchema.omit({ key: true });

export type CreateReferenceInput = z.infer<typeof CreateReferenceSchema>;
export type UpdateReferenceInput = z.infer<typeof UpdateReferenceSchema>;
