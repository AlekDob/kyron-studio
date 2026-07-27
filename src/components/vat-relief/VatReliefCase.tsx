"use client";

// Scheda ordine nel pannello destro del modulo Agevolazioni: il contesto su cui
// l'operatore giudica i documenti (chi ha ordinato, cosa, quanto).
import type { ReactElement } from "react";
import type { OrderRow } from "@/lib/gateway";

interface Props {
  order: OrderRow;
}

const STATUS_LABEL: Record<string, string> = {
  requested: "Da validare",
  approved: "Approvata",
  rejected: "Rifiutata",
};

function euro(n: number, currency: string): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(n);
}

export function VatReliefCase({ order }: Props): ReactElement {
  const relief = order.vatReliefStatus
    ? (STATUS_LABEL[order.vatReliefStatus] ?? order.vatReliefStatus)
    : "Nessuna richiesta";

  return (
    <div className="space-y-4 p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">Pratica</p>
        <h2 className="text-lg font-medium text-[var(--color-ink)]">Ordine #{order.number}</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">{order.channelName}</p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
          IVA agevolata
        </p>
        <p className="text-sm text-[var(--color-ink)]">{relief}</p>
        {order.vatOverride && (
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            Aliquota per Danea: {order.vatOverride}%
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
          Cliente
        </p>
        <p className="text-sm text-[var(--color-ink)]">{order.customerName || order.userEmail}</p>
        {order.fiscalCode && (
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">CF {order.fiscalCode}</p>
        )}
        {order.companyName && (
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{order.companyName}</p>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
          Prodotti
        </p>
        <ul className="space-y-1">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-[var(--color-ink)]">
                {l.name} <span className="text-[var(--color-ink-muted)]">x{l.quantity}</span>
              </span>
              <span className="shrink-0 text-[var(--color-ink-muted)]">
                {euro(l.totalGross, order.currency)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-[var(--color-line)] pt-2 text-sm font-medium text-[var(--color-ink)]">
          Totale {euro(order.totalGross, order.currency)}
        </p>
        {order.paymentAmountOverride != null && (
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            Importo allineato: {euro(order.paymentAmountOverride, order.currency)}
          </p>
        )}
      </div>
    </div>
  );
}
