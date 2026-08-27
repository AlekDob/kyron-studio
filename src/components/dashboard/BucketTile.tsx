"use client";
// Le tile ordini e fatturato: stessa lettura ordini del server, due metriche.
// I totali di tutti i periodi arrivano gia' calcolati (una sola lettura), quindi
// cambiare periodo e' istantaneo e non chiama nessuno.
import { fmtEur, fmtInt } from "@/components/analytics/format";
import { StatTile, TilePill, TILE_CLASS } from "./StatTile";
import { useDashboardRange } from "./DashboardShell";
import type { DashboardRange } from "./RangePicker";

export type BucketRange = DashboardRange;

export interface RevenueBucket {
  count: number;
  gross: number;
}

// Le due varianti sono queste e solo queste: il resto (tono, posto nel mosaico)
// si deriva dalla metrica invece di passare 6 prop.
const VARIANT = {
  count: {
    index: 0,
    tone: "indaco",
    label: "Ordini",
    caption: "tutti i portali scuola",
  },
  gross: {
    index: 1,
    tone: "menta",
    label: "Fatturato",
    caption: "totale lordo incassato",
  },
} as const;

export function BucketTile({
  metric,
  buckets,
}: {
  metric: "count" | "gross";
  /** Null quando Saleor non risponde: la tile mostra "—". */
  buckets: Record<BucketRange, RevenueBucket> | null;
}) {
  const v = VARIANT[metric];
  const range = useDashboardRange();
  const bucket = buckets?.[range];

  return (
    <StatTile
      index={v.index}
      className={TILE_CLASS}
      tone={v.tone}
      label={v.label}
      value={bucket ? (metric === "gross" ? fmtEur(bucket.gross) : fmtInt(bucket.count)) : "—"}
      caption={v.caption}
      footer={
        metric === "gross" && bucket && bucket.count > 0 ? (
          <TilePill>scontrino medio {fmtEur(bucket.gross / bucket.count)}</TilePill>
        ) : null
      }
    />
  );
}
