import { Card } from "@/components/ui/Card";
import type { KpiTotals, LeadTotals } from "@/lib/analytics";
import { fmtEur, fmtInt } from "./format";

// Griglia KPI principale: 2 colonne su mobile, 3 su tablet, 6 su desktop.
// I lead KPI (form/newsletter/registrazioni) sono globali, non per-app:
// restano visibili anche col filtro origine attivo.

interface KpiGridProps {
  kpis: KpiTotals;
  leads?: LeadTotals;
}

interface KpiItem {
  label: string;
  value: string;
}

function buildItems(k: KpiTotals, leads?: LeadTotals): KpiItem[] {
  const items = [
    { label: "Visitatori", value: fmtInt(k.visitors) },
    { label: "Pageview", value: fmtInt(k.pageviews) },
    { label: "Carrelli", value: fmtInt(k.addedToCart) },
    { label: "Checkout", value: fmtInt(k.checkoutsStarted) },
    { label: "Ordini", value: fmtInt(k.orders) },
    { label: "Ricavi", value: fmtEur(k.revenueEur) },
  ];
  if (leads) {
    items.push(
      { label: "Form compilati", value: fmtInt(leads.formSubmits) },
      { label: "Iscrizioni newsletter", value: fmtInt(leads.newsletterSubs) },
      { label: "Registrazioni shop", value: fmtInt(leads.registrations) },
    );
  }
  return items;
}

export function KpiGrid({ kpis, leads }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {buildItems(kpis, leads).map((item) => (
        <Card key={item.label} padding="sm" className="px-4 py-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            {item.label}
          </div>
          <div className="mt-1 text-2xl font-medium tracking-tight tabular-nums">
            {item.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
