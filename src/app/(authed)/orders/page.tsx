import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listOrders, type OrdersResponse } from "@/lib/gateway";
import { OrdersWorkspace } from "@/components/orders/OrdersWorkspace";
import { OrdersEmptyState } from "@/components/orders/OrdersEmptyState";
import type { OrdersFilter, StatusBucket } from "@/components/orders/orders-filter";
import { parseSpec } from "@/lib/query-spec";

export const metadata = { title: "Ordini — Studio" };

// Vista situazione ordini per i commerciali (feature 008). Tutti i filtri stanno
// nell'URL e li applica il BFF (studio-server, core/query): la pagina non filtra
// niente in memoria. Effetto: un filtro complesso e' un link condivisibile e il
// tasto indietro del browser funziona.

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["all", "da-confermare", "confermati", "annullati"] as const;

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function pickDate(value: string | string[] | undefined, fallback: string): string {
  const v = one(value);
  return DATE_RE.test(v) ? v : fallback;
}

function readFilter(params: Record<string, string | string[] | undefined>): OrdersFilter {
  const status = one(params.status) as StatusBucket;
  return {
    // Default: tutto lo storico (primo ordine Kyron nel 2026). Il preset
    // "Tutti" in OrdersFilters usa la stessa data di partenza.
    from: pickDate(params.from, "2026-01-01"),
    to: pickDate(params.to, isoDaysAgo(0)),
    portal: one(params.portal) || "all",
    agent: one(params.agent) || "all",
    status: STATUSES.includes(status) ? status : "all",
    query: one(params.q),
    spec: parseSpec(one(params.spec)),
    // Uno spec in URL puo' arrivare solo da Nico: e' lui a possedere il pannello.
    source: one(params.spec) ? "agent" : "browse",
  };
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const filter = readFilter(await searchParams);

  let data: OrdersResponse | null = null;
  let failed = false;
  try {
    data = await listOrders({
      from: filter.from,
      to: filter.to,
      portal: filter.portal,
      agent: filter.agent,
      status: filter.status,
      q: filter.query,
      spec: filter.spec ? JSON.stringify(filter.spec) : undefined,
    });
  } catch {
    failed = true;
  }

  if (failed || !data) {
    return (
      <main className="px-5 py-8 sm:px-8">
        <OrdersEmptyState variant="error" />
      </main>
    );
  }

  return <OrdersWorkspace data={data} filter={filter} />;
}
