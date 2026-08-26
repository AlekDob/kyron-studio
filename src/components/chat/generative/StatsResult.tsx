"use client";

import type { ReactElement } from "react";
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
import { BarList } from "@/components/analytics/BarList";
import { fmtEur, fmtInt } from "@/components/analytics/format";

// Risultato di una query HogQL scritta da Ada. Le colonne sono arbitrarie:
// la tabella c'e' sempre, barre o linea si aggiungono se la vista lo chiede.

export interface StatsResultProps {
  title: string;
  columns: string[];
  rows: unknown[][];
  view: "table" | "bars" | "line";
}

// L'ultima colonna numerica e' il valore da disegnare (le query aggregate
// mettono la dimensione a sinistra e la misura a destra).
function valueIndex(columns: string[], rows: unknown[][]): number {
  const first = rows[0];
  if (!first) return -1;
  for (let i = columns.length - 1; i >= 0; i--) {
    if (typeof first[i] === "number") return i;
  }
  return -1;
}

// Colonne di soldi formattate in EUR: il nome e' l'unico indizio che abbiamo.
function isMoney(column: string): boolean {
  return /fattur|revenue|total|eur|ricav|importo/i.test(column);
}

function fmtCell(value: unknown, column: string): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    return isMoney(column) ? fmtEur(value) : fmtInt(value);
  }
  return String(value);
}

function toChartRows(
  rows: unknown[][],
  valueIdx: number,
): Array<{ label: string; value: number }> {
  return rows.map((r) => ({
    label: String(r[0] ?? ""),
    value: Number(r[valueIdx] ?? 0),
  }));
}

export function StatsResult({
  title,
  columns,
  rows,
  view,
}: StatsResultProps): ReactElement {
  const valueIdx = valueIndex(columns, rows);
  const chart = valueIdx >= 0 ? toChartRows(rows, valueIdx) : [];
  const valueLabel = valueIdx >= 0 ? columns[valueIdx] : "";

  return (
    <Card padding="md">
      <Card.Header>
        <h3 className="text-sm font-medium">{title}</h3>
      </Card.Header>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Nessun dato per questa query.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {view === "line" && chart.length > 1 && (
            <StatsLine rows={chart} label={valueLabel} />
          )}
          {view === "bars" && chart.length > 0 && (
            <BarList rows={chart.map((r) => ({ label: r.label, count: r.value }))} />
          )}
          <StatsTable columns={columns} rows={rows} />
        </div>
      )}
    </Card>
  );
}

function StatsTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: unknown[][];
}): ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-muted)]">
            {columns.map((c) => (
              <th key={c} className="px-2 py-1.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--color-line)] last:border-0">
              {columns.map((c, j) => (
                <td
                  key={c}
                  className={`px-2 py-1.5 ${typeof row[j] === "number" ? "tabular-nums" : ""}`}
                >
                  {fmtCell(row[j], c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Serie nel tempo: una riga per bucket, la prima colonna e' l'etichetta X.
function StatsLine({
  rows,
  label,
}: {
  rows: Array<{ label: string; value: number }>;
  label: string;
}): ReactElement {
  return (
    <div className="h-[200px]">
      {/* initialDimension: senza, il primo measure post-hydration torna -1
          e il chart resta vuoto (recharts 3 + Next). */}
      <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={{ width: 600, height: 200 }}
      >
        <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="label"
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
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--color-line)",
              background: "var(--color-paper)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
