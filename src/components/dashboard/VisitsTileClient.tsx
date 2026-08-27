"use client";
// La tile visite segue il periodo globale. PostHog non ha un "sempre": il tetto
// e' 90 giorni, quindi "Da sempre" chiede quella finestra. Ogni periodo e' una
// query, quindi si chiede al server solo quando serve e si tiene in cache
// (la Query API sta a ~120 query/ora, condivise con /analytics).
import { useEffect, useRef, useState, useTransition } from "react";
import { fmtInt } from "@/components/analytics/format";
import { visitsTotalsAction, type VisitsTotals } from "@/app/(authed)/actions";
import type { RangeKey } from "@/lib/analytics";
import { StatTile, TilePill, TILE_CLASS } from "./StatTile";
import { useDashboardRange } from "./DashboardShell";
import type { DashboardRange } from "./RangePicker";

function posthogRange(range: DashboardRange): RangeKey {
  return range === "all" ? "90d" : range;
}

export function VisitsTileClient({ initial }: { initial: VisitsTotals | null }) {
  const range = useDashboardRange();
  const [totals, setTotals] = useState(initial);
  const [pending, start] = useTransition();
  const cache = useRef<Partial<Record<DashboardRange, VisitsTotals | null>>>({
    all: initial,
  });

  useEffect(() => {
    if (range in cache.current) {
      setTotals(cache.current[range] ?? null);
      return;
    }
    start(async () => {
      const next = await visitsTotalsAction(posthogRange(range));
      cache.current[range] = next;
      setTotals(next);
    });
  }, [range]);

  return (
    <StatTile
      index={3}
      className={TILE_CLASS}
      tone="rosa"
      label="Visite"
      value={pending ? "…" : totals ? fmtInt(totals.visitors) : "—"}
      caption="sito e shop, visitatori unici"
      footer={
        !pending && totals ? (
          <TilePill>{fmtInt(totals.pageviews)} pagine viste</TilePill>
        ) : null
      }
    />
  );
}
