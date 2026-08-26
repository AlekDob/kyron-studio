"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui";
import { fmtEur } from "./format";
import type { AppFilter, TimeseriesPoint } from "@/lib/analytics";

// Unico leaf client del modulo: recharts resta nel chunk di /analytics.
// Colori da CSS vars cosi' light/dark vengono gratis.

// Ordini per giorno: opzionale, la passa solo il cruscotto. Su /analytics
// resta undefined e il grafico e' identico a prima.
export interface OrdersPoint {
  date: string; // YYYY-MM-DD
  orders: number;
  revenue: number;
}

interface TrafficChartProps {
  points: TimeseriesPoint[];
  orders?: OrdersPoint[];
  app: AppFilter;
  // Estremi del periodo (YYYY-MM-DD): i bucket senza eventi vanno a zero,
  // altrimenti con 1 solo punto di dati l'AreaChart non disegna nulla.
  from: string;
  to: string;
  // "hour" per Oggi/Ieri: bucket orari "YYYY-MM-DDTHH" sul giorno `from`.
  granularity: "hour" | "day";
}

interface ChartRow {
  date: string;
  cms: number;
  storefront: number;
  orders: number;
  revenue: number;
}

function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end && days.length < 400) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// Bucket orari del giorno `from` (00..23).
function eachHour(from: string): string[] {
  return Array.from(
    { length: 24 },
    (_, h) => `${from}T${String(h).padStart(2, "0")}`,
  );
}

// Pivot (date, app) -> una riga per bucket con le due serie visitatori,
// zero-filled su tutto il periodo.
function pivot(
  points: TimeseriesPoint[],
  buckets: string[],
  orders: OrdersPoint[] = [],
): ChartRow[] {
  const byDate = new Map<string, ChartRow>(
    buckets.map((d) => [
      d,
      { date: d, cms: 0, storefront: 0, orders: 0, revenue: 0 },
    ]),
  );
  for (const p of points) {
    const row = byDate.get(p.date);
    if (row) row[p.app] += p.visitors;
  }
  for (const o of orders) {
    const row = byDate.get(o.date);
    if (!row) continue;
    row.orders += o.orders;
    row.revenue += o.revenue;
  }
  return [...byDate.values()];
}

// "2026-06-12" -> "12/06"; "2026-06-12T09" -> "09h".
function shortLabel(iso: string): string {
  if (iso.length > 10) return `${iso.slice(11, 13)}h`;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

const SERIES: Array<{ key: "cms" | "storefront"; label: string; color: string }> = [
  { key: "cms", label: "Sito", color: "var(--color-accent)" },
  { key: "storefront", label: "Shop", color: "var(--color-positive)" },
];

// Gli ordini stanno su un asse Y loro: 3 ordini e 300 visite sullo stesso asse
// tengono la linea ordini incollata al pavimento.
const ORDERS_COLOR = "var(--color-warning)";

// Tooltip custom: Totale in testa, poi Sito sopra e Shop sotto (l'ordine
// di default di recharts segue le serie renderizzate, non quello voluto).
interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const valueOf = (key: string): number | null => {
    const entry = payload.find((p) => p.dataKey === key);
    return entry ? Number(entry.value ?? 0) : null;
  };
  const cms = valueOf("cms");
  const shop = valueOf("storefront");
  const rows: Array<{ label: string; value: number; color: string }> = [];
  if (cms !== null && shop !== null) {
    rows.push({ label: "Totale", value: cms + shop, color: "var(--color-ink)" });
  }
  if (cms !== null) rows.push({ label: "Sito", value: cms, color: "var(--color-accent)" });
  if (shop !== null) rows.push({ label: "Shop", value: shop, color: "var(--color-positive)" });
  const orders = valueOf("orders");
  const revenue = valueOf("revenue");

  return (
    <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-xs text-[var(--color-ink)] shadow-sm">
      <p className="font-medium">
        {typeof label === "string" ? shortLabel(label) : label}
      </p>
      {rows.map((r) => (
        <p key={r.label} className="mt-1 tabular-nums" style={{ color: r.color }}>
          {r.label} : {r.value}
        </p>
      ))}
      {orders !== null && (
        <p className="mt-1 tabular-nums" style={{ color: ORDERS_COLOR }}>
          Ordini : {orders}
          {revenue ? ` (${fmtEur(revenue)})` : ""}
        </p>
      )}
    </div>
  );
}

export function TrafficChart({
  points,
  orders,
  app,
  from,
  to,
  granularity,
}: TrafficChartProps) {
  const buckets = granularity === "hour" ? eachHour(from) : eachDay(from, to);
  const data = pivot(points, buckets, orders);
  const series = SERIES.filter((s) => app === "all" || s.key === app);
  const showOrders = Boolean(orders);

  return (
    <Card padding="md">
      <Card.Header>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">
            {granularity === "hour"
              ? "Visitatori per ora"
              : showOrders
                ? "Visite e ordini per giorno"
                : "Visitatori per giorno"}
          </h2>
          <div className="flex gap-4 text-xs text-[var(--color-ink-muted)]">
            {series.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
            ))}
            {showOrders && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: ORDERS_COLOR }}
                />
                Ordini
              </span>
            )}
          </div>
        </div>
      </Card.Header>
      <div className="mt-3 h-[220px] sm:h-[280px]">
        {/* initialDimension: senza, il primo measure post-hydration torna -1
            e il chart resta vuoto (recharts 3 + Next). */}
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 600, height: 220 }}
        >
          <AreaChart
            data={data}
            margin={{ top: 4, right: showOrders ? -14 : 4, bottom: 0, left: -18 }}
          >
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortLabel}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
              minTickGap={24}
            />
            <YAxis
              yAxisId="visitors"
              allowDecimals={false}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            {showOrders && (
              <YAxis
                yAxisId="orders"
                orientation="right"
                allowDecimals={false}
                tick={{ fill: ORDERS_COLOR, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
            )}
            <Tooltip content={<ChartTooltip />} />
            {series.map((s) => (
              <Area
                key={s.key}
                yAxisId="visitors"
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            ))}
            {showOrders && (
              <Area
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                name="Ordini"
                stroke={ORDERS_COLOR}
                fill="none"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
