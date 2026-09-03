import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listCustomers, type CustomersResponse } from "@/lib/customers";
import { CustomersWorkspace } from "@/components/customers/CustomersWorkspace";
import { CustomersEmptyState } from "@/components/customers/CustomersEmptyState";
import type { CustomerGroup, CustomersFilter } from "@/components/customers/customers-filter";
import { parseSpec } from "@/lib/query-spec";

export const metadata = { title: "Clienti — Studio" };

// Vista clienti (feature 021). Un cliente e' chi ha ordinato: la lista la
// deriva il BFF dagli ordini del periodo. Come Ordini, tutti i filtri stanno
// nell'URL e li applica il server: un filtro complesso e' un link
// condivisibile e il tasto indietro del browser funziona.

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const GROUPS = ["all", "nuovi", "ricorrenti"] as const;

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

function readFilter(params: Record<string, string | string[] | undefined>): CustomersFilter {
  const group = one(params.group) as CustomerGroup;
  return {
    // Default: tutto lo storico (primo ordine Kyron nel 2026). Un cliente si
    // guarda sullo storico, non sugli ultimi 30 giorni come gli ordini.
    from: pickDate(params.from, "2026-01-01"),
    to: pickDate(params.to, isoDaysAgo(0)),
    portal: one(params.portal) || "all",
    agent: one(params.agent) || "all",
    group: GROUPS.includes(group) ? group : "all",
    query: one(params.q),
    spec: parseSpec(one(params.spec)),
    // Uno spec in URL puo' arrivare solo da Bea: e' lei a possedere il pannello.
    source: one(params.spec) ? "agent" : "browse",
  };
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const filter = readFilter(await searchParams);

  let data: CustomersResponse | null = null;
  try {
    data = await listCustomers({
      from: filter.from,
      to: filter.to,
      portal: filter.portal,
      agent: filter.agent,
      group: filter.group,
      q: filter.query,
      spec: filter.spec ? JSON.stringify(filter.spec) : undefined,
    });
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <main className="px-5 py-8 sm:px-8">
        <CustomersEmptyState variant="error" />
      </main>
    );
  }

  return <CustomersWorkspace data={data} filter={filter} />;
}
