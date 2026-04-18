// components/rfq/ProductPicker.tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ItemRow {
  productSlug: string;
  variant: string;
  qty: number;
}

interface Props {
  value: ItemRow[];
  onChange: (rows: ItemRow[]) => void;
  maxItems?: number;
}

export function ProductPicker({ value, onChange, maxItems = 20 }: Props) {
  const t = useTranslations("rfq.standart");
  const canAdd = value.length < maxItems;

  function update(i: number, patch: Partial<ItemRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { productSlug: "", variant: "", qty: 100 }]);
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-2 py-1.5 text-sm text-text-primary",
    "focus:border-[var(--color-accent-blue)] focus:outline-none",
  );

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            className={inputClass}
            placeholder={t("productLabel")}
            value={row.productSlug}
            onChange={(e) => update(i, { productSlug: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder={t("variantLabel")}
            value={row.variant}
            onChange={(e) => update(i, { variant: e.target.value })}
          />
          <input
            type="number"
            min={1}
            max={1_000_000}
            className={inputClass}
            placeholder={t("qtyLabel")}
            value={row.qty}
            onChange={(e) => update(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs text-[var(--color-accent-red)] hover:underline"
          >
            ×
          </button>
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={add}
          className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-xs"
        >
          + {t("addItem")}
        </button>
      )}
    </div>
  );
}
