// components/ui/Checkbox.tsx
//
// Custom-visual checkbox wrapping a native <input type="checkbox">. Native
// input preserves keyboard and screen-reader behavior; the visual is drawn
// with CSS + an SVG overlay controlled via peer-checked. Focus ring matches
// the global shadow-focus token.

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.ComponentProps<"input">, "type"> {
  label?: React.ReactNode;
  helperText?: string;
}

export function Checkbox({ id, label, helperText, className, ...props }: CheckboxProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group flex cursor-pointer items-start gap-3",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="relative mt-[2px] inline-flex size-[18px] shrink-0 items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          className={cn(
            "peer cursor-inherit absolute inset-0 m-0 size-full appearance-none",
            "rounded-[var(--radius-xs)] border-[1.5px]",
            "border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]",
            "transition-colors duration-200 ease-out",
            "hover:border-[var(--color-accent-cobalt)]",
            "checked:border-[var(--color-accent-cobalt)] checked:bg-[var(--color-accent-cobalt)]",
            "focus-visible:shadow-[var(--shadow-focus)] focus-visible:outline-none",
            "disabled:cursor-not-allowed",
          )}
          {...props}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none relative h-3 w-3 opacity-0 peer-checked:opacity-100"
          fill="none"
        >
          <path
            d="M3 8.5L6.5 11.5L13 4.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {(label || helperText) && (
        <div className="text-[15px] leading-[1.45]">
          {label && <span className="text-[var(--color-text-primary)]">{label}</span>}
          {helperText && (
            <span className="mt-1 block text-[13px] text-[var(--color-text-secondary)]">
              {helperText}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

export type { CheckboxProps };
