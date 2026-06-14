import type { OrderLine } from "@/lib/gateway";
import { formatEur } from "./format";

// Righe prodotto di un ordine: cod SKU + descrizione x qty + prezzo.
// Condiviso da OrdersTable (desktop) e OrderCard (mobile) — DRY.

export function OrderLines({ lines }: { lines: OrderLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">Nessun prodotto.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {lines.map((l, i) => (
        <li
          key={`${l.sku}-${i}`}
          className="flex items-baseline justify-between gap-3 text-sm"
        >
          <span className="text-[var(--color-ink)]">
            {l.sku && (
              <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                {l.sku}{" "}
              </span>
            )}
            {l.name}
            <span className="text-[var(--color-ink-muted)]"> × {l.quantity}</span>
          </span>
          <span className="shrink-0 tabular-nums">{formatEur(l.totalGross)}</span>
        </li>
      ))}
    </ul>
  );
}
