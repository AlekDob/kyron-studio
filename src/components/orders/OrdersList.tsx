"use client";
import { CalendarDays } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { SectionIcon } from "./detail-section";
import type { DayGroup } from "./OrdersView";
import { OrderListRow } from "./OrderListRow";
import { Slides } from "@/components/animate-ui/primitives/effects/slide";

interface OrdersListProps {
  groups: DayGroup[];
  onSelect: (order: OrderRow) => void;
}

// Lista ordini raggruppata per giorno. Ogni gruppo ha un'intestazione con la
// data (subito visibile) e il conteggio ordini.
export function OrdersList({ groups, onSelect }: OrdersListProps) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g, gi) => (
        <section key={g.key}>
          {/* Riga di stacco tra un giorno e l'altro: nella lista lunga i gruppi
              si toccavano e sembravano un blocco solo. Non sopra il primo. */}
          {gi > 0 && <div className="mb-5 h-px bg-[var(--color-line)]" />}
          {/* Il giorno e' l'appiglio per orientarsi in una lista lunga: sta
              sopra le righe con la sua pastiglia, non confuso col resto. */}
          <div className="mb-2 flex items-center gap-2 px-1">
            <SectionIcon icon={CalendarDays} tone="indigo" size={26} />
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              {g.label}
            </h2>
            <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
              {g.orders.length} {g.orders.length === 1 ? "ordine" : "ordini"}
            </span>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {/* Le righe entrano a scalare: quando Nico cambia il filtro si vede
                che la lista si e' rifatta, invece di cambiare di scatto.
                `asChild` per non infilare un div tra <ul> e <li>. */}
            <Slides asChild direction="up" offset={10} holdDelay={28}>
              {g.orders.map((o) => (
                <li key={o.number}>
                  <OrderListRow order={o} onSelect={onSelect} />
                </li>
              ))}
            </Slides>
          </ul>
        </section>
      ))}
    </div>
  );
}
