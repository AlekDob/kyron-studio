import type { ReactNode } from "react";
import { PortalsChat } from "./PortalsChat";

interface Props {
  slug?: string;
  children: ReactNode;
}

export function PortalsWorkspace({ slug, children }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 min-h-screen">
      <div className="overflow-y-auto">{children}</div>
      <aside className="hidden lg:flex flex-col border-l border-[var(--color-line)] bg-[var(--color-paper-soft)] sticky top-0 h-screen overflow-hidden">
        <header className="px-5 py-3 border-b border-[var(--color-line)]">
          <p className="eyebrow">Agente · Portali</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            {slug ? (
              <>
                Portale: <code>{slug}</code>
              </>
            ) : (
              "Onboarding + gestione portali"
            )}
          </p>
        </header>
        <PortalsChat slug={slug} />
      </aside>
    </div>
  );
}
