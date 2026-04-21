// components/rfq/ProductPicker.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env.client";
import { cn } from "@/lib/utils";

export interface ItemRow {
  id: string; // client-only stable key for React list rendering; stripped before payload
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
  const t = useTranslations("rfq.standart");
  const canAdd = value.length < maxItems;

  function update(i: number, patch: Partial<ItemRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([
      ...value,
      { id: crypto.randomUUID(), productSlug: "", productName: "", variant: "", qty: 100 },
    ]);
  }

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <Row
          key={row.id}
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
          {t("addItem")}
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
  const t = useTranslations("rfq.standart");
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
      // Escape LIKE wildcards so user input is treated literally (prevents "%" / "_" abuse).
      const escaped = debounced
        .trim()
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
      const { data } = await supa
        .from("products")
        .select(`slug, name`)
        .eq("active", true)
        .not(nameKey, "is", null)
        .neq(nameKey, "")
        .ilike(nameKey, `%${escaped}%`)
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
          placeholder={t("searchPlaceholder")}
          className={inputClass}
          aria-label={t("searchAriaLabel")}
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
            {t("noMatchPrompt")}{" "}
            <Link
              href="/request-quote/ozel-uretim"
              className="text-[var(--color-accent-cobalt)] hover:underline"
            >
              {t("noMatchLinkText")}
            </Link>
            {t("noMatchSuffix")}
          </p>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <input
          type="text"
          value={row.variant}
          onChange={(e) => onChange({ variant: e.target.value })}
          placeholder={t("variantPlaceholder")}
          className={inputClass}
          aria-label={t("variantAriaLabel")}
        />
        <input
          type="number"
          min={1}
          value={row.qty}
          onChange={(e) => onChange({ qty: Math.max(1, Number(e.target.value) || 0) })}
          placeholder={t("qtyPlaceholder")}
          className={inputClass}
          aria-label={t("qtyAriaLabel")}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-2 text-xs text-[var(--color-accent-red)] hover:underline"
      >
        {t("removeRow")}
      </button>
    </div>
  );
}
