"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { OrdersResponse, OrderRow } from "@/lib/gateway";
import { Card, Input } from "@/components/ui";
import { OrdersFilters, type PortalOption } from "./OrdersFilters";
import { OrdersList } from "./OrdersList";
import { OrderDrawer } from "./OrderDrawer";
import { OrdersEmptyState } from "./OrdersEmptyState";
import { agentName, dayKey, dayLabel, formatEur } from "./format";

interface OrdersViewProps {
  data: OrdersResponse;
  from: string;
  to: string;
}

// true se il buono Carta del Docente copre l'intero totale ordine (tolleranza
// 0,5 cent): in quel caso l'acquisizione salda l'ordine -> badge "Pagato".
function teacherCardCoversTotal(o: OrderRow): boolean {
  return o.teacherCardAmount !== null && o.teacherCardAmount + 0.005 >= o.totalGross;
}

// Overrides ottimistici applicati a un ordine dopo un'azione nel drawer.
interface OrderOverrides {
  workflow?: string;
  acquired?: boolean;
  paid?: boolean; // bonifico puro incassato
  residualPaid?: boolean; // residuo bonifico (pagamento misto) incassato
  note?: string; // nota salvata (persiste alla riapertura del drawer)
  vatOverride?: string; // override IVA salvato
  paymentAmountOverride?: number | null; // importo totale annotato salvato
  vatReliefStatus?: string; // stato validazione agevolazione IVA (feature 002)
}

// L'acquisizione del buono salda l'ordine solo se non resta un residuo bonifico:
// buono che copre tutto, oppure residuo su carta (gia' incassato da Stripe).
function acquisitionPaysOrder(o: OrderRow): boolean {
  return o.residualMethod !== "bank-transfer" &&
    (teacherCardCoversTotal(o) || o.residualMethod === "card");
}

// Applica gli override ottimistici a un ordine (badge/stati aggiornati subito).
function applyOverrides(o: OrderRow, ov: OrderOverrides): OrderRow {
  let next = o;
  if (ov.workflow) next = { ...next, workflowStatus: ov.workflow };
  if (ov.acquired) {
    next = { ...next, teacherCardAcquired: true };
    if (acquisitionPaysOrder(o)) next = { ...next, paymentStatus: "FULLY_CHARGED" };
  }
  if (ov.paid) next = { ...next, bankTransferPaid: true, paymentStatus: "FULLY_CHARGED" };
  if (ov.residualPaid) next = { ...next, residualPaid: true, paymentStatus: "FULLY_CHARGED" };
  if (ov.note !== undefined) next = { ...next, note: ov.note };
  if (ov.vatOverride !== undefined) next = { ...next, vatOverride: ov.vatOverride };
  if (ov.paymentAmountOverride !== undefined)
    next = { ...next, paymentAmountOverride: ov.paymentAmountOverride };
  if (ov.vatReliefStatus !== undefined)
    next = { ...next, vatReliefStatus: ov.vatReliefStatus };
  return next;
}

// Opzioni portale uniche dal payload del periodo (channelSlug -> nome).
function portalOptions(orders: OrderRow[]): PortalOption[] {
  const map = new Map<string, string>();
  for (const o of orders) map.set(o.channelSlug, o.portalName);
  return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function agentOptions(orders: OrderRow[]): string[] {
  const set = new Set<string>();
  for (const o of orders) if (o.agent) set.add(agentName(o.agent));
  return Array.from(set).sort();
}

// Ricerca su numero ordine, dati cliente (nome/email/telefono) e Stripe.
function matchesQuery(o: OrderRow, q: string): boolean {
  if (!q) return true;
  const hay = [
    o.number,
    o.customerName,
    o.companyName,
    o.userEmail,
    o.customerPhone,
    o.fiscalCode,
    o.vatNumber,
    o.sdiCode,
    o.pspReference,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export interface DayGroup {
  key: string;
  label: string;
  orders: OrderRow[];
}

// Raggruppa ordini (gia' ordinati desc) per giorno preservando l'ordine.
function groupByDay(orders: OrderRow[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const o of orders) {
    const key = dayKey(o.created);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.orders.push(o);
    else groups.push({ key, label: dayLabel(o.created), orders: [o] });
  }
  return groups;
}

export function OrdersView({ data, from, to }: OrdersViewProps) {
  const [portal, setPortal] = useState("all");
  const [agent, setAgent] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Override ottimistici per ordine (id -> override) dopo un'azione nel drawer.
  const [overrides, setOverrides] = useState<Record<string, OrderOverrides>>({});

  // Merge di un override parziale sull'ordine (helper per gli handler del drawer).
  const patch = (id: string, delta: OrderOverrides) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...delta } }));

  const orders = useMemo(
    () => data.orders.map((o) => applyOverrides(o, overrides[o.id] ?? {})),
    [data.orders, overrides],
  );

  const portals = useMemo(() => portalOptions(orders), [orders]);
  const agents = useMemo(() => agentOptions(orders), [orders]);

  const filtered = useMemo(
    () =>
      orders
        .filter(
          (o) =>
            (portal === "all" || o.channelSlug === portal) &&
            (agent === "all" || agentName(o.agent) === agent) &&
            matchesQuery(o, query),
        )
        .sort((a, b) => b.created.localeCompare(a.created)),
    [orders, portal, agent, query],
  );

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  const total = useMemo(
    () => filtered.reduce((sum, o) => sum + o.totalGross, 0),
    [filtered],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  // Conteggi per stato: annullato = workflow interno o evasione Saleor CANCELED;
  // da confermare = bozza Saleor (UNCONFIRMED/DRAFT); il resto e' confermato.
  const counts = useMemo(() => {
    let canceled = 0;
    let toConfirm = 0;
    for (const o of filtered) {
      if (o.workflowStatus === "annullato" || o.status === "CANCELED") canceled++;
      else if (o.status === "UNCONFIRMED" || o.status === "DRAFT") toConfirm++;
    }
    return {
      canceled,
      toConfirm,
      confirmed: filtered.length - canceled - toConfirm,
    };
  }, [filtered]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Ordini" value={String(filtered.length)} />
        <Kpi label="Totale" value={formatEur(total)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Confermati" value={String(counts.confirmed)} />
        <Kpi label="Da confermare" value={String(counts.toConfirm)} />
        <Kpi label="Annullati" value={String(counts.canceled)} />
      </div>

      <Input
        size="sm"
        placeholder="Cerca per n° ordine, cliente o transazione Stripe…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        iconLeft={<Search size={15} />}
      />

      <OrdersFilters
        from={from}
        to={to}
        portal={portal}
        agent={agent}
        portals={portals}
        agents={agents}
        onPortalChange={setPortal}
        onAgentChange={setAgent}
      />

      {filtered.length === 0 ? (
        <OrdersEmptyState variant="no-data" />
      ) : (
        <OrdersList groups={groups} onSelect={(o) => setSelectedId(o.id)} />
      )}

      <OrderDrawer
        order={selected}
        onClose={() => setSelectedId(null)}
        onStatusChange={(id, status) => patch(id, { workflow: status })}
        onTeacherCardAcquired={(id) => patch(id, { acquired: true })}
        onBankTransferPaid={(id) => patch(id, { paid: true })}
        onResidualPaid={(id) => patch(id, { residualPaid: true })}
        onNoteSaved={(id, note) => patch(id, { note })}
        onVatSaved={(id, vatOverride) => patch(id, { vatOverride })}
        onPaymentTotalSaved={(id, paymentAmountOverride) =>
          patch(id, { paymentAmountOverride })
        }
        onVatReliefValidated={(id, vatReliefStatus) => patch(id, { vatReliefStatus })}
      />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-medium tracking-tight">{value}</p>
    </Card>
  );
}
