import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import {
  type AnalyticsOverview,
  type AppFilter,
  type RangeKey,
  analyticsErrorKind,
  getAnalyticsOverview,
} from "@/lib/analytics";
import { FilterBar } from "@/components/analytics/FilterBar";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { TrafficChart } from "@/components/analytics/TrafficChart";
import { TenantBreakdown } from "@/components/analytics/TenantBreakdown";
import { FormsBreakdown } from "@/components/analytics/FormsBreakdown";
import { SourcesBreakdown } from "@/components/analytics/SourcesBreakdown";
import { VisitorsMap } from "@/components/analytics/VisitorsMap";
import { PagesBreakdown } from "@/components/analytics/PagesBreakdown";
import { DevicesPie } from "@/components/analytics/DevicesPie";
import { SectionNav } from "@/components/analytics/SectionNav";
import { AnalyticsEmptyState } from "@/components/analytics/EmptyState";

export const metadata = { title: "Analytics — Studio" };

// Brain: decision-017 — un solo fetch al BFF; i filtri range/app vivono nei
// searchParams e il filtro app e' applicato sul payload, zero fetch extra.

const RANGE_KEYS: RangeKey[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "7d",
  "30d",
  "90d",
];
const APP_KEYS: AppFilter[] = ["all", "cms", "storefront"];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickParam<T extends string>(
  value: string | string[] | undefined,
  allowed: T[],
  fallback: T,
): T {
  const v = Array.isArray(value) ? value[0] : value;
  return allowed.includes(v as T) ? (v as T) : fallback;
}

// Deriva il dataset filtrato per origine dal payload completo. prevTotals
// segue il filtro (i delta confrontano pere con pere), i lead restano globali.
function filterView(overview: AnalyticsOverview, app: AppFilter) {
  if (app === "all") return { ...overview, prevTotals: overview.prev.totals };
  return {
    ...overview,
    totals: overview.byApp[app],
    prevTotals: overview.prev.byApp[app],
    tenants: overview.tenants.filter((t) => t.app === app),
    timeseries: overview.timeseries.filter((p) => p.app === app),
  };
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const params = await searchParams;
  const range = pickParam(params.range, RANGE_KEYS, "30d");
  const app = pickParam(params.app, APP_KEYS, "all");

  let overview: AnalyticsOverview | null = null;
  let errorKind: ReturnType<typeof analyticsErrorKind> | null = null;
  try {
    overview = await getAnalyticsOverview(range);
  } catch (err) {
    errorKind = analyticsErrorKind(err);
  }

  const view = overview ? filterView(overview, app) : null;
  const noData = view !== null && view.totals.pageviews === 0;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 max-w-6xl mx-auto">
      <header className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-5">
        <p className="eyebrow mb-2">Studio · Analytics</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Analytics <span className="font-serif italic">Kyron</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          Visite, funnel e ricavi da PostHog: sito kyronedu.it, shop principale
          e portali scuola. I nuovi shop compaiono automaticamente.
        </p>
      </header>

      <div className="mb-6">
        <FilterBar range={range} app={app} />
      </div>

      {errorKind && <AnalyticsEmptyState variant={errorKind} />}

      {view && (
        <div className="flex flex-col gap-4">
          {view.stale && (
            <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-2.5 text-sm text-[var(--color-warning)]">
              PostHog non risponde: questi dati arrivano dall&apos;ultima copia
              in cache e potrebbero non essere aggiornati.
            </p>
          )}
          <SectionNav />
          <section id="kpi" className="scroll-mt-12">
            <KpiGrid
              kpis={view.totals}
              leads={view.leads}
              prevKpis={view.prevTotals}
              prevLeads={view.prev.leads}
            />
          </section>
          {noData ? (
            <AnalyticsEmptyState variant="no-data" />
          ) : (
            <>
              <section id="andamento" className="scroll-mt-12">
                <TrafficChart
                  points={view.timeseries}
                  app={app}
                  from={view.from}
                  to={view.to}
                  granularity={view.granularity}
                />
              </section>
              <section id="citta" className="scroll-mt-12">
                <VisitorsMap geo={view.geo} />
              </section>
              <section id="fonti" className="scroll-mt-12">
                <SourcesBreakdown sources={view.sources} />
              </section>
              <section id="pagine" className="scroll-mt-12">
                <PagesBreakdown pages={view.pages} />
              </section>
              <section id="device" className="scroll-mt-12">
                <DevicesPie devices={view.devices} />
              </section>
              <FormsBreakdown leads={view.leads} />
              <section id="origini" className="scroll-mt-12">
                <TenantBreakdown tenants={view.tenants} />
              </section>
            </>
          )}
        </div>
      )}
    </main>
  );
}
