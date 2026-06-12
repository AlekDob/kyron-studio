"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import type { DeviceRow } from "@/lib/analytics";
import { fmtInt, fmtPct } from "./format";

// Device dei visitatori come donut + legenda con quote percentuali.
// Dati globali (cms + shop), non filtrati per origine.

const DEVICE_LABELS: Record<string, string> = {
  Desktop: "Desktop",
  Mobile: "Mobile",
  Tablet: "Tablet",
  Altro: "Altro",
};

const COLORS = [
  "var(--color-accent)",
  "var(--color-positive)",
  "var(--color-warning)",
  "var(--color-ink-muted)",
];

interface DevicesPieProps {
  devices: DeviceRow[];
}

export function DevicesPie({ devices }: DevicesPieProps) {
  if (devices.length === 0) return null;
  const total = devices.reduce((s, d) => s + d.visitors, 0) || 1;
  const data = devices.map((d) => ({
    name: DEVICE_LABELS[d.device] ?? d.device,
    value: d.visitors,
  }));

  return (
    <Card padding="sm" className="px-5 py-4">
      <h2 className="text-sm font-medium mb-3">Device</h2>
      <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
        <div className="h-[170px]">
          {/* initialDimension: stesso gotcha recharts 3 del TrafficChart. */}
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 180, height: 170 }}
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={75}
                paddingAngle={2}
                stroke="var(--color-paper)"
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => fmtInt(Number(value))}
                contentStyle={{
                  backgroundColor: "var(--color-paper)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "var(--color-ink)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-col gap-2">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-[var(--color-ink-soft)]">{d.name}</span>
              <span className="ml-auto tabular-nums font-medium">
                {fmtInt(d.value)}
                <span className="ml-2 text-xs text-[var(--color-ink-muted)]">
                  {fmtPct(d.value / total)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
