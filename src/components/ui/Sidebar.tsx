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
  position?: "left" | "right";
}

const SidebarRoot = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      collapsed = false,
      width = 240,
      collapsedWidth = 64,
      position = "left",
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
        "flex h-full flex-col bg-[var(--color-paper)] border-[var(--color-line)]",
        position === "left" ? "border-r" : "border-l",
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
      <span className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">
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
        "flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2 text-sm text-left",
        focusRing,
        transitionBase,
        active
          ? "bg-[var(--color-action-subtle)] font-medium text-[var(--color-ink)]"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-action-subtle)] hover:text-[var(--color-ink)]",
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
      className={cn("mt-auto border-t border-[var(--color-line)] px-2 py-3", className)}
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
