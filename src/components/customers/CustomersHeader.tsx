"use client";
// Testata del pannello Clienti: le tile (le due centrali sono il filtro gruppo)
// e la frase con i chip. Ogni tocco qui e' umano, quindi riporta `source` a
// "browse": il pannello torna in mano all'operatore.
import type { CustomersResponse } from "@/lib/customers";
import type { PortalOption } from "@/components/orders/orders-filter";
import { CustomersSentence } from "./CustomersSentence";
import { CustomersTiles } from "./CustomersTiles";
import type { CustomerGroup, CustomersFilter } from "./customers-filter";

interface Props {
  buckets: CustomersResponse["buckets"];
  filter: CustomersFilter;
  onChange: (patch: Partial<CustomersFilter>) => void;
  portals: PortalOption[];
  agents: string[];
}

export function CustomersHeader({ buckets, filter, onChange, portals, agents }: Props) {
  const setGroup = (group: CustomerGroup) => onChange({ group, source: "browse" });

  return (
    <div className="flex shrink-0 flex-col gap-5 px-5 pb-4 pt-5">
      <CustomersTiles buckets={buckets} group={filter.group} onGroup={setGroup} />
      <div className="pt-2">
        <CustomersSentence filter={filter} portals={portals} agents={agents} onChange={onChange} />
      </div>
      <div className="h-px bg-[var(--color-line)]" />
    </div>
  );
}
