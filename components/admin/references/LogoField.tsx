"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initial: string | null; // path like "client-logos/<uuid>.svg" or legacy "/references/c1.svg"
  onChange: (logoPath: string | null) => void;
}

const ALLOWED_EXT = ["svg", "png", "jpg", "jpeg", "webp"];
const MAX_BYTES = 1 * 1024 * 1024; // 1 MB
const MIN_WIDTH_RASTER = 400;

async function validateRasterWidth(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image();
    img.onload = () => resolve(img.naturalWidth);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

function toPublicUrl(logoPath: string | null): string | null {
  if (!logoPath) return null;
  if (logoPath.startsWith("/")) return logoPath;
  if (logoPath.startsWith("http")) return logoPath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${logoPath}`;
}

export function LogoField({ initial, onChange }: Props) {
  const [logoPath, setLogoPath] = useState<string | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("SVG/PNG/JPG/WEBP kabul ediliyor");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Maks 1 MB");
      return;
    }

    // M4 client-side: raster için naturalWidth, SVG skip
    if (ext !== "svg") {
      try {
        const w = await validateRasterWidth(file);
        if (w < MIN_WIDTH_RASTER) {
          setError(`Min ${MIN_WIDTH_RASTER}px genişlik lazım (şu an ${w}px)`);
          return;
        }
      } catch {
        setError("Görsel okunamadı");
        return;
      }
    }

    setUploading(true);
    const supabase = createClient();
    const uuid = crypto.randomUUID();
    const key = `${uuid}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("client-logos")
      .upload(key, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (uploadErr) {
      setError(`Yüklenemedi: ${uploadErr.message}`);
      return;
    }

    const fullPath = `client-logos/${key}`;
    setLogoPath(fullPath);
    onChange(fullPath);
  }

  function remove() {
    setLogoPath(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const publicUrl = toPublicUrl(logoPath);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Logo</label>
      {publicUrl ? (
        <div className="relative inline-block">
          <Image
            src={publicUrl}
            alt="Logo preview"
            width={200}
            height={80}
            className="rounded border bg-white p-2"
          />
          <button
            type="button"
            onClick={remove}
            className="absolute top-1 right-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
          >
            Sil
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={uploading}
        />
      )}
      {uploading && <p className="text-sm">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
