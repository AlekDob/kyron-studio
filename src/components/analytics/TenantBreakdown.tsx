import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import type { TenantRow } from "@/lib/analytics";
import { fmtEur, fmtInt, fmtPct } from "./format";

// Breakdown per tenant: tabella su desktop, stack di card su mobile.
// Le righe arrivano gia' ordinate dal BFF (sito, shop principale, poi ricavi).

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
  return (
    <Card padding="md">
      <Card.Header>
        <h2 className="text-sm font-medium">Dettaglio per origine</h2>
      </Card.Header>
      <div className="mt-3 hidden overflow-x-auto lg:block">
        <DesktopTable tenants={tenants} />
      </div>
      <div className="mt-3 lg:hidden">
        <MobileCards tenants={tenants} />
      </div>
    </Card>
  );
}
