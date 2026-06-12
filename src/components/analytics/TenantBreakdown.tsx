"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import type { TenantRow } from "@/lib/analytics";
import { fuzzyFilter } from "@/lib/fuzzy";
import { fmtEur, fmtInt, fmtPct } from "./format";

// Breakdown per tenant: tabella su desktop, stack di card su mobile.
// Le righe arrivano gia' ordinate dal BFF (sito, shop principale, poi ricavi).
// Ricerca fuzzy client-side su label+slug: coi portali che crescono la lista
// va filtrata, e il match a sottosequenza perdona i typo ("mssr" -> Massari).

interface TenantBreakdownProps {
  tenants: TenantRow[];
}

const COLUMNS = [
  "Visitatori",
  "Pageview",
  "Carrelli",
  "Checkout",
  "Ordini",
  "Conversione",
  "Ricavi",
] as const;

function rowValues(t: TenantRow): string[] {
  return [
    fmtInt(t.visitors),
    fmtInt(t.pageviews),
    fmtInt(t.addedToCart),
    fmtInt(t.checkoutsStarted),
    fmtInt(t.orders),
    fmtPct(t.conversionRate),
    fmtEur(t.revenueEur),
  ];
}

function TenantLabel({ tenant }: { tenant: TenantRow }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-medium">{tenant.label}</span>
      {!tenant.known && (
        <Pill variant="warning" size="sm">
          non onboardata
        </Pill>
      )}
    </span>
  );
}

function DesktopTable({ tenants }: TenantBreakdownProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--color-line)] text-left text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
          <th className="py-2.5 pr-4 font-medium">Origine</th>
          {COLUMNS.map((col) => (
            <th key={col} className="py-2.5 pr-4 text-right font-medium last:pr-0">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tenants.map((t) => (
          <tr key={t.key} className="border-b border-[var(--color-line)] last:border-b-0">
            <td className="py-3 pr-4">
              <TenantLabel tenant={t} />
            </td>
            {rowValues(t).map((value, i) => (
              <td key={COLUMNS[i]} className="py-3 pr-4 text-right tabular-nums last:pr-0">
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MobileCards({ tenants }: TenantBreakdownProps) {
  return (
    <ul className="flex flex-col gap-3">
      {tenants.map((t) => (
        <li key={t.key}>
          <Card padding="sm" className="px-4 py-3.5">
            <TenantLabel tenant={t} />
            <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2.5">
              {rowValues(t).map((value, i) => (
                <div key={COLUMNS[i]}>
                  <dt className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                    {COLUMNS[i]}
                  </dt>
                  <dd className="text-sm font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function TenantBreakdown({ tenants }: TenantBreakdownProps) {
  const [query, setQuery] = useState("");
  const filtered = fuzzyFilter(
    tenants,
    query,
    (t) => `${t.label} ${t.slug ?? ""}`,
  );

  return (
    <Card padding="md">
      <Card.Header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Dettaglio per origine</h2>
          <label className="relative flex w-full items-center sm:w-64">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[var(--color-ink-muted)]"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca portale..."
              aria-label="Cerca origine o portale"
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] py-1.5 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-ink)]"
            />
          </label>
        </div>
      </Card.Header>
      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
          Nessuna origine corrisponde a &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <>
          <div className="mt-3 hidden overflow-x-auto lg:block">
            <DesktopTable tenants={filtered} />
          </div>
          <div className="mt-3 lg:hidden">
            <MobileCards tenants={filtered} />
          </div>
        </>
      )}
    </Card>
  );
}
