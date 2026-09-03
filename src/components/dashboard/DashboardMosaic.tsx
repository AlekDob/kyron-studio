// Mosaico della home: 4 tile con numeri veri, il grafico visite+ordini, la striscia
// agenti. Ogni tile ha il suo <Suspense>, quindi si riempiono una alla volta
// mentre la pagina e' gia' navigabile: nessuno stato di loading da gestire.
import { Suspense } from "react";
import Link from "next/link";
import { SkeletonChart } from "@/components/ui";
import { AgentsGrid } from "@/components/agents/AgentsGrid";
import { OrdersTiles, PortalsTile, VisitsTile } from "./tiles";
import { StatTileSkeleton } from "./StatTile";
import { TileRail } from "./TileRail";
import { TrafficSection } from "./TrafficSection";

export function DashboardMosaic() {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
      {/* Le 4 tile: carosello su schermo stretto, griglia da @3xl in su. */}
      <TileRail cols="@3xl:grid-cols-4" className="sm:col-span-2 lg:col-span-12">
        <Suspense
          fallback={
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          }
        >
          <OrdersTiles />
        </Suspense>
        <Suspense fallback={<StatTileSkeleton />}>
          <PortalsTile />
        </Suspense>
        <Suspense fallback={<StatTileSkeleton />}>
          <VisitsTile />
        </Suspense>
      </TileRail>

      <div className="sm:col-span-2 lg:col-span-12">
        <Suspense fallback={<SkeletonChart className="h-[220px] sm:h-[280px]" />}>
          <TrafficSection />
        </Suspense>
      </div>

      {/* min-w-0: la marquee ha contenuto w-max (~2300px). Senza questo la
          colonna del grid prende quella misura come minimo e da mobile tutta
          la dashboard sfora in larghezza. */}
      <div className="min-w-0 sm:col-span-2 lg:col-span-12">
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
