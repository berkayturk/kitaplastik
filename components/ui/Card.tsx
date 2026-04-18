// components/ui/Card.tsx
//
// Flat-first card surface. Hairline border by default; optional card shadow
// when `elevated`; optional hover transition when `interactive`.
// No hover scale, no tilt, no gradient overlay — per plan §2 principle #3.

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {
  /** Adds subtle hover state — bg shift and shadow. Use for clickable cards. */
  interactive?: boolean;
  /** Applies the shadow-card token at rest. */
  elevated?: boolean;
  /** Padding preset. Default "md" = 32px desktop. "sm" for dense tables, "lg" for hero. */
  padding?: "sm" | "md" | "lg";
}

export function Card({
  className,
  interactive = false,
  elevated = false,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)]",
        "border-[var(--color-border-hairline)]",
        padding === "sm" && "p-5",
        padding === "md" && "p-8",
        padding === "lg" && "p-10",
        elevated && "shadow-[var(--shadow-card)]",
        interactive &&
          "transition-colors duration-200 ease-out hover:border-[var(--color-border-default)] hover:shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "font-display mt-3 text-[26px] leading-[1.2] font-medium tracking-[-0.01em]",
        className,
      )}
      style={{ fontOpticalSizing: "auto", ...(props.style ?? {}) }}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "mt-3 text-[15px] leading-[1.55] text-[var(--color-text-secondary)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-6 flex items-center gap-3 border-t border-[var(--color-border-hairline)] pt-4",
        className,
      )}
      {...props}
    />
  );
}

export type { CardProps };
