"use client";
// Source: Virgilio @virgilio/ui (packages/ui/src/primitives/ActionCard.tsx)
import { forwardRef, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { focusRing, transitionBase } from "./_variants";

const actionCardVariants = cva(
  cn(
    "group flex flex-col gap-3 text-left bg-[var(--color-paper)] rounded-[var(--radius-card)] border border-[var(--color-line)] p-5 shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:border-[var(--color-line-strong)]",
    focusRing,
    transitionBase,
  ),
  {
    variants: {
      variant: {
        default: "",
        accent: "border-l-2 border-l-[var(--color-accent)]",
        positive: "border-l-2 border-l-[var(--color-positive)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface ActionCardProps extends VariantProps<typeof actionCardVariants> {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  onClick?: () => void;
  asLink?: { href: string };
  className?: string;
}

export const ActionCard = forwardRef<HTMLElement, ActionCardProps>(
  ({ title, description, icon, badge, variant, onClick, asLink, className }, ref) => {
    const content = (
      <>
        <div className="flex items-start justify-between gap-3">
          {icon && (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-action-subtle)] text-[var(--color-ink)]">
              {icon}
            </span>
          )}
          {badge && <span className="ml-auto">{badge}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
          {description && (
            <p className="text-sm text-[var(--color-ink-muted)]">{description}</p>
          )}
        </div>
      </>
    );

    const classes = cn(actionCardVariants({ variant }), className);

    if (asLink) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={asLink.href}
          className={classes}
        >
          {content}
        </a>
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={classes}
      >
        {content}
      </button>
    );
  },
);
ActionCard.displayName = "ActionCard";
