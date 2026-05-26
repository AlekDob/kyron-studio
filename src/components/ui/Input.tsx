"use client";
import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { transitionBase, disabledBase } from "./_variants";

const inputVariants = cva(
  cn(
    "w-full bg-[var(--color-paper)] text-[var(--color-ink)] rounded-[var(--radius-input)] border placeholder:text-[var(--color-ink-muted)]",
    transitionBase,
    disabledBase,
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
  ),
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-5 text-base",
      },
      invalid: {
        true: "border-[var(--color-critical)] focus-visible:border-[var(--color-critical)] focus-visible:ring-[color-mix(in_srgb,var(--color-critical)_15%,transparent)]",
        false:
          "border-[var(--color-line)] focus-visible:border-[var(--color-accent)] focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_15%,transparent)]",
      },
    },
    defaultVariants: { size: "md", invalid: false },
  },
);

type InputBaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

export interface InputProps extends InputBaseProps, VariantProps<typeof inputVariants> {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, iconLeft, iconRight, ...props }, ref) => {
    if (!iconLeft && !iconRight) {
      return (
        <input
          ref={ref}
          className={cn(inputVariants({ size, invalid }), className)}
          aria-invalid={invalid || undefined}
          {...props}
        />
      );
    }
    return (
      <div className="relative inline-flex w-full items-center">
        {iconLeft && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 inline-flex text-[var(--color-ink-muted)]"
          >
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            inputVariants({ size, invalid }),
            iconLeft && "pl-10",
            iconRight && "pr-10",
            className,
          )}
          aria-invalid={invalid || undefined}
          {...props}
        />
        {iconRight && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 inline-flex text-[var(--color-ink-muted)]"
          >
            {iconRight}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

type TextareaBaseProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export interface TextareaProps extends TextareaBaseProps {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full bg-[var(--color-paper)] text-[var(--color-ink)] rounded-[var(--radius-input)] border px-4 py-3 placeholder:text-[var(--color-ink-muted)]",
        transitionBase,
        disabledBase,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        invalid
          ? "border-[var(--color-critical)] focus-visible:border-[var(--color-critical)] focus-visible:ring-[color-mix(in_srgb,var(--color-critical)_15%,transparent)]"
          : "border-[var(--color-line)] focus-visible:border-[var(--color-accent)] focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_15%,transparent)]",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

type SelectBaseProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">;

export interface SelectProps extends SelectBaseProps {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full appearance-none bg-[var(--color-paper)] text-[var(--color-ink)] rounded-[var(--radius-input)] border px-3 pr-9 text-base",
        transitionBase,
        disabledBase,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        invalid
          ? "border-[var(--color-critical)] focus-visible:border-[var(--color-critical)] focus-visible:ring-[color-mix(in_srgb,var(--color-critical)_15%,transparent)]"
          : "border-[var(--color-line)] focus-visible:border-[var(--color-accent)] focus-visible:ring-[color-mix(in_srgb,var(--color-accent)_15%,transparent)]",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
);
Select.displayName = "Select";
