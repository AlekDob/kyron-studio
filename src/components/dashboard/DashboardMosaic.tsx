// Mosaico della home: 4 tile con numeri veri, il grafico visite+ordini, la striscia
// agenti. Ogni tile ha il suo <Suspense>, quindi si riempiono una alla volta
// mentre la pagina e' gia' navigabile: nessuno stato di loading da gestire.
import { Suspense } from "react";
import Link from "next/link";
import { SkeletonChart } from "@/components/ui";
import { AgentsGrid } from "@/components/agents/AgentsGrid";
import { OrdersTiles, PortalsTile, VisitsTile } from "./tiles";
import { StatTileSkeleton } from "./StatTile";
import { TrafficSection } from "./TrafficSection";

export function DashboardMosaic() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
      <Suspense
        fallback={
          <>
            <StatTileSkeleton className="lg:col-span-3" />
            <StatTileSkeleton className="lg:col-span-3" />
          </>
        }
      >
        <OrdersTiles />
      </Suspense>
      <Suspense fallback={<StatTileSkeleton className="lg:col-span-3" />}>
        <PortalsTile />
      </Suspense>
      <Suspense fallback={<StatTileSkeleton className="lg:col-span-3" />}>
        <VisitsTile />
      </Suspense>

      <div className="sm:col-span-2 lg:col-span-12">
        <Suspense fallback={<SkeletonChart className="h-[220px] sm:h-[280px]" />}>
          <TrafficSection />
        </Suspense>
      </div>

      <div className="sm:col-span-2 lg:col-span-12">
        <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <p className="mono-caps text-[var(--studio-muted-label)]">Agenti</p>
          <Link
            href="/agenti"
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            Tutti
          </Link>
        </div>
        <AgentsGrid fill />
      </div>
    </div>
  );
}
