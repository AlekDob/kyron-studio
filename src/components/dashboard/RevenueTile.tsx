"use client";
// La tile fatturato e' l'unica con un periodo scegliibile: "sempre" di base,
// piu' 7 giorni / 3 giorni / oggi. I quattro totali arrivano gia' calcolati dal
// server (una sola lettura ordini), quindi lo switch e' istantaneo e offline.
import { useEffect, useState } from "react";
import { fmtEur } from "@/components/analytics/format";
import { StatTile, TilePill } from "./StatTile";

export type RevenueRange = "all" | "7d" | "3d" | "today";

export interface RevenueBucket {
  count: number;
  gross: number;
}

export const REVENUE_RANGES: Array<{ key: RevenueRange; label: string }> = [
  { key: "all", label: "Sempre" },
  { key: "7d", label: "7 giorni" },
  { key: "3d", label: "3 giorni" },
  { key: "today", label: "Oggi" },
];

const STORAGE_KEY = "studio.dashboard.revenue-range";

function isRange(v: string | null): v is RevenueRange {
  return REVENUE_RANGES.some((r) => r.key === v);
}

export function RevenueTile({
  buckets,
}: {
  /** Null quando Saleor non risponde: la tile mostra "—". */
  buckets: Record<RevenueRange, RevenueBucket> | null;
}) {
  const [range, setRange] = useState<RevenueRange>("all");

  // Letta dopo il mount e non nell'initializer: il server non vede la
  // localStorage, leggerla prima romperebbe l'hydration.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isRange(saved)) setRange(saved);
  }, []);

  const pick = (key: RevenueRange): void => {
    setRange(key);
    localStorage.setItem(STORAGE_KEY, key);
  };

  const bucket = buckets?.[range];

  return (
    <StatTile
      index={1}
      className="min-w-0 lg:col-span-3"
      tone="menta"
      label="Fatturato"
      value={bucket ? fmtEur(bucket.gross) : "—"}
      caption="totale lordo incassato"
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {REVENUE_RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => pick(r.key)}
                aria-pressed={r.key === range}
                className={
                  r.key === range
                    ? "rounded-full bg-[var(--color-ink)] px-2.5 py-1 text-[11px] font-medium text-white"
                    : "rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-soft)] backdrop-blur transition-colors hover:bg-white/90"
                }
              >
                {r.label}
              </button>
            ))}
          </div>
          {bucket && bucket.count > 0 && (
            <TilePill>scontrino medio {fmtEur(bucket.gross / bucket.count)}</TilePill>
          )}
        </div>
      }
    />
  );
}
