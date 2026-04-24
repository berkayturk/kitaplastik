// components/admin/sectors/SectorForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { SectorHeroField, type HeroImage } from "./SectorHeroField";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

interface Props {
  sector: Sector;
  action: (id: string, formData: FormData) => Promise<void>;
}

type LocaleKey = "tr" | "en" | "ru" | "ar";
type I18n = Record<LocaleKey, string>;

function asI18n(value: unknown): I18n {
  const v = (value as Partial<I18n> | null) ?? {};
  return { tr: v.tr ?? "", en: v.en ?? "", ru: v.ru ?? "", ar: v.ar ?? "" };
}

export function SectorForm({ sector, action }: Props) {
  const [locale, setLocale] = useState<LocaleKey>("tr");
  const [name, setName] = useState<I18n>(asI18n(sector.name));
  const [desc, setDesc] = useState<I18n>(asI18n(sector.description));
  const [longDesc, setLongDesc] = useState<I18n>(asI18n(sector.long_description));
  const [metaTitle, setMetaTitle] = useState<I18n>(asI18n(sector.meta_title));
  const [metaDesc, setMetaDesc] = useState<I18n>(asI18n(sector.meta_description));
  const [hero, setHero] = useState<HeroImage | null>(sector.hero_image as HeroImage | null);
  const [displayOrder, setDisplayOrder] = useState(sector.display_order);
  const [active, setActive] = useState(sector.active);

  async function submit(formData: FormData) {
    formData.set("name", JSON.stringify(name));
    formData.set("description", JSON.stringify(desc));
    formData.set("long_description", JSON.stringify(longDesc));
    formData.set("meta_title", JSON.stringify(metaTitle));
    formData.set("meta_description", JSON.stringify(metaDesc));
    formData.set("hero_image", JSON.stringify(hero));
    formData.set("display_order", String(displayOrder));
    formData.set("active", active ? "on" : "off");
    await action(sector.id, formData);
  }

  return (
    <form action={submit} className="space-y-6">
      <div role="tablist" className="flex gap-2 border-b">
        {(["tr", "en", "ru", "ar"] as const).map((l) => (
          <button
            type="button"
            role="tab"
            aria-selected={locale === l}
            key={l}
            onClick={() => setLocale(l)}
            className={`px-4 py-2 ${locale === l ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3" role="tabpanel">
        <label className="block">
          <span className="block text-sm font-medium">Ad ({locale.toUpperCase()})</span>
          <input
            type="text"
            value={name[locale]}
            onChange={(e) => setName({ ...name, [locale]: e.target.value })}
            required={locale === "tr"}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Kısa açıklama ({locale.toUpperCase()})</span>
          <textarea
            value={desc[locale]}
            onChange={(e) => setDesc({ ...desc, [locale]: e.target.value })}
            rows={3}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">
            Uzun açıklama ({locale.toUpperCase()}) — markdown
          </span>
          <textarea
            value={longDesc[locale]}
            onChange={(e) => setLongDesc({ ...longDesc, [locale]: e.target.value })}
            rows={8}
            className="w-full rounded border px-3 py-2 font-mono"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Meta title ({locale.toUpperCase()})</span>
          <input
            type="text"
            value={metaTitle[locale]}
            onChange={(e) => setMetaTitle({ ...metaTitle, [locale]: e.target.value })}
            className="w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium">
            Meta description ({locale.toUpperCase()})
          </span>
          <textarea
            value={metaDesc[locale]}
            onChange={(e) => setMetaDesc({ ...metaDesc, [locale]: e.target.value })}
            rows={2}
            className="w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <SectorHeroField sectorSlug={sector.slug} initial={hero} onChange={setHero} />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Sıra</span>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            max={1000}
            className="w-24 rounded border px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span className="text-sm font-medium">Aktif</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-medium text-white">
          Kaydet
        </button>
        <Link href="/admin/sectors" className="rounded border px-4 py-2">
          Geri
        </Link>
      </div>
    </form>
  );
}
