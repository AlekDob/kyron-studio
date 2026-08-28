import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listOrders, type OrdersResponse } from "@/lib/gateway";
import { OrdersWorkspace } from "@/components/orders/OrdersWorkspace";
import { OrdersEmptyState } from "@/components/orders/OrdersEmptyState";

export const metadata = { title: "Ordini — Studio" };

// Vista situazione ordini per i commerciali (feature 008). Un solo fetch al BFF
// filtrato per periodo (from/to nei searchParams); i filtri portale/agente vivono
// client-side in OrdersView (zero refetch), come il pattern Analytics.

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function pickDate(
  value: string | string[] | undefined,
  fallback: string,
): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v && DATE_RE.test(v) ? v : fallback;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const params = await searchParams;
  // Default: tutto lo storico (primo ordine Kyron nel 2026). Il preset
  // "Tutti" in OrdersFilters usa la stessa data di partenza.
  const from = pickDate(params.from, "2026-01-01");
  const to = pickDate(params.to, isoDaysAgo(0));

  let data: OrdersResponse | null = null;
  let failed = false;
  try {
    data = await listOrders({ from, to });
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

  return <OrdersWorkspace data={data} from={from} to={to} />;
}
