"use client";
// Source: Virgilio @virgilio/ui (packages/ui/src/primitives/SourceCard.tsx)
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Pill } from "@studiofuturo/studio-core";
import { focusRing, transitionBase } from "./_variants";

export type SourceType = "doc" | "law" | "web";

export interface SourceCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  index?: number;
  type?: SourceType;
  href?: string;
}

const typeLabel: Record<SourceType, string> = {
  doc: "Documento",
  law: "Norma",
  web: "Web",
};

export const SourceCard = forwardRef<HTMLElement, SourceCardProps>(
  ({ title, subtitle, index, type = "doc", href, className, ...props }, ref) => {
    const content = (
      <>
        {typeof index === "number" && (
          <Pill variant="accent" size="sm">
            {index}
          </Pill>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-[var(--color-ink)]">{title}</span>
          {subtitle && (
            <span className="truncate text-xs text-[var(--color-ink-muted)]">{subtitle}</span>
          )}
        </div>
        <span className="ml-auto text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
          {typeLabel[type]}
        </span>
      </>
    );

    const classes = cn(
      "flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] p-3",
      "hover:border-[var(--color-line-strong)]",
      focusRing,
      transitionBase,
      className,
    );

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...(props as HTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        {...(props as HTMLAttributes<HTMLDivElement>)}
      >
        {content}
      </div>
    );
  },
);
SourceCard.displayName = "SourceCard";
