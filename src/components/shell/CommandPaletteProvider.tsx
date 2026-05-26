"use client";
// Source: Virgilio apps/client/src/shell/CommandPaletteProvider.tsx
// Adattato per Next.js App Router (useRouter al posto di useModuleRouter).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Command as CMD } from "cmdk";
import { useRouter } from "next/navigation";
import { MODULES } from "./modules";

interface PaletteContextValue {
  open: () => void;
  close: () => void;
}

const Ctx = createContext<PaletteContextValue | undefined>(undefined);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleGoto = (href: string): void => {
    router.push(href);
    close();
  };

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[color-mix(in_srgb,var(--color-ink)_30%,transparent)] pt-[15vh] backdrop-blur-sm">
          <div className="w-[640px] max-w-[90vw] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[var(--shadow-modal)]">
            <CMD label="Comandi" className="flex flex-col font-sans">
              <div className="border-b border-[var(--color-line)]">
                <CMD.Input
                  placeholder="Scrivi un comando o cerca un'app..."
                  className="w-full bg-transparent px-5 py-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
                  autoFocus
                />
              </div>

              <CMD.List className="max-h-96 overflow-y-auto p-2">
                <CMD.Empty className="py-8 text-center text-sm text-[var(--color-ink-muted)]">
                  Nessun risultato
                </CMD.Empty>

                <CMD.Group
                  heading="App"
                  className="[&_[cmdk-group-heading]]:mono-caps [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[var(--color-ink-muted)]"
                >
                  {MODULES.map((m) => {
                    const Icon = m.icon;
                    return (
                      <CMD.Item
                        key={m.id}
                        value={`vai-a-${m.id} ${m.label} ${m.description}`}
                        onSelect={() => handleGoto(m.href)}
                        className="flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2.5 text-sm text-[var(--color-ink)] aria-selected:bg-[var(--color-action-subtle)]"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{m.label}</div>
                          <div className="truncate text-xs text-[var(--color-ink-muted)]">
                            {m.description}
                          </div>
                        </div>
                        {m.status === "coming-soon" && (
                          <span className="mono-caps text-[var(--color-ink-muted)]">presto</span>
                        )}
                      </CMD.Item>
                    );
                  })}
                </CMD.Group>
              </CMD.List>

              <div className="mono-caps flex items-center justify-between border-t border-[var(--color-line)] px-4 py-2.5 text-[var(--color-ink-muted)]">
                <span>↵ seleziona</span>
                <span>esc chiudi</span>
              </div>
            </CMD>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useCommandPalette(): PaletteContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommandPalette richiede provider");
  return ctx;
}
