"use client";
// Le quattro tile in cima al pannello Clienti. Stessa UI delle tile Ordini
// (StatTile in taglia "sm"). Nuovi e Ricorrenti sono anche il filtro gruppo:
// secondo click torna a tutti.
//
// Attenzione: un cliente puo' essere nuovo E ricorrente insieme (primo ordine
// questo mese, due ordini fatti), quindi i due numeri non sommano al totale.
import type { ReactElement } from "react";
import { StatTile } from "@/components/dashboard/StatTile";
import { TileRail } from "@/components/dashboard/TileRail";
import { formatEur } from "@/components/orders/format";
import type { CustomersResponse } from "@/lib/customers";
import { GROUP_LABELS, type CustomerGroup } from "./customers-filter";

const TONES = { nuovi: "menta", ricorrenti: "indaco" } as const;

export function CustomersTiles({
  buckets,
  group,
  onGroup,
}: {
  buckets: CustomersResponse["buckets"];
  group: CustomerGroup;
  onGroup: (group: CustomerGroup) => void;
}): ReactElement {
  return (
    <TileRail cols="@3xl:grid-cols-2 @5xl:grid-cols-4">
      <StatTile tone="indaco" size="sm" label="Clienti" value={String(buckets.all.count)} className="min-w-0" index={0} />
      <StatTile
        tone="ambra"
        size="sm"
        label="Speso totale"
        value={formatEur(buckets.all.eur)}
        className="min-w-0"
        index={1}
      />
      {(["nuovi", "ricorrenti"] as const).map((key, i) => (
        <StatTile
          key={key}
          tone={TONES[key]}
          size="sm"
          label={GROUP_LABELS[key]}
          value={String(buckets[key].count)}
          caption={formatEur(buckets[key].eur)}
          className="min-w-0"
          index={i + 2}
          active={group === key}
          onClick={() => onGroup(group === key ? "all" : key)}
        />
      ))}
    </TileRail>
  );
}
