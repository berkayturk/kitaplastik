// components/forms/CountrySelect.tsx
//
// Native <select> with a "popular" optgroup followed by the full alphabetical
// list. ISO-2 codes are submitted (not display names), so the server always
// gets a canonical value regardless of the user's locale.

"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getCountries, getPopularCountries, POPULAR_CODES, type Locale } from "@/lib/countries";

interface Props {
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
  id?: string;
  autoComplete?: string;
}

export function CountrySelect({
  name,
  required,
  defaultValue = "TR",
  className,
  id,
  autoComplete = "country",
}: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.country");

  const popular = useMemo(() => getPopularCountries(locale), [locale]);
  const rest = useMemo(() => {
    const popularSet = new Set<string>(POPULAR_CODES);
    return getCountries(locale).filter((c) => !popularSet.has(c.code));
  }, [locale]);

  return (
    <select
      name={name}
      id={id}
      required={required}
      defaultValue={defaultValue}
      autoComplete={autoComplete}
      className={cn(
        "w-full rounded-[var(--radius-sm)] border border-[var(--color-border-default)]",
        "text-text-primary bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-[14px]",
        "transition-colors duration-150 ease-out",
        "focus:border-[var(--color-accent-cobalt)] focus:outline-none",
        "focus:shadow-[var(--shadow-focus)]",
        className,
      )}
    >
      <optgroup label={t("popularGroup")}>
        {popular.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </optgroup>
      <optgroup label={t("othersGroup")}>
        {rest.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
