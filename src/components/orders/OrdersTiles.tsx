"use client";
// Le cinque tile in cima al pannello Ordini. Stessa UI della dashboard
// (StatTile, toni e tilt) in taglia "sm": qui lo spazio e' mezzo schermo.
// Le tre di stato sono anche il filtro stato: secondo click torna a tutti.
import type { ReactElement } from "react";
import { StatTile } from "@/components/dashboard/StatTile";
import { TileRail } from "@/components/dashboard/TileRail";
import type { OrdersBucket, OrdersResponse } from "@/lib/gateway";
import { formatEur } from "./format";
import { STATUS_LABELS, type StatusBucket } from "./orders-filter";

const TONES = {
  confermati: "menta",
  "da-confermare": "ambra",
  annullati: "rosa",
} as const;

export function OrdersTiles({
  buckets,
  status,
  onStatus,
}: {
  buckets: OrdersResponse["buckets"];
  status: StatusBucket;
  onStatus: (status: StatusBucket) => void;
}): ReactElement {
  const b = (key: keyof OrdersResponse["buckets"]): OrdersBucket => buckets[key];

  return (
    <TileRail cols="@3xl:grid-cols-3 @5xl:grid-cols-5">
      <StatTile
        tone="indaco"
        size="sm"
        label="Ordini"
        value={String(b("all").count)}
        className="min-w-0"
        index={0}
      />
      <StatTile
        tone="indaco"
        size="sm"
        label="Totale"
        value={formatEur(b("all").eur)}
        className="min-w-0"
        index={1}
      />
      {(["confermati", "da-confermare", "annullati"] as const).map((key, i) => (
        <StatTile
          key={key}
          tone={TONES[key]}
          size="sm"
          label={STATUS_LABELS[key]}
          value={String(b(key).count)}
          caption={formatEur(b(key).eur)}
          className="min-w-0"
          index={i + 2}
          active={status === key}
          onClick={() => onStatus(status === key ? "all" : key)}
        />
      ))}
    </TileRail>
  );
}
