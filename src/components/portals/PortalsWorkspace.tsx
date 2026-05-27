"use client";

import { useState, type ReactElement } from "react";
import { PortalsChat } from "./PortalsChat";
import { LivePortalCard } from "./LivePortalCard";

export interface PortalDraft {
  nome?: string;
  slug?: string;
  sitoUfficiale?: string;
  codiceMeccanografico?: string;
  via?: string;
  cap?: string;
  city?: string;
  provincia?: string;
  selectedProducts?: string[];
  bundles?: Array<{ name: string; priceEur: number; components: string[] }>;
  shipToSchool?: boolean;
  saved?: boolean;
}

export function PortalsWorkspace(): ReactElement {
  const [draft, setDraft] = useState<PortalDraft>({});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 min-h-screen">
      <div className="flex flex-col border-r border-[var(--color-line)] h-screen overflow-hidden">
        <header className="px-5 py-3 border-b border-[var(--color-line)]">
          <p className="eyebrow">Agente · Portali</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Onboarding + gestione portali
          </p>
        </header>
        <PortalsChat onDraftUpdate={setDraft} />
      </div>
      <aside className="hidden lg:flex flex-col bg-[var(--color-paper-soft)] sticky top-0 h-screen overflow-y-auto">
        <header className="px-5 py-3 border-b border-[var(--color-line)]">
          <p className="eyebrow">Scheda portale</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            {draft.nome ?? "In attesa dei dati..."}
          </p>
        </header>
        <div className="flex-1 px-5 py-4">
          <LivePortalCard draft={draft} />
        </div>
      </aside>
    </div>
  );
}
