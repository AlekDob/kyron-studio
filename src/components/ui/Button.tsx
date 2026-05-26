"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { focusRing, transitionBase, disabledBase } from "./_variants";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-medium",
    focusRing,
    transitionBase,
    disabledBase,
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-action)] text-[var(--color-paper)] hover:bg-[var(--color-action-hover)]",
        secondary:
          "bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-line)] hover:bg-[var(--color-action-subtle)]",
        ghost:
          "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-action-subtle)]",
        link:
          "bg-transparent text-[var(--color-accent)] underline-offset-4 hover:underline rounded-none px-0",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      iconLeft,
      iconRight,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    const inner = asChild ? (
      children
    ) : (
      <>
        {loading ? <Spinner /> : iconLeft}
        {children}
        {!loading && iconRight}
      </>
    );
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {inner}
      </Comp>
    );
  },
);

Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
