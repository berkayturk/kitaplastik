// components/rfq/ProductPicker.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

export interface ItemRow {
  productSlug: string;
  productName: string;
  variant: string;
  qty: number;
}

interface Props {
  value: ItemRow[];
  onChange: (rows: ItemRow[]) => void;
  locale: Locale;
  maxItems?: number;
}

interface Suggestion {
  slug: string;
  nameLocalized: string;
}

function useSupabase() {
  const ref = useRef<ReturnType<typeof createBrowserClient> | null>(null);
  if (!ref.current)
    ref.current = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  return ref.current;
}

function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setV(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return v;
}

export function ProductPicker({ value, onChange, locale, maxItems = 20 }: Props) {
  const canAdd = value.length < maxItems;

  function update(i: number, patch: Partial<ItemRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { productSlug: "", productName: "", variant: "", qty: 100 }]);
  }

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <Row
          key={i}
          row={row}
          locale={locale}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
        />
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={add}
          className="text-sm font-medium text-[var(--color-accent-cobalt)] hover:underline"
        >
          + Ürün Ekle
        </button>
      )}
    </div>
  );
}

function Row({
  row,
  locale,
  onChange,
  onRemove,
}: {
  row: ItemRow;
  locale: Locale;
  onChange: (patch: Partial<ItemRow>) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState(row.productName);
  const debounced = useDebounced(query, 200);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [searched, setSearched] = useState(false);
  const supa = useSupabase();

  useEffect(() => {
    let cancelled = false;
    if (!debounced.trim()) {
      setSuggestions(null);
      setSearched(false);
      return;
    }
    (async () => {
      const nameKey = `name->>${locale}`;
      const { data } = await supa
        .from("products")
        .select(`slug, name`)
        .eq("active", true)
        .not(nameKey, "is", null)
        .neq(nameKey, "")
        .ilike(nameKey, `%${debounced.trim()}%`)
        .limit(8);
      if (cancelled) return;
      const rows = (data ?? []) as Array<{ slug: string; name: Record<string, string> | null }>;
      setSuggestions(
        rows.map((p) => ({
          slug: p.slug,
          nameLocalized: (p.name ?? {})[locale] ?? p.slug,
        })),
      );
      setSearched(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, locale, supa]);

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-2 py-1.5 text-sm text-text-primary",
    "focus:border-[var(--color-accent-blue)] focus:outline-none",
  );

  return (
    <div className="rounded-sm border border-[var(--color-border-subtle-dark)] p-3">
      <div className="relative">
        <input
          type="text"
          value={row.productName || query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ productName: e.target.value, productSlug: "" });
          }}
          placeholder="Ürün adı ara…"
          className={inputClass}
          aria-label="Ürün ara"
          aria-autocomplete="list"
        />
        {suggestions && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="bg-bg-primary absolute z-10 mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] shadow-md"
          >
            {suggestions.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ productSlug: s.slug, productName: s.nameLocalized });
                    setQuery(s.nameLocalized);
                    setSuggestions(null);
                  }}
                  className="hover:bg-bg-secondary/60 block w-full px-2 py-1 text-left text-sm"
                >
                  {s.nameLocalized}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searched && suggestions && suggestions.length === 0 && (
          <p className="text-text-secondary mt-2 text-sm">
            Aradığınız ürün listede yok mu?{" "}
            <Link
              href="/request-quote/ozel-uretim"
              className="text-[var(--color-accent-cobalt)] hover:underline"
            >
              Özel üretim talep formundan
            </Link>{" "}
            detaylı talep oluşturun.
          </p>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="text"
          value={row.variant}
          onChange={(e) => onChange({ variant: e.target.value })}
          placeholder="Varyant / renk / not"
          className={inputClass}
          aria-label="Varyant"
        />
        <input
          type="number"
          min={1}
          value={row.qty}
          onChange={(e) => onChange({ qty: Math.max(1, Number(e.target.value) || 0) })}
          placeholder="Miktar"
          className={inputClass}
          aria-label="Miktar"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-2 text-xs text-[var(--color-accent-red)] hover:underline"
      >
        Sil
      </button>
    </div>
  );
}
