import { gatewayFetch, GatewayError } from "./gateway";

// Tipi mirror di studio-server src/features/analytics/types.ts.
// Brain: decision-017 — il frontend parla solo col BFF, mai con PostHog.

export type RangeKey = "7d" | "30d" | "90d";
export type AppKey = "cms" | "storefront";
export type AppFilter = "all" | AppKey;

export interface KpiTotals {
  visitors: number;
  pageviews: number;
  addedToCart: number;
  checkoutsStarted: number;
  orders: number;
  revenueEur: number;
}

export interface TenantRow extends KpiTotals {
  key: string;
  app: AppKey;
  slug: string | null;
  label: string;
  known: boolean;
  conversionRate: number;
}

export interface TimeseriesPoint {
  date: string;
  app: AppKey;
  visitors: number;
  pageviews: number;
  orders: number;
  revenueEur: number;
}

export interface AnalyticsOverview {
  range: RangeKey;
  from: string;
  to: string;
  generatedAt: string;
  stale: boolean;
  totals: KpiTotals;
  byApp: Record<AppKey, KpiTotals>;
  tenants: TenantRow[];
  timeseries: TimeseriesPoint[];
}

export type AnalyticsErrorKind = "not-configured" | "query-error" | "unknown";

export async function getAnalyticsOverview(
  range: RangeKey,
): Promise<AnalyticsOverview> {
  return gatewayFetch<AnalyticsOverview>(
    `/api/v1/analytics/overview?range=${range}`,
  );
}

// Mappa il body d'errore del BFF nelle varianti dell'EmptyState.
export function analyticsErrorKind(err: unknown): AnalyticsErrorKind {
  if (!(err instanceof GatewayError)) return "unknown";
  if (err.message.includes("posthog_not_configured")) return "not-configured";
  if (err.message.includes("posthog_error")) return "query-error";
  return "unknown";
}
