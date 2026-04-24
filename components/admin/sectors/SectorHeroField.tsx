"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export interface HeroImage {
  path: string;
  alt: { tr: string; en: string; ru: string; ar: string };
}

interface Props {
  sectorSlug: string;
  initial: HeroImage | null;
  onChange: (value: HeroImage | null) => void;
}

const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function SectorHeroField({ sectorSlug, initial, onChange }: Props) {
  const [hero, setHero] = useState<HeroImage | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      setError("PNG/JPG/WEBP kabul ediliyor");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Maks 5 MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const uuid = crypto.randomUUID();
    const path = `${sectorSlug}/${uuid}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("sector-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (uploadErr) {
      setError(`Yüklenemedi: ${uploadErr.message}`);
      return;
    }

    const next: HeroImage = {
      path: `sector-images/${path}`,
      alt: hero?.alt ?? { tr: "", en: "", ru: "", ar: "" },
    };
    setHero(next);
    onChange(next);
  }

  function removeHero() {
    setHero(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateAlt(locale: "tr" | "en" | "ru" | "ar", value: string) {
    if (!hero) return;
    const next = { ...hero, alt: { ...hero.alt, [locale]: value } };
    setHero(next);
    onChange(next);
  }

  const publicUrl = hero
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${hero.path}`
    : null;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Hero Görsel</label>
      {publicUrl ? (
        <div className="relative inline-block">
          <Image
            src={publicUrl}
            alt={hero?.alt.tr ?? ""}
            width={320}
            height={200}
            className="rounded border"
          />
          <button
            type="button"
            onClick={removeHero}
            className="absolute top-1 right-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
          >
            Sil
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={uploading}
        />
      )}
      {uploading && <p className="text-sm">Yükleniyor...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {hero && (
        <div className="space-y-2">
          {(["tr", "en", "ru", "ar"] as const).map((loc) => (
            <input
              key={loc}
              type="text"
              placeholder={`alt (${loc})`}
              value={hero.alt[loc]}
              onChange={(e) => updateAlt(loc, e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}
