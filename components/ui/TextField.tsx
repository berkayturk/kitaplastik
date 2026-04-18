// components/ui/TextField.tsx
//
// Single-line text input with label + helper + error slot. aria-describedby
// wires helper/error to the input so screen readers announce correctly.
// Uses Field primitives; chrome classes shared with TextArea / SelectField.

import * as React from "react";
import { cn } from "@/lib/utils";
import { FieldRoot, Label, HelperText, ErrorText, fieldChromeClasses } from "./Field";

interface TextFieldProps extends Omit<React.ComponentProps<"input">, "size"> {
  label?: string;
  helperText?: string;
  errorText?: string;
  optionalText?: string;
  /** Wraps the input in the FieldRoot stack. Set false to use standalone. */
  withWrapper?: boolean;
}

export function TextField({
  id,
  label,
  helperText,
  errorText,
  required,
  optionalText,
  className,
  withWrapper = true,
  ...props
}: TextFieldProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = errorText ? `${inputId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  const input = (
    <input
      id={inputId}
      required={required}
      aria-invalid={errorText ? true : undefined}
      aria-describedby={describedBy}
      className={cn("h-11", fieldChromeClasses, className)}
      {...props}
    />
  );

  if (!withWrapper) return input;

  return (
    <FieldRoot>
      {label && (
        <Label htmlFor={inputId} required={required} optionalText={optionalText}>
          {label}
        </Label>
      )}
      {input}
      {errorText ? (
        <ErrorText id={errorId}>{errorText}</ErrorText>
      ) : helperText ? (
        <HelperText id={helperId}>{helperText}</HelperText>
      ) : null}
    </FieldRoot>
  );
}

export type { TextFieldProps };
