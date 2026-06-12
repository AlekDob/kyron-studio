import { Card } from "@/components/ui/Card";
import type { KpiTotals, LeadTotals, PrevTotals } from "@/lib/analytics";
import { fmtEur, fmtInt } from "./format";

// Griglia KPI principale: 2 colonne su mobile, 3 su tablet, 6 su desktop.
// I lead KPI (form/newsletter/registrazioni) sono globali, non per-app:
// restano visibili anche col filtro origine attivo.
// Sotto ogni valore: delta % vs periodo precedente di pari durata.

interface KpiGridProps {
  kpis: KpiTotals;
  leads?: LeadTotals;
  // Totali del periodo precedente: prevKpis segue il filtro origine,
  // prevLeads e' globale come i lead correnti.
  prevKpis?: KpiTotals;
  prevLeads?: PrevTotals["leads"];
}

interface KpiItem {
  label: string;
  value: string;
  // null = confronto non disponibile (prev assente)
  delta: number | null;
}

// Variazione relativa cur/prev. prev=0: null se anche cur=0, altrimenti
// Infinity (renderizzato come "nuovo").
function deltaOf(cur: number, prev?: number): number | null {
  if (prev === undefined) return null;
  if (prev === 0) return cur === 0 ? null : Infinity;
  return (cur - prev) / prev;
}

function buildItems(
  k: KpiTotals,
  leads?: LeadTotals,
  prev?: KpiTotals,
  prevLeads?: PrevTotals["leads"],
): KpiItem[] {
  const items: KpiItem[] = [
    { label: "Visitatori", value: fmtInt(k.visitors), delta: deltaOf(k.visitors, prev?.visitors) },
    { label: "Pageview", value: fmtInt(k.pageviews), delta: deltaOf(k.pageviews, prev?.pageviews) },
    { label: "Carrelli", value: fmtInt(k.addedToCart), delta: deltaOf(k.addedToCart, prev?.addedToCart) },
    { label: "Checkout", value: fmtInt(k.checkoutsStarted), delta: deltaOf(k.checkoutsStarted, prev?.checkoutsStarted) },
    { label: "Ordini", value: fmtInt(k.orders), delta: deltaOf(k.orders, prev?.orders) },
    { label: "Ricavi", value: fmtEur(k.revenueEur), delta: deltaOf(k.revenueEur, prev?.revenueEur) },
  ];
  if (leads) {
    items.push(
      { label: "Form compilati", value: fmtInt(leads.formSubmits), delta: deltaOf(leads.formSubmits, prevLeads?.formSubmits) },
      { label: "Iscrizioni newsletter", value: fmtInt(leads.newsletterSubs), delta: deltaOf(leads.newsletterSubs, prevLeads?.newsletterSubs) },
      { label: "Registrazioni shop", value: fmtInt(leads.registrations), delta: deltaOf(leads.registrations, prevLeads?.registrations) },
    );
  }
  return items;
}

// Delta badge: verde in crescita, rosso in calo, neutro a parita'.
function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="text-[11px] text-[var(--color-ink-muted)]">—</span>
    );
  }
  if (delta === Infinity) {
    return (
      <span className="text-[11px] font-medium text-[var(--color-positive)]">
        nuovo
      </span>
    );
  }
  const pct = Math.round(delta * 100);
  const cls =
    pct > 0
      ? "text-[var(--color-positive)]"
      : pct < 0
        ? "text-[var(--color-critical)]"
        : "text-[var(--color-ink-muted)]";
  return (
    <span className={`text-[11px] font-medium tabular-nums ${cls}`}>
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

export function KpiGrid({ kpis, leads, prevKpis, prevLeads }: KpiGridProps) {
  const hasPrev = prevKpis !== undefined;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {buildItems(kpis, leads, prevKpis, prevLeads).map((item) => (
        <Card key={item.label} padding="sm" className="px-4 py-3.5">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            {item.label}
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-medium tracking-tight tabular-nums">
              {item.value}
            </span>
            {hasPrev && <DeltaBadge delta={item.delta} />}
          </div>
        </Card>
      ))}
    </div>
  );
}
