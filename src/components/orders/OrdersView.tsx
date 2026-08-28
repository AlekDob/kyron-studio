"use client";
import { useMemo, useState } from "react";
import type { OrdersResponse, OrderRow } from "@/lib/gateway";
import { OrdersHeader } from "./OrdersHeader";
import { OrdersList } from "./OrdersList";
import { OrderDrawer } from "./OrderDrawer";
import { OrderDetail, type OrderDetailHandlers, type OrderTab } from "./OrderDetail";
import { OrdersEmptyState } from "./OrdersEmptyState";
import { dayKey, dayLabel } from "./format";
import { agentNameOf } from "@/components/shell/modules";
import { useIsMobile } from "@/lib/use-is-mobile";
import { emptyFilter, type OrdersFilter } from "./orders-filter";

interface OrdersViewProps {
  data: OrdersResponse;
  /** Filtro condiviso: lo muove l'umano dalla testata, lo scrive Nico dalla chat. */
  filter: OrdersFilter;
  onFilterChange: (patch: Partial<OrdersFilter>) => void;
  /** Ordine aperto nel drawer. Vive nel workspace: lo apre anche l'agente. */
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  /** Tab della scheda: sta nel workspace perche' lo cambia anche l'agente. */
  tab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
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

export function OrdersView({
  data,
  filter,
  onFilterChange,
  selectedId,
  onSelectId,
  tab,
  onTabChange,
}: OrdersViewProps) {
  // Override ottimistici per ordine (id -> override) dopo un'azione nel drawer.
  const [overrides, setOverrides] = useState<Record<string, OrderOverrides>>({});
  const isMobile = useIsMobile();

  // Merge di un override parziale sull'ordine (helper per gli handler del drawer).
  const patch = (id: string, delta: OrderOverrides) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...delta } }));

  // Le righe arrivano gia' filtrate dal server: qui si applicano solo gli
  // override ottimistici e l'ordinamento per data.
  const orders = useMemo(
    () =>
      data.orders
        .map((o) => applyOverrides(o, overrides[o.id] ?? {}))
        .sort((a, b) => b.created.localeCompare(a.created)),
    [data.orders, overrides],
  );

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  const groups = useMemo(() => groupByDay(orders), [orders]);

  // Gli otto handler ottimistici sono gli stessi per la scheda al centro e per
  // la bottom sheet: un oggetto solo, niente elenco ripetuto due volte.
  const handlers: OrderDetailHandlers = {
    onStatusChange: (id, status) => patch(id, { workflow: status }),
    onTeacherCardAcquired: (id) => patch(id, { acquired: true }),
    onBankTransferPaid: (id) => patch(id, { paid: true }),
    onResidualPaid: (id) => patch(id, { residualPaid: true }),
    onNoteSaved: (id, note) => patch(id, { note }),
    onVatSaved: (id, vatOverride) => patch(id, { vatOverride }),
    onPaymentTotalSaved: (id, paymentAmountOverride) =>
      patch(id, { paymentAmountOverride }),
    onVatReliefValidated: (id, vatReliefStatus) => patch(id, { vatReliefStatus }),
  };

  // Desktop: la scheda prende tutta la colonna centrale al posto della lista.
  // La chat resta a destra, cosi' l'agente vede l'ordine mentre e' aperto.
  if (selected && !isMobile) {
    return (
      <OrderDetail
        order={selected}
        onBack={() => onSelectId(null)}
        tab={tab}
        onTabChange={onTabChange}
        {...handlers}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Testata ferma: KPI, ricerca e filtri restano a vista mentre la lista scorre. */}
      <OrdersHeader
        buckets={data.buckets}
        filter={filter}
        onChange={onFilterChange}
        portals={data.portals}
        agents={data.agents}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        {/* Il pannello e' in mano all'agente: si vede da dove arriva la lista
            e si torna a tutti gli ordini con un click. */}
        {filter.source === "agent" && (
          <button
            type="button"
            onClick={() => onFilterChange(emptyFilter(filter.from, filter.to))}
            className="mb-3 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            Filtrato da {agentNameOf("orders")} · mostra tutto
          </button>
        )}
        {orders.length === 0 ? (
          <OrdersEmptyState variant="no-data" />
        ) : (
          <OrdersList groups={groups} onSelect={(o) => onSelectId(o.id)} />
        )}
      </div>

      {/* Mobile: la stessa scheda dentro una bottom sheet. */}
      <OrderDrawer
        order={selected}
        onClose={() => onSelectId(null)}
        tab={tab}
        onTabChange={onTabChange}
        {...handlers}
      />

    </div>
  );
}
