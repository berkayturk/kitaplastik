"use client";
import { useState } from "react";
import { slugify, slugifyDraft } from "@/lib/utils/slugify";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  initialSlug: string;
  previewFromName?: string;
  name?: string;
}

export function SlugField({ mode, initialSlug, previewFromName, name = "slug_override" }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState(initialSlug);

  const previewValue = mode === "create" && previewFromName ? slugify(previewFromName) : value;
  const editable = mode === "edit" && unlocked;

  return (
    <div className="space-y-1">
      <label
        htmlFor="slug"
        className="block text-sm font-medium text-[var(--color-text-secondary)]"
      >
        URL (slug)
      </label>
      <div className="flex items-center gap-2">
        <input
          id="slug"
          name={editable ? name : undefined}
          type="text"
          value={editable ? value : previewValue}
          readOnly={!editable}
          onChange={(e) => setValue(slugifyDraft(e.target.value))}
          onBlur={(e) => setValue(slugify(e.target.value))}
          className="bg-bg-primary/60 text-text-primary flex-1 rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-2 font-mono text-sm focus:border-[var(--color-accent-blue)] focus:outline-none"
          aria-label="URL slug"
        />
        {mode === "edit" && (
          <button
            type="button"
            onClick={() => setUnlocked((u) => !u)}
            className="text-xs font-medium text-[var(--color-accent-cobalt)] hover:underline"
          >
            {unlocked ? "İptal" : "Slug'ı düzenle"}
          </button>
        )}
      </div>
      {mode === "create" && (
        <p className="text-text-tertiary text-xs">
          URL otomatik üretiliyor:{" "}
          <span className="font-mono">/products/{previewValue || "…"}</span>
        </p>
      )}
      {editable && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          ⚠️ URL değişir, mevcut Google link&apos;leri kırılır. Emin değilsen iptal et.
        </p>
      )}
    </div>
  );
}
