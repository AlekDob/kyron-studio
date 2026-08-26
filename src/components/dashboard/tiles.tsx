// Le tile del cruscotto: un componente async per fonte, ognuno dentro il suo
// <Suspense> nel mosaico. Se una fonte cade la tile mostra "—" e il resto della
// pagina resta in piedi (niente error boundary a livello di pagina).
import { cache } from "react";
import { listOrders, listPortals, type OrdersResponse } from "@/lib/gateway";
import { getAnalyticsOverview, type AnalyticsOverview } from "@/lib/analytics";
import { fmtEur, fmtInt } from "@/components/analytics/format";
import { StatTile, TilePill } from "./StatTile";

const DAYS = 30;

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Gli ordini servono tre volte (2 tile + grafico): `cache` li interroga una
 * volta sola per richiesta. Null se Saleor e' giu'.
 */
export const orders30d = cache(
  async (): Promise<OrdersResponse | null> => {
    try {
      return await listOrders({ from: isoDaysAgo(DAYS), to: isoDaysAgo(0) });
    } catch {
      return null; // tile a "—", il cruscotto resta navigabile.
    }
  },
);

/** Ordini + fatturato vengono dalla stessa chiamata: una sola, due tile. */
export async function OrdersTiles() {
  const res = await orders30d();
  const count = res ? res.count : null;
  const totalGross = res ? res.totalGross : null;

  return (
    <>
      <StatTile
        index={0}
        className="lg:col-span-3"
        tone="indaco"
        label="Ordini 30 giorni"
        value={count === null ? "—" : fmtInt(count)}
        caption="tutti i portali scuola"
      />
      <StatTile
        index={1}
        className="lg:col-span-3"
        tone="menta"
        label="Fatturato 30 giorni"
        value={totalGross === null ? "—" : fmtEur(totalGross)}
        caption="totale lordo incassato"
        footer={
          count && totalGross ? (
            <TilePill>scontrino medio {fmtEur(totalGross / count)}</TilePill>
          ) : null
        }
      />
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
      className="lg:col-span-3"
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
      className="lg:col-span-3"
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
