"use client";

import type { ReactElement } from "react";
import { Card } from "@/components/ui";
import { fmtEur } from "@/components/analytics/format";

// Piano prezzi di Nico: si legge PRIMA di applicarlo. Se `errors` non e' vuoto
// il piano non e' applicabile — di solito e' un kit scuola il cui voucher va
// ricalcolato insieme al componente (money-path, decision-011).

interface PlanLine {
  sku: string;
  productSlug: string;
  fromEur: number | null;
  toEur: number;
  deltaEur: number;
  deltaPct: number | null;
}

interface VoucherLine {
  voucherCode: string;
  portalSlug: string;
  fromEur: number | null;
  newDiscountEur: number;
}

export interface PricePlanCardProps {
  target: "prod" | "staging";
  plan: {
    channelSlug: string;
    lines: PlanLine[];
    voucherLines: VoucherLine[];
    warnings: string[];
    errors: string[];
  };
}

export function PricePlanCard({ target, plan }: PricePlanCardProps): ReactElement {
  const blocked = plan.errors.length > 0;

  return (
    <Card padding="md">
      <Card.Header>
        <h3 className="text-sm font-medium">
          Piano prezzi — {plan.channelSlug}
          {target === "staging" && " (staging)"}
        </h3>
      </Card.Header>

      <table className="mt-3 w-full text-xs">
        <thead className="text-[var(--color-ink-muted)]">
          <tr>
            <th className="text-left font-normal py-1">Codice</th>
            <th className="text-right font-normal py-1">Ora</th>
            <th className="text-right font-normal py-1">Dopo</th>
            <th className="text-right font-normal py-1">Diff.</th>
          </tr>
        </thead>
        <tbody>
          {plan.lines.map((l) => (
            <tr key={l.sku} className="border-t border-[var(--color-line)]">
              <td className="py-1.5">
                <span className="text-[var(--color-ink)]">{l.sku}</span>
                <span className="text-[var(--color-ink-muted)]"> · {l.productSlug}</span>
              </td>
              <td className="py-1.5 text-right">
                {l.fromEur === null ? "—" : fmtEur(l.fromEur)}
              </td>
              <td className="py-1.5 text-right">{fmtEur(l.toEur)}</td>
              <td className="py-1.5 text-right text-[var(--color-ink-muted)]">
                {l.deltaEur > 0 ? "+" : ""}
                {fmtEur(l.deltaEur)}
                {l.deltaPct !== null && ` (${l.deltaPct > 0 ? "+" : ""}${l.deltaPct}%)`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {plan.voucherLines.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow">Sconti kit da rifare</p>
          {plan.voucherLines.map((v) => (
            <p key={v.voucherCode} className="mt-1 text-xs text-[var(--color-ink-soft)]">
              {v.portalSlug} · {v.voucherCode}:{" "}
              {v.fromEur === null ? "—" : fmtEur(v.fromEur)} → {fmtEur(v.newDiscountEur)}
            </p>
          ))}
        </div>
      )}

      {plan.warnings.map((w) => (
        <p key={w} className="mt-2 text-xs text-[var(--color-ink-soft)]">
          {w}
        </p>
      ))}

      {blocked && (
        <div className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] p-3">
          <p className="text-xs font-medium text-[var(--color-ink)]">
            Piano non applicabile
          </p>
          {plan.errors.map((e) => (
            <p key={e} className="mt-1 text-xs text-[var(--color-ink-soft)]">
              {e}
            </p>
          ))}
        </div>
      )}

      {!blocked && (
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
          Conferma in chat per applicarlo. I prezzi vengono riletti prima di
          scrivere: se nel frattempo qualcosa si muove, non si scrive niente.
        </p>
      )}
    </Card>
  );
}
