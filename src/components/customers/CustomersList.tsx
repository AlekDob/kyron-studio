"use client";
// Lista clienti: niente raggruppamento per giorno (un cliente non e' un evento
// datato, e' una persona). L'ordine e' quello del server: ultimo ordine prima.
import type { CustomerRow } from "@/lib/customers";
import { CustomerListRow } from "./CustomerListRow";
import { Slides } from "@/components/animate-ui/primitives/effects/slide";

export function CustomersList({
  customers,
  onSelect,
}: {
  customers: CustomerRow[];
  onSelect: (customer: CustomerRow) => void;
}) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
      {/* Le righe entrano a scalare: quando Bea cambia il filtro si vede che la
          lista si e' rifatta, invece di cambiare di scatto. */}
      <Slides asChild direction="up" offset={10} holdDelay={28}>
        {customers.map((c) => (
          <li key={c.email}>
            <CustomerListRow customer={c} onSelect={onSelect} />
          </li>
        ))}
      </Slides>
    </ul>
  );
}
