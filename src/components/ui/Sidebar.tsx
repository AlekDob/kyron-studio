"use client";
// Source: Virgilio @virgilio/ui (packages/ui/src/primitives/Sidebar.tsx)
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { focusRing, transitionBase } from "./_variants";

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  width?: number;
  collapsedWidth?: number;
}

const SidebarRoot = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      collapsed = false,
      width = 240,
      collapsedWidth = 64,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => (
    <aside
      ref={ref}
      data-collapsed={collapsed}
      className={cn(
        // Trasparente e senza bordo: si appoggia sulla scrivania grigia,
        // le sfere dello sfondo si vedono attraverso.
        "flex h-full flex-col bg-transparent",
        transitionBase,
        "transition-[width] duration-200",
        className,
      )}
      style={{ width: collapsed ? collapsedWidth : width, ...style }}
      {...props}
    >
      {children}
    </aside>
  ),
);
SidebarRoot.displayName = "Sidebar";

const Section = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { title?: string }
>(({ title, className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1 px-2 py-3", className)} {...props}>
    {title && (
      <span className="eyebrow px-3 pb-1">
        {title}
      </span>
    )}
    {children}
  </div>
));
Section.displayName = "Sidebar.Section";

export interface SidebarItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  active?: boolean;
}

const Item = forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ icon, active, children, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-[13px] text-left",
        focusRing,
        transitionBase,
        active
          ? "bg-[var(--studio-active-surface)] font-medium text-[var(--color-ink)]"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--studio-hover-surface)] hover:text-[var(--color-ink)]",
        className,
      )}
      {...props}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  ),
);
Item.displayName = "Sidebar.Item";

const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-auto px-2 py-3", className)}
      {...props}
    />
  ),
);
Footer.displayName = "Sidebar.Footer";

export const Sidebar = Object.assign(SidebarRoot, {
  Section,
  Item,
  Footer,
});
