"use client";

import {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
  icon?: ReactElement;
  position?: "bottom-right" | "top-right";
}

export function MobileChatOverlay({
  children,
  label = "Chat",
  icon,
  position = "bottom-right",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  const fabStyle =
    position === "top-right"
      ? { top: "calc(env(safe-area-inset-top) + 60px)", right: "16px" }
      : { bottom: "calc(env(safe-area-inset-bottom) + 88px)", right: "16px" };

  return createPortal(
    <>
      {!open && (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Apri ${label}`}
          className="lg:hidden flex items-center justify-center rounded-full shadow-lg bg-[var(--color-accent)] text-[var(--color-paper)] hover:brightness-110 active:scale-95 transition-all"
          style={{
            position: "fixed",
            zIndex: 50,
            width: "48px",
            height: "48px",
            ...fabStyle,
          }}
        >
          {icon ?? <MessageCircle className="h-5 w-5" />}
        </button>
      )}

      {open && (
        <div
          className="lg:hidden flex flex-col bg-[var(--color-paper)]"
          style={{ position: "fixed", inset: 0, zIndex: 60 }}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {label}
            </p>
            <button
              type="button"
              onClick={toggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-card)] text-[var(--color-ink-soft)] hover:bg-[var(--color-action-subtle)]"
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
