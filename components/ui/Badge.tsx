// components/ui/Badge.tsx
//
// Status pills — mono uppercase, tokenized tint + ink pairs. Used in admin
// inbox rows and spec metadata. Never the primary visual element.

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1",
    "font-mono text-[11px] font-medium uppercase tracking-[0.08em]",
    "rounded-[var(--radius-xs)] px-2 py-1 whitespace-nowrap",
  ].join(" "),
  {
    variants: {
      variant: {
        neutral: "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]",
        info: "bg-[var(--color-accent-cobalt-tint)] text-[var(--color-accent-cobalt)]",
        success: "bg-[var(--color-accent-jade-tint)] text-[var(--color-accent-jade-hover)]",
        warning: "bg-[#FEF3C7] text-[#92400E]",
        danger: "bg-[#FEE2E2] text-[var(--color-alert-red)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
export type { BadgeProps };
