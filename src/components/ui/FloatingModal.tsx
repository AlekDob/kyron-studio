"use client";
// Source: Virgilio @virgilio/ui (packages/ui/src/primitives/FloatingModal.tsx)
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { IconButton } from "@studiofuturo/studio-core";

const contentVariants = cva(
  cn(
    // z-[80]: stessa scala del Drawer del core. Senza, il modale finisce sotto
    // il workspace (DesktopShell arriva a z-50) e sembra aprirsi dietro la pagina.
    "fixed z-[80] bg-[var(--color-paper)] rounded-[var(--radius-card)] shadow-[var(--shadow-modal)] outline-none",
  ),
  {
    variants: {
      size: {
        sm: "w-[90vw] max-w-md",
        md: "w-[90vw] max-w-lg",
        lg: "w-[92vw] max-w-2xl",
        fullscreen: "w-[100vw] h-[100vh] max-w-none rounded-none",
      },
      position: {
        center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[88vh]",
        right: "right-0 top-0 h-full max-h-screen rounded-none rounded-l-[var(--radius-card)]",
      },
    },
    defaultVariants: { size: "md", position: "center" },
  },
);

export interface FloatingModalProps extends VariantProps<typeof contentVariants> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dismissOnOverlay?: boolean;
  ariaLabel?: string;
}

const Root = ({
  open,
  onOpenChange,
  children,
  size,
  position,
  dismissOnOverlay = true,
  ariaLabel,
}: FloatingModalProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-[70] bg-[color-mix(in_srgb,var(--color-ink)_40%,transparent)] backdrop-blur-sm"
        onClick={dismissOnOverlay ? undefined : (e) => e.preventDefault()}
      />
      <DialogPrimitive.Content
        className={contentVariants({ size, position })}
        aria-label={ariaLabel}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);

const Header = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div"> & { onClose?: () => void; title?: string }
>(({ className, children, onClose, title, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-start justify-between gap-4 border-b border-[var(--color-line)] px-6 py-4",
      className,
    )}
    {...props}
  >
    <div className="flex flex-col gap-1">
      {title && (
        <DialogPrimitive.Title className="text-lg font-semibold text-[var(--color-ink)]">
          {title}
        </DialogPrimitive.Title>
      )}
      {children}
    </div>
    {onClose && (
      <DialogPrimitive.Close asChild>
        <IconButton
          aria-label="Chiudi"
          variant="ghost"
          size="sm"
          icon={<span>×</span>}
          onClick={onClose}
        />
      </DialogPrimitive.Close>
    )}
  </div>
));
Header.displayName = "FloatingModal.Header";

const Body = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 py-5 overflow-y-auto", className)} {...props} />
  ),
);
Body.displayName = "FloatingModal.Body";

const Footer = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4",
        className,
      )}
      {...props}
    />
  ),
);
Footer.displayName = "FloatingModal.Footer";

const Description = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[var(--color-ink-muted)]", className)}
    {...props}
  />
));
Description.displayName = "FloatingModal.Description";

export const FloatingModal = Object.assign(Root, {
  Header,
  Body,
  Footer,
  Description,
});
