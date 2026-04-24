"use client";

import { useState } from "react";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { LogoField } from "./LogoField";
import { SectorSelect } from "./SectorSelect";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];

type LocaleKey = "tr" | "en" | "ru" | "ar";
type I18n = Record<LocaleKey, string>;

function asI18n(value: unknown): I18n {
  const v = (value as Partial<I18n> | null) ?? {};
  return { tr: v.tr ?? "", en: v.en ?? "", ru: v.ru ?? "", ar: v.ar ?? "" };
}

interface CreateProps {
  mode: "create";
  sectors: Sector[];
  initial: null;
  defaultDisplayOrder: number;
  action: (formData: FormData) => Promise<void>;
}
interface EditProps {
  mode: "edit";
  sectors: Sector[];
  initial: Client;
  defaultDisplayOrder: number;
  action: (id: string, formData: FormData) => Promise<void>;
}
type Props = CreateProps | EditProps;

export function ReferenceForm(props: Props) {
  const { mode, sectors, initial, defaultDisplayOrder } = props;
  const [locale, setLocale] = useState<LocaleKey>("tr");
  const [key, setKey] = useState(initial?.key ?? "");
  const [displayName, setDisplayName] = useState<I18n>(asI18n(initial?.display_name));
  const [logoPath, setLogoPath] = useState<string | null>(initial?.logo_path ?? null);
  const [sectorId, setSectorId] = useState(initial?.sector_id ?? "");
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? defaultDisplayOrder);
  const [active, setActive] = useState(initial?.active ?? true);

  async function submit(formData: FormData) {
    if (mode === "create") formData.set("key", key);
    formData.set("display_name", JSON.stringify(displayName));
    formData.set("logo_path", logoPath ?? "");
    formData.set("sector_id", sectorId);
    formData.set("display_order", String(displayOrder));
    formData.set("active", active ? "on" : "off");
    if (mode === "edit") await props.action(initial.id, formData);
    else await props.action(formData);
  }

  return (
    <form action={submit} className="space-y-6">
      <label className="block">
        <span className="block text-sm font-medium">Anahtar</span>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={mode === "edit"}
          required={mode === "create"}
          pattern="[a-zA-Z0-9-]+"
          maxLength={32}
          className="w-full rounded border px-3 py-2"
          aria-label="Anahtar"
        />
      </label>

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

      <label className="block" role="tabpanel">
        <span className="block text-sm font-medium">Ad ({locale.toUpperCase()}) — opsiyonel</span>
        <input
          type="text"
          value={displayName[locale]}
          onChange={(e) => setDisplayName({ ...displayName, [locale]: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
      </label>

      <LogoField initial={logoPath} onChange={setLogoPath} />

      <SectorSelect sectors={sectors} value={sectorId} onChange={setSectorId} />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Sıra</span>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            max={10000}
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
        <Link href="/admin/references" className="rounded border px-4 py-2">
          İptal
        </Link>
      </div>
    </form>
  );
}
