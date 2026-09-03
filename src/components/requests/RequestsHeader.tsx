"use client";
// Testata del pannello Richieste: le tile (che sono anche il filtro stato) e la
// frase con i chip. Ogni tocco qui e' umano, quindi riporta `source` a
// "browse": il pannello torna in mano al collega.
import type { RequestGroup } from "@/lib/requests";
import { RequestsSentence } from "./RequestsSentence";
import { RequestsTiles } from "./RequestsTiles";
import type { RequestsFilter } from "./requests-filter";

interface Props {
  totals: Record<RequestGroup, number>;
  filter: RequestsFilter;
  onChange: (patch: Partial<RequestsFilter>) => void;
}

export function RequestsHeader({ totals, filter, onChange }: Props) {
  return (
    <div className="flex shrink-0 flex-col gap-5 px-5 pb-4 pt-5">
      <RequestsTiles
        totals={totals}
        group={filter.group}
        onGroup={(group: RequestGroup | "all") => onChange({ group, source: "browse" })}
      />
      <div className="pt-2">
        <RequestsSentence filter={filter} onChange={onChange} />
      </div>
      <div className="h-px bg-[var(--color-line)]" />
    </div>
  );
}
