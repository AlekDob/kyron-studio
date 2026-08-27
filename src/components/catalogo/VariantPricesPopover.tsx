"use client";
import { Popover } from "@/components/ui";
import { eur } from "./catalog-view";

// "da 889 €" su un portale nasconde prezzi diversi per variante. Il dettaglio
// sta qui, non in lista: un click e vedi variante -> prezzo.
export function VariantPricesPopover({
  label,
  rows,
}: {
  label: string;
  rows: Array<{ label: string; priceEur: number }>;
}) {
  return (
    <Popover
      label={`Prezzi per variante, ${label}`}
      trigger={
        <span className="font-medium underline decoration-dotted decoration-[var(--color-line-strong)] underline-offset-2 hover:decoration-[var(--color-ink)]">
          {label}
        </span>
      }
    >
      <p className="mb-2 text-xs font-medium text-[var(--color-ink)]">
        Prezzo per variante
      </p>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="truncate text-[var(--color-ink-muted)]">{r.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{eur(r.priceEur)}</span>
          </div>
        ))}
      </div>
    </Popover>
  );
}
