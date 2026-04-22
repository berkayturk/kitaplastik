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
  rfqDraftId: string;
  maxFiles?: number;
  maxPerFileBytes?: number;
  maxTotalBytes?: number;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

const DEFAULT_ALLOWED = /\.(pdf|jpe?g|png|st[ep]|igs?|iges)$/i;

function fileIcon(mime: string, name: string): string {
  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return "PDF";
  if (mime.startsWith("image/")) return "IMG";
  if (/\.(step|stp|igs|iges)$/i.test(name)) return "CAD";
  return "DOC";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [dragOver, setDragOver] = useState(false);

  const handlePick = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      setErr(null);
      const picked = Array.from(files);
      if (picked.length === 0) return;
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

  const disabled = busy || value.length >= maxFiles;

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          void handlePick(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center",
          "rounded-[var(--radius-md)] border-2 border-dashed px-6 py-8 text-center",
          "transition-colors duration-200 ease-out",
          "bg-[var(--color-bg-secondary)]/40",
          dragOver
            ? "border-[var(--color-accent-cobalt)] bg-[var(--color-accent-cobalt)]/5"
            : "border-[var(--color-border-default)] hover:border-[var(--color-accent-cobalt)]/60 hover:bg-[var(--color-bg-secondary)]/70",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.step,.stp,.igs,.iges"
          onChange={(e) => void handlePick(e.target.files)}
          disabled={disabled}
          className="sr-only"
        />
        <svg
          aria-hidden="true"
          className={cn(
            "mb-3 size-10 transition-colors",
            dragOver
              ? "text-[var(--color-accent-cobalt)]"
              : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent-cobalt)]/70",
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="text-text-primary text-sm font-medium">{t("dropZoneTitle")}</span>
        <span className="text-text-secondary mt-1 text-xs">{t("dropZoneSubtitle")}</span>
        <span
          className={cn(
            "mt-4 inline-flex items-center rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium",
            "border border-[var(--color-accent-cobalt)] text-[var(--color-accent-cobalt)]",
            "group-hover:bg-[var(--color-accent-cobalt)] group-hover:text-[var(--color-text-inverse)]",
            "transition-colors duration-200 ease-out",
          )}
        >
          {busy ? t("uploading") : t("pickButton")}
        </span>
      </label>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((f) => (
            <li
              key={f.path}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2",
                "border border-[var(--color-border-hairline)] bg-[var(--color-bg-elevated)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                  "bg-[var(--color-accent-cobalt)]/10 text-[10px] font-semibold tracking-wide",
                  "text-[var(--color-accent-cobalt)]",
                )}
              >
                {fileIcon(f.mime, f.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate text-xs font-medium">{f.name}</p>
                <p className="text-text-secondary text-[11px]">{formatBytes(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove(f.path)}
                className={cn(
                  "text-text-secondary hover:text-[var(--color-alert-red)]",
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                  "transition-colors hover:bg-[var(--color-alert-red)]/10",
                )}
                aria-label={t("remove")}
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {err && (
        <p role="alert" className="text-[13px] text-[var(--color-alert-red)]">
          {err}
        </p>
      )}
      <p className="text-text-secondary text-[11px]">
        {t("hint", { max: maxFiles, mb: Math.round(maxPerFileBytes / (1024 * 1024)) })}
      </p>
    </div>
  );
}
