"use client";
// Shell dello Studio: scrivania grigia con sfere indaco (studio-gradient-layer),
// sidebar trasparente appoggiata sopra, contenuto su una lastra di vetro
// (studio-content-inset). Stesso linguaggio dello Studio global-games.
import { useState, useCallback, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { CommandPaletteProvider } from "./CommandPaletteProvider";
import { PageTransition } from "./PageTransition";
import { AppSidebar } from "./AppSidebar";

interface Props {
  children: ReactNode;
  userEmail?: string;
}

export function DesktopShell({ children, userEmail }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Hover sulla rail compatta: espande la sidebar in overlay (no reflow).
  const [railHover, setRailHover] = useState(false);
  const pathname = usePathname();

  // Su /preview la sidebar parte collassata: massimo spazio all'iframe.
  const compact = pathname?.startsWith("/preview") ?? false;

  useEffect(() => {
    setSidebarOpen(false);
    setRailHover(false);
  }, [pathname]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <CommandPaletteProvider>
      <div className="relative flex h-[100dvh] overflow-hidden">
        {/* Sfondo: grigio + due sfere indaco che cambiano tinta piano. */}
        <div
          aria-hidden="true"
          className="studio-gradient-layer pointer-events-none absolute inset-0 -z-10"
        />

        {/* Desktop sidebar — su /preview e' una rail di sole icone che
            si espande in overlay al passaggio del mouse */}
        {compact ? (
          <div
            className="hidden lg:block w-[56px] shrink-0 relative z-40"
            onMouseEnter={() => setRailHover(true)}
            onMouseLeave={() => setRailHover(false)}
          >
            <div
              className={`absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-200 ease-out ${
                railHover ? "w-[248px]" : "w-[56px]"
              }`}
            >
              <AppSidebar userEmail={userEmail} collapsed={!railHover} />
            </div>
          </div>
        ) : (
          <div className="hidden lg:block w-[248px] shrink-0">
            <AppSidebar userEmail={userEmail} />
          </div>
        )}

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Mobile drawer — opaco: fuori dalla lastra serve un fondo pieno */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[280px] transform bg-[var(--color-paper)] transition-transform duration-200 ease-out lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AppSidebar userEmail={userEmail} />
        </div>

        {/* Main content — dentro la lastra */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden px-2 py-4 pl-0 max-lg:pl-2">
          <main className="studio-content-inset flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Mobile header */}
            <div className="shrink-0 z-30 flex items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 lg:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-ink-soft)] hover:bg-[var(--studio-hover-surface)] hover:text-[var(--color-ink)]"
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

        <PageTransition />
      </div>
    </CommandPaletteProvider>
  );
}
