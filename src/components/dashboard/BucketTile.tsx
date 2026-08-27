"use client";
// Le tile ordini e fatturato: stessa lettura ordini del server, due metriche.
// I totali di tutti i periodi arrivano gia' calcolati (una sola lettura), quindi
// cambiare periodo e' istantaneo e non chiama nessuno.
import { fmtEur, fmtInt } from "@/components/analytics/format";
import { StatTile, TilePill, TILE_CLASS } from "./StatTile";
import { RangePicker, useStoredRange, type RangeOption } from "./RangePicker";

export type BucketRange = "all" | "30d" | "7d" | "3d" | "today";

export interface RevenueBucket {
  count: number;
  gross: number;
}

export const BUCKET_RANGES: Array<RangeOption<BucketRange>> = [
  { key: "all", label: "Sempre" },
  { key: "30d", label: "30 giorni" },
  { key: "7d", label: "7 giorni" },
  { key: "3d", label: "3 giorni" },
  { key: "today", label: "Oggi" },
];

// Le due varianti sono queste e solo queste: il resto (tono, posto nel mosaico,
// periodo di partenza) si deriva dalla metrica invece di passare 6 prop.
const VARIANT = {
  count: {
    index: 0,
    tone: "indaco",
    label: "Ordini",
    caption: "tutti i portali scuola",
    storageKey: "studio.dashboard.orders-range",
    initial: "30d",
  },
  gross: {
    index: 1,
    tone: "menta",
    label: "Fatturato",
    caption: "totale lordo incassato",
    storageKey: "studio.dashboard.revenue-range",
    initial: "all",
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
  const [range, pick] = useStoredRange<BucketRange>(
    v.storageKey,
    BUCKET_RANGES,
    v.initial,
  );
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
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker
            label={`Scegli il periodo: ${v.label.toLowerCase()}`}
            options={BUCKET_RANGES}
            value={range}
            onPick={pick}
          />
          {metric === "gross" && bucket && bucket.count > 0 && (
            <TilePill>scontrino medio {fmtEur(bucket.gross / bucket.count)}</TilePill>
          )}
        </div>
      }
    />
  );
}
