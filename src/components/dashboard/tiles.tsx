// Le tile del cruscotto: un componente async per fonte, ognuno dentro il suo
// <Suspense> nel mosaico. Se una fonte cade la tile mostra "—" e il resto della
// pagina resta in piedi (niente error boundary a livello di pagina).
import { cache } from "react";
import { listOrders, listPortals, type OrdersResponse } from "@/lib/gateway";
import { getAnalyticsOverview, type AnalyticsOverview } from "@/lib/analytics";
import { fmtInt } from "@/components/analytics/format";
import { StatTile, TilePill } from "./StatTile";
import {
  RevenueTile,
  type RevenueBucket,
  type RevenueRange,
} from "./RevenueTile";

const DAYS = 30;
/** Prima data possibile: nessun ordine Kyron e' anteriore. */
const FROM_ALL = "2020-01-01";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Tutto lo storico ordini, una volta per richiesta (`cache`): la tile fatturato
 * ha un periodo "sempre", quindi lo storico va letto comunque. Ordini 30 giorni
 * e grafico si ricavano filtrando in memoria, senza una seconda chiamata.
 * Null se Saleor e' giu'.
 * ponytail: lo storico cresce e il gateway pagina a 100 ordini per volta. Se la
 * dashboard rallenta, serve un endpoint di aggregati per periodo su
 * studio-server invece di scaricare tutte le righe.
 */
export const ordersAll = cache(
  async (): Promise<OrdersResponse | null> => {
    try {
      return await listOrders({ from: FROM_ALL, to: isoDaysAgo(0) });
    } catch {
      return null; // tile a "—", il cruscotto resta navigabile.
    }
  },
);

/** Giorni indietro per periodo; 0 = oggi, null = tutto lo storico. */
const RANGE_DAYS: Record<RevenueRange, number | null> = {
  all: null,
  "7d": 7,
  "3d": 3,
  today: 0,
};

/**
 * Conteggio + lordo degli ordini creati negli ultimi `days` giorni. Stessa somma
 * che fa il gateway (`orders/route.ts`: reduce su totalGross), quindi i numeri
 * combaciano con la lista ordini.
 */
function aggregate(
  orders: Array<{ created: string; totalGross: number }>,
  days: number | null,
): RevenueBucket {
  const since = days === null ? null : isoDaysAgo(days);
  let count = 0;
  let gross = 0;
  for (const o of orders) {
    if (since && o.created.slice(0, 10) < since) continue;
    count += 1;
    gross += o.totalGross;
  }
  return { count, gross };
}

/** Ordini + fatturato vengono dalla stessa lettura: una sola, due tile. */
export async function OrdersTiles() {
  const res = await ordersAll();
  const last30 = res ? aggregate(res.orders, DAYS) : null;
  const buckets = res
    ? (Object.fromEntries(
        (Object.keys(RANGE_DAYS) as RevenueRange[]).map((k) => [
          k,
          aggregate(res.orders, RANGE_DAYS[k]),
        ]),
      ) as Record<RevenueRange, RevenueBucket>)
    : null;

  return (
    <>
      <StatTile
        index={0}
        className="min-w-0 lg:col-span-3"
        tone="indaco"
        label="Ordini 30 giorni"
        value={last30 === null ? "—" : fmtInt(last30.count)}
        caption="tutti i portali scuola"
      />
      <RevenueTile buckets={buckets} />
    </>
  );
}

export async function PortalsTile() {
  let live: number | null = null;
  let drafts = 0;
  try {
    const portals = await listPortals();
    // Stessa normalizzazione di PortalsList: tutto cio' che non e' draft e' online.
    drafts = portals.filter((p) => p.status === "draft").length;
    live = portals.length - drafts;
  } catch {
    // Payload giu': "—".
  }

  return (
    <StatTile
      index={2}
      className="min-w-0 lg:col-span-3"
      tone="ambra"
      label="Portali attivi"
      value={live === null ? "—" : fmtInt(live)}
      caption="pubblicati su kyronedu.it/shop"
      footer={live !== null && drafts > 0 ? <TilePill>{drafts} in bozza</TilePill> : null}
    />
  );
}

/**
 * PostHog e' la fonte piu' lenta e serve due volte (tile + grafico): `cache`
 * la interroga una volta sola per richiesta.
 */
export const overview30d = cache(
  async (): Promise<AnalyticsOverview | null> => {
    try {
      return await getAnalyticsOverview("30d");
    } catch {
      return null; // PostHog non configurato o in errore.
    }
  },
);

export async function VisitsTile() {
  const data = await overview30d();

  return (
    <StatTile
      index={3}
      className="min-w-0 lg:col-span-3"
      tone="rosa"
      label="Visite 30 giorni"
      value={data ? fmtInt(data.totals.visitors) : "—"}
      caption="sito e shop, visitatori unici"
      footer={
        data ? <TilePill>{fmtInt(data.totals.pageviews)} pagine viste</TilePill> : null
      }
    />
  );
}
