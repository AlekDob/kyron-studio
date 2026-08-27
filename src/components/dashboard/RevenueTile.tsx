"use client";
// La tile fatturato e' l'unica con un periodo scegliibile: "sempre" di base,
// piu' 30 / 7 / 3 giorni e oggi. I totali arrivano gia' calcolati dal server
// (una sola lettura ordini), quindi lo switch e' istantaneo e offline.
// Il periodo si scegle da un popover e non da una fila di pastiglie: la fila
// andava a capo e faceva la tile piu' alta delle altre tre del mosaico.
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { fmtEur } from "@/components/analytics/format";
import { Popover } from "@/components/ui";
import { StatTile, TilePill } from "./StatTile";

export type RevenueRange = "all" | "30d" | "7d" | "3d" | "today";

export interface RevenueBucket {
  count: number;
  gross: number;
}

export const REVENUE_RANGES: Array<{ key: RevenueRange; label: string }> = [
  { key: "all", label: "Sempre" },
  { key: "30d", label: "30 giorni" },
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
        <div className="flex flex-wrap items-center gap-2">
          <Popover
            label="Scegli il periodo del fatturato"
            trigger={
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ink)] px-2.5 py-1 text-[11px] font-medium text-white">
                {REVENUE_RANGES.find((r) => r.key === range)?.label}
                <ChevronDown size={12} />
              </span>
            }
          >
            {(close) => (
              <div className="flex flex-col">
                {REVENUE_RANGES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      pick(r.key);
                      close();
                    }}
                    aria-pressed={r.key === range}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--studio-hover-surface)] ${
                      r.key === range ? "font-medium" : "text-[var(--color-ink-soft)]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </Popover>
          {bucket && bucket.count > 0 && (
            <TilePill>scontrino medio {fmtEur(bucket.gross / bucket.count)}</TilePill>
          )}
        </div>
      }
    />
  );
}
