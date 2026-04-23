import { z } from "zod";
import { SPEC_PRESETS, type SpecPresetId } from "@/lib/admin/spec-presets";

const PRESET_IDS = SPEC_PRESETS.map((p) => p.id) as [SpecPresetId, ...SpecPresetId[]];

// Postgres-compatible UUID format (8-4-4-4-12 hex). Zod v4's z.string().uuid()
// enforces RFC 4122 version/variant bytes, which rejects valid Postgres UUIDs
// like 00000000-0000-0000-0000-000000000001. We accept any canonical-format UUID.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const LocalizedText = z.object({
  tr: z.string(),
  en: z.string(),
  ru: z.string(),
  ar: z.string(),
});

const SpecItem = z.object({
  preset_id: z.enum(PRESET_IDS),
  value: z.string().min(1, "value gerekli").max(200),
});

const ImageItem = z.object({
  path: z.string().min(1),
  order: z.number().int().min(0),
  alt_text: LocalizedText,
});

const SlugString = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid slug format");

const uniquePresets = (specs: { preset_id: string }[], ctx: z.RefinementCtx): void => {
  const seen = new Set<string>();
  for (const [i, s] of specs.entries()) {
    if (seen.has(s.preset_id)) {
      ctx.addIssue({
        code: "custom",
        path: ["specs", i, "preset_id"],
        message: `preset_id "${s.preset_id}" must be unique per product`,
      });
    }
    seen.add(s.preset_id);
  }
};

// Catalog product code — nullable editorial identifier (e.g. "KP-0214").
// Empty string is coerced to null so the DB column stores NULL and the
// catalog renderer falls back to slug.toUpperCase().
const CodeField = z
  .string()
  .trim()
  .max(50, "code en fazla 50 karakter")
  .regex(/^[A-Za-z0-9][A-Za-z0-9 \-_/.]*$/, "code yalnız harf, rakam ve - _ / . içerebilir")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : null));

const Base = z.object({
  sector_id: z.string().regex(UUID_RE, "invalid UUID format"),
  code: CodeField,
  name: LocalizedText.transform((n) => ({ ...n, tr: n.tr.trim() })).refine((n) => n.tr.length > 0, {
    message: "name.tr zorunlu",
    path: ["tr"],
  }),
  description: LocalizedText,
  specs: z.array(SpecItem).max(10).superRefine(uniquePresets),
  images: z.array(ImageItem).max(5),
});

export const CreateProductSchema = Base;

export const UpdateProductSchema = Base.extend({
  slug_override: SlugString.optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
