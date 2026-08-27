"use client";
import { useState } from "react";
import { eur } from "./catalog-view";

// "da 889 €" su un portale nasconde prezzi diversi per colore. Il dettaglio sta
// qui, non in lista: un click e vedi variante -> prezzo. Div assoluto e non
// [popover] nativo, che con il preflight Tailwind va fixato a mano.
export function VariantPricesPopover({
  label,
  rows,
}: {
  label: string;
  rows: Array<{ label: string; priceEur: number }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="font-medium underline decoration-dotted decoration-[var(--color-line-strong)] underline-offset-2 hover:decoration-[var(--color-ink)]"
      >
        {label}
      </button>
      {open && (
        <span className="studio-row-in absolute right-0 top-full z-20 mt-1 flex min-w-[180px] flex-col gap-0.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-2 text-left shadow-[var(--shadow-card)]">
          {rows.map((r) => (
            <span key={r.label} className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate text-[var(--color-ink-soft)]">{r.label}</span>
              <span className="shrink-0 font-medium tabular-nums">{eur(r.priceEur)}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
