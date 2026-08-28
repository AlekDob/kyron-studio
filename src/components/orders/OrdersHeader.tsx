"use client";
// Testata del pannello Ordini: tile (cliccabili, sono il filtro stato), ricerca
// e filtri. Resta ferma mentre la lista scorre. Ogni tocco qui e' umano, quindi
// riporta sempre `source` a "browse": il pannello torna in mano all'operatore.
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui";
import type { OrdersResponse } from "@/lib/gateway";
import { OrdersFilters, type PortalOption } from "./OrdersFilters";
import { OrdersTiles } from "./OrdersTiles";
import type { OrdersFilter, StatusBucket } from "./orders-filter";

interface Props {
  buckets: OrdersResponse["buckets"]; // KPI contati dal server, stesso calcolo di Nico
  filter: OrdersFilter;
  onChange: (patch: Partial<OrdersFilter>) => void;
  portals: PortalOption[];
  agents: string[];
}

export function OrdersHeader({ buckets, filter, onChange, portals, agents }: Props) {
  // La ricerca ora rifa' il fetch: si scrive in locale e si spinge dopo 300ms,
  // altrimenti si chiamerebbe il server a ogni tasto.
  const [q, setQ] = useState(filter.query);
  useEffect(() => setQ(filter.query), [filter.query]);
  useEffect(() => {
    if (q === filter.query) return;
    const t = setTimeout(() => onChange({ query: q, source: "browse" }), 300);
    return () => clearTimeout(t);
  }, [q, filter.query, onChange]);

  const setStatus = (status: StatusBucket) => onChange({ status, source: "browse" });

  return (
    <div className="flex shrink-0 flex-col gap-4 px-5 pb-4 pt-5">
      <OrdersTiles buckets={buckets} status={filter.status} onStatus={setStatus} />

      <Input
        size="sm"
        placeholder="Cerca per n° ordine, cliente o transazione Stripe…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        iconLeft={<Search size={15} />}
      />

      <OrdersFilters
        filter={filter}
        onChange={onChange}
        portals={portals}
        agents={agents}
      />
    </div>
  );
}
