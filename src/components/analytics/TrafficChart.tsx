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
import { Card } from "@/components/ui/Card";
import type { AppFilter, TimeseriesPoint } from "@/lib/analytics";

// Unico leaf client del modulo: recharts resta nel chunk di /analytics.
// Colori da CSS vars cosi' light/dark vengono gratis.

interface TrafficChartProps {
  points: TimeseriesPoint[];
  app: AppFilter;
  // Estremi del periodo (YYYY-MM-DD): i giorni senza eventi vanno a zero,
  // altrimenti con 1 solo giorno di dati l'AreaChart non disegna nulla.
  from: string;
  to: string;
}

interface ChartRow {
  date: string;
  cms: number;
  storefront: number;
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

// Pivot (date, app) -> una riga per giorno con le due serie visitatori,
// zero-filled su tutto il periodo.
function pivotByDay(points: TimeseriesPoint[], from: string, to: string): ChartRow[] {
  const byDate = new Map<string, ChartRow>(
    eachDay(from, to).map((d) => [d, { date: d, cms: 0, storefront: 0 }]),
  );
  for (const p of points) {
    const row = byDate.get(p.date);
    if (row) row[p.app] += p.visitors;
  }
  return [...byDate.values()];
}

function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

const SERIES: Array<{ key: "cms" | "storefront"; label: string; color: string }> = [
  { key: "cms", label: "Sito", color: "var(--color-accent)" },
  { key: "storefront", label: "Shop", color: "var(--color-positive)" },
];

export function TrafficChart({ points, app, from, to }: TrafficChartProps) {
  const data = pivotByDay(points, from, to);
  const series = SERIES.filter((s) => app === "all" || s.key === app);

  return (
    <Card padding="md">
      <Card.Header>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">Visitatori per giorno</h2>
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
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(label) =>
                typeof label === "string" ? shortDate(label) : label
              }
              contentStyle={{
                backgroundColor: "var(--color-paper)",
                border: "1px solid var(--color-line)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--color-ink)",
              }}
            />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
