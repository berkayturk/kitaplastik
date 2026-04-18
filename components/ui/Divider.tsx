// components/ui/Divider.tsx
//
// Hairline separator. Horizontal uses <hr>; vertical uses <div role="separator">.
// Always tokenized (--color-border-hairline). No text/label variant — if a
// section break needs a label, use an eyebrow + H2 instead.

import * as React from "react";
import { cn } from "@/lib/utils";

interface DividerProps extends Omit<React.ComponentProps<"hr">, "role"> {
  orientation?: "horizontal" | "vertical";
  /** Use stronger color for structural section breaks. */
  strong?: boolean;
}

export function Divider({
  className,
  orientation = "horizontal",
  strong = false,
  ...props
}: DividerProps) {
  const colorClass = strong
    ? "bg-[var(--color-border-default)]"
    : "bg-[var(--color-border-hairline)]";

  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("h-full w-px shrink-0", colorClass, className)}
      />
    );
  }

  return <hr className={cn("h-px border-0", colorClass, className)} {...props} />;
}

export type { DividerProps };
