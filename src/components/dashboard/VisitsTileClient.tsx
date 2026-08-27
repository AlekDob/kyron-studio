"use client";
// La tile visite col periodo scegliibile. A differenza di ordini/fatturato il
// dato non e' precalcolato: ogni periodo e' una query PostHog, quindi si chiede
// al server solo quando serve e si tiene in cache per periodo (la Query API sta
// a ~120 query/ora, condivise con /analytics).
import { useRef, useState, useTransition } from "react";
import { fmtInt } from "@/components/analytics/format";
import { visitsTotalsAction, type VisitsTotals } from "@/app/(authed)/actions";
import { StatTile, TilePill, TILE_CLASS } from "./StatTile";
import { RangePicker, type RangeOption } from "./RangePicker";

// Sottoinsieme di RangeKey: PostHog non ha un "sempre" e si ferma a 90 giorni.
type VisitsRange = "today" | "7d" | "30d" | "90d";

const VISITS_RANGES: Array<RangeOption<VisitsRange>> = [
  { key: "90d", label: "90 giorni" },
  { key: "30d", label: "30 giorni" },
  { key: "7d", label: "7 giorni" },
  { key: "today", label: "Oggi" },
];

export function VisitsTileClient({ initial }: { initial: VisitsTotals | null }) {
  // Il periodo non si ricorda tra un caricamento e l'altro di proposito: farlo
  // costerebbe una query PostHog in piu' a ogni apertura della dashboard,
  // mentre i 30 giorni li ha gia' portati il render del server.
  const [range, setRange] = useState<VisitsRange>("30d");
  const [totals, setTotals] = useState(initial);
  const [pending, start] = useTransition();
  const cache = useRef<Partial<Record<VisitsRange, VisitsTotals | null>>>({
    "30d": initial,
  });

  function pick(key: VisitsRange): void {
    setRange(key);
    if (key in cache.current) return setTotals(cache.current[key] ?? null);
    start(async () => {
      const next = await visitsTotalsAction(key);
      cache.current[key] = next;
      setTotals(next);
    });
  }

  return (
    <StatTile
      index={3}
      className={TILE_CLASS}
      tone="rosa"
      label="Visite"
      value={pending ? "…" : totals ? fmtInt(totals.visitors) : "—"}
      caption="sito e shop, visitatori unici"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <RangePicker
            label="Scegli il periodo: visite"
            options={VISITS_RANGES}
            value={range}
            onPick={pick}
          />
          {!pending && totals && (
            <TilePill>{fmtInt(totals.pageviews)} pagine viste</TilePill>
          )}
        </div>
      }
    />
  );
}
