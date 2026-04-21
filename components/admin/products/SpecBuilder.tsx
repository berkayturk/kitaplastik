"use client";
import { useState } from "react";
import { SPEC_PRESETS, type SpecPresetId, getPresetLabel } from "@/lib/admin/spec-presets";

export interface SpecRow {
  preset_id: SpecPresetId;
  value: string;
}

interface Props {
  value: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
}

export function SpecBuilder({ value, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const usedPresets = new Set(value.map((r) => r.preset_id));

  function updateRow(idx: number, patch: Partial<SpecRow>) {
    onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeRow(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function addPreset(id: SpecPresetId) {
    onChange([...value, { preset_id: id, value: "" }]);
    setPickerOpen(false);
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
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div role="table" aria-label="Teknik özellikler" className="space-y-1">
        {value.map((row, i) => (
          <div key={`${row.preset_id}-${i}`} role="row" className="flex items-center gap-2">
            <span className="w-32 text-sm text-[var(--color-text-secondary)]">
              {getPresetLabel(row.preset_id, "tr")}
            </span>
            <input
              type="text"
              value={row.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
              placeholder="Değer (örn. PET, 28 mm, 10.000 adet)"
              className="bg-bg-primary/60 flex-1 rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-sm"
              aria-label={`${getPresetLabel(row.preset_id, "tr")} değeri`}
            />
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Yukarı taşı"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === value.length - 1}
              aria-label="Aşağı taşı"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Sil"
              className="text-[var(--color-accent-red)]"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          disabled={usedPresets.size >= SPEC_PRESETS.length}
          className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-sm font-medium hover:border-[var(--color-border-strong)]"
        >
          + Özellik Ekle
        </button>
        {pickerOpen && (
          <ul
            role="listbox"
            className="bg-bg-primary absolute z-10 mt-1 w-56 rounded-sm border border-[var(--color-border-subtle-dark)] p-1 shadow-lg"
          >
            {SPEC_PRESETS.map((p) => {
              const disabled = usedPresets.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    role="option"
                    type="button"
                    onClick={() => addPreset(p.id)}
                    disabled={disabled}
                    aria-disabled={disabled}
                    aria-selected={false}
                    className="hover:bg-bg-secondary/60 flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {p.labels.tr}
                    {disabled && <span className="text-text-tertiary text-xs">eklendi</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
