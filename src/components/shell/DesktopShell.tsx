"use client";
// Source: Virgilio apps/client/src/shell/DesktopShell.tsx — semplificato (no resizable panel, no AnimatePresence).
import { useState, useCallback, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeProvider } from "./ThemeProvider";
import { CommandPaletteProvider } from "./CommandPaletteProvider";
import { AppSidebar } from "./AppSidebar";

interface Props {
  children: ReactNode;
  userEmail?: string;
}

export function DesktopShell({ children, userEmail }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <ThemeProvider>
      <CommandPaletteProvider>
        <div className="flex h-[100dvh] bg-[var(--color-paper)]">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-[248px] shrink-0">
            <AppSidebar userEmail={userEmail} />
          </div>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={closeSidebar}
              aria-hidden="true"
            />
          )}

          {/* Mobile drawer */}
          <div
            className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-200 ease-out lg:hidden ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <AppSidebar userEmail={userEmail} />
          </div>

          {/* Main content */}
          <main className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Mobile header */}
            <div className="shrink-0 z-30 flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-card)] text-[var(--color-ink-soft)] hover:bg-[var(--color-action-subtle)] hover:text-[var(--color-ink)]"
                aria-label={sidebarOpen ? "Chiudi menu" : "Apri menu"}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <span className="text-sm font-semibold text-[var(--color-ink)]">
                Studio
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
          </main>
        </div>
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}
