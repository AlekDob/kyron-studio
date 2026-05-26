"use client";
import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { focusRing } from "./_variants";

const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border font-medium",
  {
    variants: {
      variant: {
        neutral:
          "bg-[var(--color-paper-soft)] text-[var(--color-ink-soft)] border-[var(--color-line)]",
        accent:
          "bg-[var(--color-accent-tint)] text-[var(--color-accent)] border-[color-mix(in_srgb,var(--color-accent)_20%,transparent)]",
        tertiary:
          "bg-[color-mix(in_srgb,var(--color-positive)_10%,transparent)] text-[var(--color-positive)] border-[color-mix(in_srgb,var(--color-positive)_25%,transparent)]",
        warning:
          "bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_25%,transparent)]",
        critical:
          "bg-[color-mix(in_srgb,var(--color-critical)_10%,transparent)] text-[var(--color-critical)] border-[color-mix(in_srgb,var(--color-critical)_25%,transparent)]",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface PillProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {
  removable?: boolean;
  onRemove?: () => void;
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(
  ({ className, variant, size, removable, onRemove, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(pillVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Rimuovi"
          className={cn(
            "ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-[var(--radius-pill)] hover:bg-current/10",
            focusRing,
          )}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  ),
);
Pill.displayName = "Pill";
