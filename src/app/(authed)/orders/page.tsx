import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listOrders, type OrdersResponse } from "@/lib/gateway";
import { OrdersView } from "@/components/orders/OrdersView";
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

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 max-w-6xl mx-auto">
      <header className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-5">
        <p className="eyebrow mb-2">Studio · Ordini</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Ordini <span className="font-serif italic">portali</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          Tutti gli ordini dei portali scuola. Filtra per data, portale o agente
          commerciale; espandi un ordine per vedere i prodotti.
        </p>
      </header>

      {failed || !data ? (
        <OrdersEmptyState variant="error" />
      ) : (
        <OrdersView data={data} from={from} to={to} />
      )}
    </main>
  );
}
