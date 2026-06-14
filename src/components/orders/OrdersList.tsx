"use client";
import type { OrderRow } from "@/lib/gateway";
import type { DayGroup } from "./OrdersView";
import { OrderListRow } from "./OrderListRow";

interface OrdersListProps {
  groups: DayGroup[];
  onSelect: (order: OrderRow) => void;
}

// Lista ordini raggruppata per giorno. Ogni gruppo ha un'intestazione con la
// data (subito visibile) e il conteggio ordini.
export function OrdersList({ groups, onSelect }: OrdersListProps) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <section key={g.key}>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-medium text-[var(--color-ink)]">
              {g.label}
            </h2>
            <span className="text-xs text-[var(--color-ink-muted)]">
              {g.orders.length} {g.orders.length === 1 ? "ordine" : "ordini"}
            </span>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {g.orders.map((o) => (
              <li key={o.number}>
                <OrderListRow order={o} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
