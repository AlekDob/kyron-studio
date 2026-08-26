"use client";

import { useState, type ReactElement } from "react";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { CHANNELS } from "@/components/chat/agent-channels";
import {
  AnomalyReport,
  type Anomaly,
} from "@/components/chat/generative/AnomalyReport";

// Modulo Controlli: split-pane come Portali — chat agente a sinistra, ultimo
// report anomalie a destra. Tutto in sola lettura (nessuna modifica ai portali).
export function ChecksWorkspace(): ReactElement {
  const [report, setReport] = useState<Anomaly[] | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-[var(--color-line)] lg:h-full">
        <AgentChannel
          agentId="checks"
          {...CHANNELS.checks}
          onEvent={(ev) => {
            // Il pannello destro mostra le anomalie dell'ultimo controllo.
            if (ev.type !== "tool-result") return;
            const r = ev.result as { anomalies?: Anomaly[] } | undefined;
            if (Array.isArray(r?.anomalies)) setReport(r.anomalies);
          }}
        />
      </div>

      <aside className="sticky top-0 hidden h-full w-[420px] flex-col overflow-hidden bg-[var(--color-paper-soft)] lg:flex">
        <div className="border-b border-[var(--color-line)] px-5 py-4">
          <h2 className="text-sm font-medium text-[var(--color-ink)]">Ultimo controllo</h2>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            Prezzi e sconti dei portali su Saleor produzione. Sola lettura.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {report === null ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              Nessun controllo eseguito in questa sessione. Chiedi un controllo nella chat.
            </p>
          ) : (
            <AnomalyReport anomalies={report} />
          )}
        </div>
      </aside>
    </div>
  );
}
