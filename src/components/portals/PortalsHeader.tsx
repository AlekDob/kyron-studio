"use client";
// Testata del pannello Portali: tile (cliccabili, sono il filtro stato) e la
// frase con i chip che tiene tutti gli altri filtri. Resta ferma mentre la
// lista scorre. Ogni tocco qui e' umano, quindi riporta sempre `source` a
// "browse": il pannello torna in mano all'operatore.
import { PortalsSentence } from "./PortalsSentence";
import { PortalsTiles } from "./PortalsTiles";
import type { PortalsData, PortalsFilter, PortalStatus } from "./portals-filter";

interface Props {
  buckets: PortalsData["buckets"];
  filter: PortalsFilter;
  onChange: (patch: Partial<PortalsFilter>) => void;
  cities: string[];
}

export function PortalsHeader({ buckets, filter, onChange, cities }: Props) {
  const setStatus = (status: PortalStatus) => onChange({ status, source: "browse" });

  return (
    <div className="flex shrink-0 flex-col gap-5 px-5 pb-4 pt-5">
      <PortalsTiles buckets={buckets} status={filter.status} onStatus={setStatus} />

      {/* Aria sopra la frase: incollata alle tile sembrava la loro didascalia. */}
      <div className="pt-2">
        <PortalsSentence filter={filter} cities={cities} onChange={onChange} />
      </div>

      {/* Stacca i filtri dalla lista: sopra si filtra, sotto si legge. */}
      <div className="h-px bg-[var(--color-line)]" />
    </div>
  );
}
