// components/ui/SelectField.tsx
//
// Native <select> styled to match Field chrome. Custom chevron drawn via SVG
// overlay (not appearance:auto) so color + size stay tokenized and consistent
// across browsers. Native select keeps keyboard behavior and mobile wheel UI
// without a Radix dependency — revisit with Radix Select if admin later needs
// multi-select, search, or async options.

import * as React from "react";
import { cn } from "@/lib/utils";
import { FieldRoot, Label, HelperText, ErrorText, fieldChromeClasses } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends Omit<React.ComponentProps<"select">, "size" | "children"> {
  label?: string;
  helperText?: string;
  errorText?: string;
  optionalText?: string;
  options: ReadonlyArray<SelectOption>;
  placeholder?: string;
  withWrapper?: boolean;
}

export function SelectField({
  id,
  label,
  helperText,
  errorText,
  required,
  optionalText,
  options,
  placeholder,
  className,
  withWrapper = true,
  ...props
}: SelectFieldProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = errorText ? `${inputId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  const control = (
    <div className="relative">
      <select
        id={inputId}
        required={required}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 appearance-none pe-10",
          fieldChromeClasses,
          // force value color when placeholder selected
          !props.value && !props.defaultValue && "text-[var(--color-text-tertiary)]",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </div>
  );

  if (!withWrapper) return control;

  return (
    <FieldRoot>
      {label && (
        <Label htmlFor={inputId} required={required} optionalText={optionalText}>
          {label}
        </Label>
      )}
      {control}
      {errorText ? (
        <ErrorText id={errorId}>{errorText}</ErrorText>
      ) : helperText ? (
        <HelperText id={helperId}>{helperText}</HelperText>
      ) : null}
    </FieldRoot>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="pointer-events-none absolute end-3.5 top-1/2 size-[14px] -translate-y-1/2 text-[var(--color-text-secondary)]"
      fill="none"
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export type { SelectFieldProps };
