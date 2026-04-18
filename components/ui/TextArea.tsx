// components/ui/TextArea.tsx
//
// Multi-line text input with label + helper + error slot. min-height 120px,
// resize vertical only — horizontal resize breaks column-constrained forms.

import * as React from "react";
import { cn } from "@/lib/utils";
import { FieldRoot, Label, HelperText, ErrorText, fieldChromeClasses } from "./Field";

interface TextAreaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  helperText?: string;
  errorText?: string;
  optionalText?: string;
  withWrapper?: boolean;
}

export function TextArea({
  id,
  label,
  helperText,
  errorText,
  required,
  optionalText,
  className,
  withWrapper = true,
  rows = 5,
  ...props
}: TextAreaProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = errorText ? `${inputId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  const textarea = (
    <textarea
      id={inputId}
      rows={rows}
      required={required}
      aria-invalid={errorText ? true : undefined}
      aria-describedby={describedBy}
      className={cn("min-h-[120px] resize-y py-3", fieldChromeClasses, className)}
      {...props}
    />
  );

  if (!withWrapper) return textarea;

  return (
    <FieldRoot>
      {label && (
        <Label htmlFor={inputId} required={required} optionalText={optionalText}>
          {label}
        </Label>
      )}
      {textarea}
      {errorText ? (
        <ErrorText id={errorId}>{errorText}</ErrorText>
      ) : helperText ? (
        <HelperText id={helperId}>{helperText}</HelperText>
      ) : null}
    </FieldRoot>
  );
}

export type { TextAreaProps };
