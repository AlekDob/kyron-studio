"use client";
// Source: Virgilio @virgilio/ui (packages/ui/src/primitives/IconButton.tsx)
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { focusRing, transitionBase, disabledBase } from "./_variants";

const iconButtonVariants = cva(
  cn(
    "inline-flex items-center justify-center",
    focusRing,
    transitionBase,
    disabledBase,
    "active:scale-[0.97]",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-action-subtle)]",
        ghost:
          "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-action-subtle)]",
      },
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
      },
      shape: {
        round: "rounded-[var(--radius-pill)]",
        card: "rounded-[var(--radius-card)]",
      },
    },
    defaultVariants: { variant: "default", size: "md", shape: "card" },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, shape, icon, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(iconButtonVariants({ variant, size, shape }), className)}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
    </button>
  ),
);
IconButton.displayName = "IconButton";
