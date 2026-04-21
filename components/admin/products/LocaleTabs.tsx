"use client";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

const LOCALES: Locale[] = ["tr", "en", "ru", "ar"];
const LABELS: Record<Locale, string> = { tr: "TR", en: "EN", ru: "RU", ar: "AR" };

interface Props {
  active: Locale;
  filled: Record<Locale, boolean>;
  onSelect: (locale: Locale) => void;
}

export function LocaleTabs({ active, filled, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Dil sekmeleri"
      className="flex gap-1 border-b border-[var(--color-border-subtle-dark)]"
    >
      {LOCALES.map((loc) => {
        const required = loc === "tr";
        const mark = filled[loc] ? "✓" : required ? "*" : "—";
        return (
          <button
            key={loc}
            type="button"
            role="tab"
            aria-selected={active === loc}
            onClick={() => onSelect(loc)}
            className={cn(
              "rounded-t-sm border-b-2 px-3 py-1.5 text-sm font-medium transition-colors",
              active === loc
                ? "text-text-primary border-[var(--color-accent-cobalt)]"
                : "text-text-secondary hover:text-text-primary border-transparent",
            )}
          >
            {LABELS[loc]} <span className="text-text-tertiary text-xs">{mark}</span>
          </button>
        );
      })}
    </div>
  );
}
