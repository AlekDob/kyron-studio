"use client";
// Testata del pannello Ordini: KPI (cliccabili, sono il filtro stato), ricerca
// e filtri. Resta ferma mentre la lista scorre. Ogni tocco qui e' umano, quindi
// riporta sempre `source` a "browse": il pannello torna in mano all'operatore.
import { Search } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { Card, Input } from "@/components/ui";
import { OrdersFilters, type PortalOption } from "./OrdersFilters";
import { formatEur } from "./format";
import {
  STATUS_LABELS,
  statusBucketOf,
  type OrdersFilter,
  type StatusBucket,
} from "./orders-filter";

interface Props {
  rows: OrderRow[]; // ordini gia' filtrati: i KPI contano quello che si vede
  filter: OrdersFilter;
  onChange: (patch: Partial<OrdersFilter>) => void;
  portals: PortalOption[];
  agents: string[];
}

interface Bucket {
  count: number;
  eur: number;
}

function bucketTotals(rows: OrderRow[]): Record<StatusBucket, Bucket> {
  const empty = (): Bucket => ({ count: 0, eur: 0 });
  const out: Record<StatusBucket, Bucket> = {
    all: empty(),
    confermati: empty(),
    "da-confermare": empty(),
    annullati: empty(),
  };
  for (const o of rows) {
    const b = out[statusBucketOf(o)];
    b.count++;
    b.eur += o.totalGross;
    out.all.count++;
    out.all.eur += o.totalGross;
  }
  return out;
}

export function OrdersHeader({ rows, filter, onChange, portals, agents }: Props) {
  const totals = bucketTotals(rows);
  // Secondo click sullo stato gia' attivo = torna a tutti.
  const toggleStatus = (status: StatusBucket) =>
    onChange({
      status: filter.status === status ? "all" : status,
      source: "browse",
    });

  return (
    <div className="flex shrink-0 flex-col gap-4 px-5 pb-4 pt-5">
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Ordini" value={String(totals.all.count)} />
        <Kpi label="Totale" value={formatEur(totals.all.eur)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["confermati", "da-confermare", "annullati"] as const).map((b) => (
          <Kpi
            key={b}
            label={STATUS_LABELS[b]}
            value={String(totals[b].count)}
            sub={formatEur(totals[b].eur)}
            active={filter.status === b}
            onClick={() => toggleStatus(b)}
          />
        ))}
      </div>

      <Input
        size="sm"
        placeholder="Cerca per n° ordine, cliente o transazione Stripe…"
        value={filter.query}
        onChange={(e) => onChange({ query: e.target.value, source: "browse" })}
        iconLeft={<Search size={15} />}
      />

      <OrdersFilters
        filter={filter}
        onChange={onChange}
        portals={portals}
        agents={agents}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  active,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string; // valore economico sotto il conteggio
  active?: boolean;
  onClick?: () => void;
}) {
  const card = (
    <Card padding="md">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-medium tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{sub}</p>}
    </Card>
  );
  if (!onClick) return card;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[var(--radius-card)] text-left transition-shadow ${
        active
          ? "ring-2 ring-[var(--color-accent)]"
          : "hover:ring-1 hover:ring-[var(--color-line)]"
      }`}
    >
      {card}
    </button>
  );
}
