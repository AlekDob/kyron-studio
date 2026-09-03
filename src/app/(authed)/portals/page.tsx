import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listPortals, type PortalSummary } from "@/lib/gateway";
import { PortalsWorkspace } from "@/components/portals/PortalsWorkspace";
import { PortalsEmptyState } from "@/components/portals/PortalsEmptyState";
import {
  applyFilter,
  buckets,
  type PortalOrder,
  type PortalStatus,
  type PortalsFilter,
} from "@/components/portals/portals-filter";

export const metadata = { title: "Portali — Studio" };

// Modulo Portali (Livia). Come in Prodotti i filtri stanno nell'URL ma li
// applica QUESTA pagina, non il BFF: `listPortals()` torna gia' tutti i portali
// (decine), filtrare di la' sarebbe un secondo passaggio dietro un salto HTTP.

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUSES = ["all", "live", "bozze"] as const;
const ORDERS = ["nome", "prodotti", "recenti"] as const;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function readFilter(params: Record<string, string | string[] | undefined>): PortalsFilter {
  const status = one(params.stato) as PortalStatus;
  const order = one(params.ord) as PortalOrder;
  return {
    query: one(params.q),
    status: STATUSES.includes(status) ? status : "all",
    city: one(params.citta) || "all",
    order: ORDERS.includes(order) ? order : "nome",
    // Un filtro scritto in URL da Livia arriva con `agente=1`: e' lei a possedere
    // il pannello finche' l'operatore non tocca un chip.
    source: one(params.agente) ? "agent" : "browse",
  };
}

/** Le citta' viste nei portali, in ordine alfabetico: sono i chip del filtro. */
function citiesOf(portals: PortalSummary[]): string[] {
  return [...new Set(portals.map((p) => p.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export default async function PortalsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const params = await searchParams;
  const filter = readFilter(params);
  // Come /orders: prima l'eccezione del gateway buttava giu' tutta la pagina in 500.
  const portals = await listPortals().catch(() => null);

  if (!portals) {
    return (
      <main className="px-5 py-8 sm:px-8">
        <PortalsEmptyState variant="error" />
      </main>
    );
  }

  return (
    <PortalsWorkspace
      filter={filter}
      // Deep link ancora valido: /portals/<slug> reindirizza qui con ?detail=.
      initialSlug={one(params.detail) || null}
      data={{
        portals: applyFilter(portals, filter),
        buckets: buckets(portals),
        cities: citiesOf(portals),
      }}
    />
  );
}
