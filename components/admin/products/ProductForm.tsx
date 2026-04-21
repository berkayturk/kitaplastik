"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Locale } from "@/i18n/routing";
import { LocaleTabs } from "./LocaleTabs";
import { SlugField } from "./SlugField";
import { SpecBuilder, type SpecRow } from "./SpecBuilder";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import { SaveProgressModal } from "./SaveProgressModal";

interface SectorOption {
  id: string;
  label: string;
}

interface InitialData {
  id?: string;
  slug?: string;
  sector_id: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  specs: SpecRow[];
  images: UploadedImage[];
}

interface Props {
  mode: "create" | "edit";
  sectors: SectorOption[];
  initial: InitialData;
  action: (formData: FormData) => Promise<void>;
}

const EMPTY_L10N: Record<Locale, string> = { tr: "", en: "", ru: "", ar: "" };

export function ProductForm({ mode, sectors, initial, action }: Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>("tr");
  const [name, setName] = useState<Record<Locale, string>>({ ...EMPTY_L10N, ...initial.name });
  const [description, setDescription] = useState<Record<Locale, string>>({
    ...EMPTY_L10N,
    ...initial.description,
  });
  const [sectorId, setSectorId] = useState(initial.sector_id);
  const [specs, setSpecs] = useState<SpecRow[]>(initial.specs);
  const [images, setImages] = useState<UploadedImage[]>(initial.images);
  const [pending, startTransition] = useTransition();

  const filled: Record<Locale, boolean> = {
    tr: name.tr.trim().length > 0,
    en: name.en.trim().length > 0,
    ru: name.ru.trim().length > 0,
    ar: name.ar.trim().length > 0,
  };

  const tempSlug = mode === "edit" && initial.slug ? initial.slug : `draft-${initial.id ?? "new"}`;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("sector_id", sectorId);
    fd.set("name", JSON.stringify(name));
    fd.set("description", JSON.stringify(description));
    fd.set("specs", JSON.stringify(specs));
    fd.set("images", JSON.stringify(images));

    const form = e.currentTarget;
    const slugOverride = (form.elements.namedItem("slug_override") as HTMLInputElement | null)
      ?.value;
    if (slugOverride) fd.set("slug_override", slugOverride);

    startTransition(() => {
      void action(fd);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="sector" className="block text-sm font-medium">
          Sektör *
        </label>
        <select
          id="sector"
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          required
          className="bg-bg-primary/60 mt-1 rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-2 text-sm"
        >
          <option value="">Seçiniz…</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <LocaleTabs active={activeLocale} filled={filled} onSelect={setActiveLocale} />

      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Ürün Adı ({activeLocale.toUpperCase()}) {activeLocale === "tr" && "*"}
          </label>
          <input
            id="name"
            type="text"
            value={name[activeLocale]}
            onChange={(e) => setName({ ...name, [activeLocale]: e.target.value })}
            required={activeLocale === "tr"}
            className="bg-bg-primary/60 mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Açıklama ({activeLocale.toUpperCase()}) {activeLocale === "tr" && "*"}
          </label>
          <textarea
            id="description"
            rows={5}
            value={description[activeLocale]}
            onChange={(e) => setDescription({ ...description, [activeLocale]: e.target.value })}
            required={activeLocale === "tr"}
            className="bg-bg-primary/60 mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <SlugField mode={mode} initialSlug={initial.slug ?? ""} previewFromName={name.tr} />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Teknik Özellikler (dil-bağımsız)</h3>
        <SpecBuilder value={specs} onChange={setSpecs} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Görseller (ilk görsel ana görsel)</h3>
        <ImageUploader value={images} onChange={setImages} tempSlug={tempSlug} />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/products" className="text-text-secondary text-sm hover:underline">
          İptal
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-[var(--color-accent-cobalt)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          💾 {mode === "edit" ? "Değişiklikleri Kaydet" : "Kaydet ve Yayınla"}
        </button>
      </div>

      <SaveProgressModal open={pending} />
    </form>
  );
}
