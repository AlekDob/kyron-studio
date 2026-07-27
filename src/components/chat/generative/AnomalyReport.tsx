"use client";

import { type ReactElement } from "react";

// Report anomalie prezzi/sconti (modulo Controlli). Read-only: mostra cosa ha
// trovato il check deterministico di studio-server, raggruppato per tipo.
export interface Anomaly {
  type: string;
  severity: "high" | "medium" | "low";
  portal: string;
  portalName: string;
  kit?: string;
  expected?: number;
  shown?: number;
  delta?: number;
  detail: string;
}

const EURO = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

// Etichette leggibili: stesse del report email (studio-server/price-guard/render.ts).
const LABELS: Record<string, string> = {
  "kit-double-discount": "Doppio sconto (cliente paga meno)",
  "kit-overcharge": "Cliente paga di più",
  "voucher-missing": "Voucher mancante",
  "component-missing": "Componente kit non trovato",
  "discount-vanished": "Sconto sparito su Saleor",
  "channel-orphan": "Channel orfano / ordini a rischio",
  "stale-variant-buyable": "Taglio nascosto ancora acquistabile",
  "rule-error": "Errore durante il controllo",
};

const SEVERITY_DOT: Record<Anomaly["severity"], string> = {
  high: "bg-[#B42318]",
  medium: "bg-[#B45309]",
  low: "bg-[var(--color-ink-muted)]",
};

function AnomalyRow({ a }: { a: Anomaly }): ReactElement {
  const hasMoney = a.expected !== undefined && a.shown !== undefined;
  return (
    <li className="flex gap-2 border-t border-[var(--color-line)] py-2 first:border-t-0">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[a.severity]}`} />
      <div className="min-w-0">
        <div className="text-sm text-[var(--color-ink)]">
          {a.portalName || a.portal}
          {a.kit ? <span className="text-[var(--color-ink-muted)]"> · {a.kit}</span> : null}
        </div>
        <div className="text-xs leading-relaxed text-[var(--color-ink-muted)]">{a.detail}</div>
        {hasMoney ? (
          <div className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            mostrato <span className="text-[var(--color-ink)]">{EURO.format(a.shown!)}</span> · reale{" "}
            <span className="text-[var(--color-ink)]">{EURO.format(a.expected!)}</span>
            {a.delta !== undefined ? ` · scarto ${EURO.format(a.delta)}` : ""}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function AnomalyReport({ anomalies }: { anomalies?: Anomaly[] }): ReactElement {
  const list = anomalies ?? [];
  if (list.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
        <h4 className="text-sm font-medium text-[var(--color-ink)]">Controllo prezzi</h4>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Nessuna anomalia rilevata.
        </p>
      </div>
    );
  }
  // Raggruppa per tipo mantenendo l'ordine di comparsa.
  const groups = new Map<string, Anomaly[]>();
  for (const a of list) groups.set(a.type, [...(groups.get(a.type) ?? []), a]);

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-[var(--color-ink)]">Controllo prezzi</h4>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {list.length} anomali{list.length === 1 ? "a" : "e"}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from(groups.entries()).map(([type, items]) => (
          <div key={type}>
            <div className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
              {LABELS[type] ?? type}
            </div>
            <ul className="mt-1">
              {items.map((a, i) => (
                <AnomalyRow key={`${a.portal}-${a.kit ?? ""}-${i}`} a={a} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
