import type { ReactNode } from "react";
import { DataChat } from "./DataChat";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";

interface Props {
  slug: string;
  id?: string;
  children: ReactNode;
}

export function DataWorkspace({ slug, id, children }: Props) {
  const chatHeader = (
    <header className="px-5 py-3 border-b border-[var(--color-line)]">
      <p className="eyebrow">Agente · Editor Dati</p>
      <p className="text-xs text-[var(--color-ink-muted)] mt-1">
        Contesto: <code>{slug}</code>
        {id ? <> · #{id}</> : null}
      </p>
    </header>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 h-full overflow-hidden">
      <div className="overflow-y-auto">{children}</div>
      <aside className="hidden lg:flex flex-col border-l border-[var(--color-line)] bg-[var(--color-paper-soft)] sticky top-0 h-full overflow-hidden">
        {chatHeader}
        <DataChat slug={slug} id={id} />
      </aside>
      <MobileChatOverlay label="Editor Dati">
        {chatHeader}
        <DataChat slug={slug} id={id} />
      </MobileChatOverlay>
    </div>
  );
}
