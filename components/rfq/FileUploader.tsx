// components/rfq/FileUploader.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  path: string;
  name: string;
  size: number;
  mime: string;
}

interface Props {
  rfqDraftId: string; // UUID per form mount
  maxFiles?: number;
  maxPerFileBytes?: number;
  maxTotalBytes?: number;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

const DEFAULT_ALLOWED = /\.(pdf|jpe?g|png|st[ep]|igs?|iges)$/i;

export function FileUploader({
  rfqDraftId,
  maxFiles = 5,
  maxPerFileBytes = 10 * 1024 * 1024,
  maxTotalBytes = 25 * 1024 * 1024,
  value,
  onChange,
}: Props) {
  const t = useTranslations("rfq.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handlePick = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setErr(null);
      const picked = Array.from(files);
      const room = maxFiles - value.length;
      if (picked.length > room) {
        setErr(t("errMaxFiles", { max: maxFiles }));
        return;
      }
      const currentTotal = value.reduce((s, f) => s + f.size, 0);
      for (const f of picked) {
        if (!DEFAULT_ALLOWED.test(f.name)) {
          setErr(t("errUnsupported", { name: f.name }));
          return;
        }
        if (f.size > maxPerFileBytes) {
          setErr(t("errTooBig", { name: f.name, mb: Math.round(maxPerFileBytes / (1024 * 1024)) }));
          return;
        }
      }
      const pickedTotal = picked.reduce((s, f) => s + f.size, 0);
      if (currentTotal + pickedTotal > maxTotalBytes) {
        setErr(t("errTotalTooBig", { mb: Math.round(maxTotalBytes / (1024 * 1024)) }));
        return;
      }

      setBusy(true);
      const supabase = createClient();
      const results: UploadedFile[] = [];
      for (const f of picked) {
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${rfqDraftId}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("rfq-attachments").upload(path, f, {
          contentType: f.type || "application/octet-stream",
          upsert: false,
        });
        if (error) {
          setErr(t("errUpload", { name: f.name }));
          setBusy(false);
          return;
        }
        results.push({
          path,
          name: f.name,
          size: f.size,
          mime: f.type || "application/octet-stream",
        });
      }
      onChange([...value, ...results]);
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    },
    [maxFiles, maxPerFileBytes, maxTotalBytes, onChange, rfqDraftId, t, value],
  );

  const handleRemove = useCallback(
    async (path: string) => {
      const supabase = createClient();
      await supabase.storage.from("rfq-attachments").remove([path]);
      onChange(value.filter((f) => f.path !== path));
    },
    [onChange, value],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.step,.stp,.igs,.iges"
          onChange={(e) => handlePick(e.target.files)}
          disabled={busy || value.length >= maxFiles}
          className="text-sm"
        />
        {busy && <span className="text-text-secondary text-xs">{t("uploading")}</span>}
      </div>
      <ul className="space-y-1">
        {value.map((f) => (
          <li key={f.path} className="flex items-center justify-between text-xs">
            <span className="truncate">
              {f.name} · {(f.size / 1024).toFixed(0)} KB
            </span>
            <button
              type="button"
              onClick={() => handleRemove(f.path)}
              className={cn(
                "ms-2 rounded-sm px-2 py-1 text-xs text-[var(--color-accent-red)]",
                "hover:underline",
              )}
            >
              {t("remove")}
            </button>
          </li>
        ))}
      </ul>
      {err && (
        <p role="alert" className="text-sm text-[var(--color-accent-red)]">
          {err}
        </p>
      )}
      <p className="text-text-secondary text-xs">
        {t("hint", { max: maxFiles, mb: Math.round(maxPerFileBytes / (1024 * 1024)) })}
      </p>
    </div>
  );
}
