"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env.client";

export interface UploadedImage {
  path: string;
  order: number;
  alt_text: { tr: string; en: string; ru: string; ar: string };
}

interface Props {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  tempSlug: string;
  maxFiles?: number;
}

const BUCKET = "product-images";
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({ value, onChange, tempSlug, maxFiles = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function supa() {
    return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    setUploading(true);
    try {
      const added: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        if (value.length + added.length >= maxFiles) break;
        if (!ACCEPTED.includes(file.type)) {
          setError(`Desteklenmeyen format: ${file.type}`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`${file.name}: 10 MB üstü reddedildi`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const uuid = crypto.randomUUID();
        const path = `${tempSlug}/${uuid}.${ext}`;
        const { error: upErr } = await supa().storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
        });
        if (upErr) {
          setError(upErr.message);
          continue;
        }
        added.push({ path, order: 0, alt_text: { tr: "", en: "", ru: "", ar: "" } });
      }
      const merged = [...value, ...added].map((img, i) => ({ ...img, order: i }));
      onChange(merged);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx).map((img, i) => ({ ...img, order: i }));
    onChange(next);
  }
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const a = value[idx];
    const b = value[j];
    if (!a || !b) return;
    const next = [...value];
    next[idx] = b;
    next[j] = a;
    onChange(next.map((img, i) => ({ ...img, order: i })));
  }

  const storageBase = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {value.map((img, i) => {
          const url = `${storageBase}/storage/v1/object/public/${BUCKET}/${img.path}`;
          return (
            <div
              key={img.path}
              className="relative aspect-square overflow-hidden rounded-sm border border-[var(--color-border-subtle-dark)]"
            >
              <Image
                src={url}
                alt={`Görsel ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-1 py-0.5 text-xs text-white">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Öne al"
                >
                  ◀
                </button>
                <span>{i === 0 ? "ANA" : i + 1}</span>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Sona al"
                >
                  ▶
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 px-2 text-xs text-white"
                aria-label="Görseli kaldır"
              >
                ✕
              </button>
            </div>
          );
        })}
        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-text-secondary aspect-square rounded-sm border-2 border-dashed border-[var(--color-border-subtle-dark)] text-center text-xs hover:border-[var(--color-border-strong)] disabled:opacity-50"
          >
            {uploading ? "Yükleniyor…" : "+ Ekle"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-sm text-[var(--color-accent-red)]">{error}</p>}
      <p className="text-text-tertiary mt-1 text-xs">
        Max {maxFiles} görsel × 10 MB. JPG/PNG/WebP. İlk görsel ana görseldir.
      </p>
    </div>
  );
}
