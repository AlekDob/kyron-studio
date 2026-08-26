"use client";

import { useState, type ReactElement } from "react";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { CHANNELS } from "@/components/chat/agent-channels";
import { VatReliefCase } from "./VatReliefCase";
import type { OrderRow } from "@/lib/gateway";

// Modulo Agevolazioni (IVA 4% L.104): canale a sinistra, pratica in
// lavorazione a destra. Nessuna coda: si entra caricando i documenti, o dal
// link "Valuta documenti" del modulo Ordini.
export function VatReliefWorkspace({
  initialOrderNumber,
}: {
  initialOrderNumber?: string;
}): ReactElement {
  const [order, setOrder] = useState<OrderRow | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-[var(--color-line)] lg:h-full">
        <AgentChannel
          agentId="vat-relief"
          {...CHANNELS["vat-relief"]}
          interactive
          initialPrompt={
            initialOrderNumber
              ? `Controlliamo la richiesta IVA agevolata dell'ordine ${initialOrderNumber}.`
              : undefined
          }
          onEvent={(ev) => {
            // La scheda ordine vive nel pannello destro, non in chat.
            if (ev.type !== "tool-result") return;
            const r = ev.result as {
              _ui?: { component?: string; props?: { order?: OrderRow } };
            };
            if (r?._ui?.component === "VatReliefCase" && r._ui.props?.order) {
              setOrder(r._ui.props.order);
            }
          }}
        />
      </div>

      <aside className="sticky top-0 hidden h-full w-[420px] flex-col overflow-hidden bg-[var(--color-paper-soft)] lg:flex">
        <div className="border-b border-[var(--color-line)] px-5 py-4">
          <h2 className="text-sm font-medium text-[var(--color-ink)]">Pratica</h2>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            L&apos;ordine collegato alla richiesta di IVA agevolata.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {order === null ? (
            <div className="px-5 py-4 text-xs text-[var(--color-ink-muted)]">
              <p>Nessuna pratica aperta.</p>
              <p className="mt-2">
                Carica i documenti nella chat. Se indichi il numero d&apos;ordine, qui compare
                il cliente, i prodotti e gli importi da confrontare.
              </p>
              <p className="mt-2">
                I documenti non vengono archiviati: restano in memoria 30 minuti.
              </p>
            </div>
          ) : (
            <VatReliefCase order={order} />
          )}
        </div>
      </aside>
    </div>
  );
}
