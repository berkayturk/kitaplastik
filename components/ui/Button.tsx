// components/ui/Button.tsx
//
// Spec: plan §8 Prompt M2. German-catalogue restraint — no gradients, no
// shimmer, no scale-on-hover, no pill radius, no uppercase labels.
// Color transitions only. Press produces translateY(1px), nothing else.

import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "font-sans font-medium",
    "rounded-[var(--radius-sm)]",
    "transition-colors duration-200 ease-out",
    "outline-none focus-visible:shadow-[var(--shadow-focus)]",
    "disabled:cursor-not-allowed",
    "active:translate-y-[1px]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-accent-cobalt)] text-[var(--color-text-inverse)]",
          "hover:bg-[var(--color-accent-cobalt-hover)]",
          "disabled:bg-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]",
        ].join(" "),
        secondary: [
          "border-2 border-[var(--color-accent-jade)] bg-transparent text-[var(--color-accent-jade)]",
          "hover:bg-[var(--color-accent-jade-tint)] hover:border-[var(--color-accent-jade-hover)] hover:text-[var(--color-accent-jade-hover)]",
          "disabled:border-[var(--color-border-default)] disabled:text-[var(--color-text-tertiary)]",
        ].join(" "),
        tertiary: [
          "bg-transparent text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-border-hairline)]",
          "disabled:text-[var(--color-text-tertiary)]",
        ].join(" "),
        destructive: [
          "bg-[var(--color-alert-red)] text-[var(--color-text-inverse)]",
          "hover:opacity-92",
        ].join(" "),
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-[14px] [&_svg]:size-4",
        md: "h-10 gap-2 px-4 text-[15px] [&_svg]:size-4",
        lg: "h-12 gap-2.5 px-6 text-[16px] font-semibold [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

function Spinner({ size }: { size: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? 18 : 16;
  return (
    <svg
      aria-hidden="true"
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "size">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  disabled,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const isDisabled = disabled || isLoading;
  return (
    <Comp
      aria-busy={isLoading || undefined}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size={size ?? "md"} />
          <span className="sr-only">Yükleniyor</span>
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </Comp>
  );
}

export { buttonVariants };
export type { ButtonProps };
