"use client";

import type { Database } from "@/lib/supabase/types";

type Sector = Database["public"]["Tables"]["sectors"]["Row"];

interface Props {
  sectors: Sector[];
  value: string;
  onChange: (sectorId: string) => void;
}

export function SectorSelect({ sectors, value, onChange }: Props) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">Sektör</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded border px-3 py-2"
      >
        <option value="">— Seçin —</option>
        {sectors.map((s) => {
          const name = (s.name as Record<string, string> | null)?.tr ?? s.slug;
          return (
            <option key={s.id} value={s.id}>
              {name}
            </option>
          );
        })}
      </select>
    </label>
  );
}
