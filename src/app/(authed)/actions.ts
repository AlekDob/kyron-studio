"use server";
import { getAnalyticsOverview, type RangeKey } from "@/lib/analytics";

export interface VisitsTotals {
  visitors: number;
  pageviews: number;
}

/**
 * Visitatori + pagine viste di un periodo, per la tile Visite del cruscotto.
 * Solo i due numeri: il payload overview del BFF pesa (timeseries, geo, fonti,
 * device) e la Query API PostHog sta a ~120 query/ora condivise con /analytics,
 * quindi il client tiene in cache i periodi che ha gia' chiesto.
 * Null se PostHog e' giu' o non configurato: la tile mostra "—".
 */
export async function visitsTotalsAction(range: RangeKey): Promise<VisitsTotals | null> {
  try {
    const data = await getAnalyticsOverview(range);
    return { visitors: data.totals.visitors, pageviews: data.totals.pageviews };
  } catch {
    return null;
  }
}
