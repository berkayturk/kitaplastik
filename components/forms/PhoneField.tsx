// components/forms/PhoneField.tsx
//
// Two-column phone input: dial code <select> (flag + +XX) plus number
// <input>. A hidden input named `name` submits the combined string
// ("+90 5551234567") via FormData — keeps existing payload contracts.
// Default dial code + default country flag = TR.

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { DIAL_CODES, flagEmoji, getDialCode } from "@/lib/phone-dial-codes";

interface Props {
  name: string;
  required?: boolean;
  defaultDialCountry?: string; // ISO-2 of the default dial entry
  placeholder?: string;
  className?: string;
  id?: string;
  autoComplete?: string;
}

interface DialOption {
  code: string;
  dial: string;
  flag: string;
  label: string;
}

function buildDialOptions(): DialOption[] {
  // Stable alphabetical order by ISO-2 code for predictable lookup;
  // users recognise their flag faster than they recognise a locale name
  // inside this compact select, so we do not localize option labels.
  return DIAL_CODES.map((e) => ({
    code: e.code,
    dial: e.dial,
    flag: flagEmoji(e.code),
    label: `${flagEmoji(e.code)} ${e.code} ${e.dial}`,
  })).sort((a, b) => a.code.localeCompare(b.code));
}

export function PhoneField({
  name,
  required,
  defaultDialCountry = "TR",
  placeholder,
  className,
  id,
  autoComplete = "tel-national",
}: Props) {
  const options = useMemo(buildDialOptions, []);
  const [country, setCountry] = useState(defaultDialCountry);
  const [number, setNumber] = useState("");

  const dial = getDialCode(country) ?? "+90";
  const combined = number.trim() === "" ? "" : `${dial} ${number.trim()}`;

  const inputClass = cn(
    "rounded-[var(--radius-sm)] border border-[var(--color-border-default)]",
    "bg-[var(--color-bg-elevated)] text-text-primary px-3.5 py-2.5 text-[14px]",
    "placeholder:text-text-tertiary",
    "transition-colors duration-150 ease-out",
    "focus:border-[var(--color-accent-cobalt)] focus:outline-none",
    "focus:shadow-[var(--shadow-focus)]",
  );

  return (
    <div className={cn("grid grid-cols-[auto_1fr] gap-2", className)}>
      {/* Hidden input: the canonical combined value the server receives. */}
      <input type="hidden" name={name} value={combined} />

      <select
        aria-label={`${autoComplete} country code`}
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className={cn(inputClass, "pr-2")}
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>

      <input
        type="tel"
        id={id}
        // Allow the user to delete all digits; required=true on the hidden
        // input isn't honored by HTML validation, so enforce it on this
        // visible input and treat emptiness as invalid at submit time.
        required={required}
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/[^\d +()\-\s]/g, ""))}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode="tel"
        className={inputClass}
      />
    </div>
  );
}
