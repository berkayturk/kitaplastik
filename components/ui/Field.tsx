// components/ui/Field.tsx
//
// Shared primitives for form fields — Label, HelperText, ErrorText, FieldRoot.
// TextField / TextArea / SelectField / FileUploader all build on these so that
// label typography, required indicator, helper/error slot, and aria-describedby
// wiring stay consistent across the form surface.

import * as React from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends React.ComponentProps<"label"> {
  required?: boolean;
  optionalText?: string;
}

export function Label({
  className,
  children,
  required = false,
  optionalText,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        "block text-[14px] leading-[1.3] font-medium text-[var(--color-text-primary)]",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="ms-1 text-[var(--color-alert-red)]" aria-hidden="true">
          *
        </span>
      ) : optionalText ? (
        <span className="ms-2 text-[13px] font-normal text-[var(--color-text-tertiary)]">
          ({optionalText})
        </span>
      ) : null}
    </label>
  );
}

export function HelperText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[13px] leading-[1.4] text-[var(--color-text-secondary)]", className)}
      {...props}
    />
  );
}

export function ErrorText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      role="alert"
      className={cn("text-[13px] leading-[1.4] text-[var(--color-alert-red)]", className)}
      {...props}
    />
  );
}

/** Stack container for label + input + helper/error. */
export function FieldRoot({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

/** Shared input/textarea/select chrome — use as additional classes on the control. */
export const fieldChromeClasses = [
  "w-full rounded-[var(--radius-xs)] border bg-[var(--color-bg-elevated)] px-3.5",
  "text-[15px] leading-[1.5] text-[var(--color-text-primary)]",
  "border-[var(--color-border-default)]",
  "placeholder:text-[var(--color-text-tertiary)]",
  "transition-colors duration-200 ease-out",
  "hover:border-[var(--color-border-strong)]",
  "focus:outline-none focus:border-[var(--color-accent-cobalt)]",
  "focus:ring-[3px] focus:ring-[var(--color-accent-cobalt-tint)]",
  "disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)] disabled:text-[var(--color-text-tertiary)]",
  "aria-[invalid=true]:border-[var(--color-alert-red)]",
  "aria-[invalid=true]:focus:border-[var(--color-alert-red)]",
  "aria-[invalid=true]:focus:ring-[rgba(185,28,28,0.12)]",
].join(" ");
