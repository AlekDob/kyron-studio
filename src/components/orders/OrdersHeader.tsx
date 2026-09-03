"use client";
// Testata del pannello Ordini: tile (cliccabili, sono il filtro stato) e la
// frase con i chip che tiene tutti gli altri filtri. Resta ferma mentre la
// lista scorre. Ogni tocco qui e' umano, quindi riporta sempre `source` a
// "browse": il pannello torna in mano all'operatore.
import type { OrdersResponse } from "@/lib/gateway";
import { OrdersSentence } from "./OrdersSentence";
import { OrdersTiles } from "./OrdersTiles";
import type { OrdersFilter, PortalOption, StatusBucket } from "./orders-filter";

interface Props {
  buckets: OrdersResponse["buckets"]; // KPI contati dal server, stesso calcolo di Nico
  filter: OrdersFilter;
  onChange: (patch: Partial<OrdersFilter>) => void;
  portals: PortalOption[];
  agents: string[];
}

export function OrdersHeader({ buckets, filter, onChange, portals, agents }: Props) {
  const setStatus = (status: StatusBucket) => onChange({ status, source: "browse" });

  return (
    <div className="flex shrink-0 flex-col gap-5 px-5 pb-4 pt-5">
      <OrdersTiles buckets={buckets} status={filter.status} onStatus={setStatus} />

      {/* Aria sopra la frase: incollata alle tile sembrava la loro didascalia. */}
      <div className="pt-2">
        <OrdersSentence
          filter={filter}
          portals={portals}
          agents={agents}
          onChange={onChange}
        />
      </div>

      {/* Stacca i filtri dalla lista: sopra si filtra, sotto si legge. */}
      <div className="h-px bg-[var(--color-line)]" />
    </div>
  );
}
