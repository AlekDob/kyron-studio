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
  // Override ottimistici dello stato lavorazione (id -> status) dopo un cambio.
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  // Override ottimistico "carta del docente acquisita" (id -> true).
  const [acquired, setAcquired] = useState<Record<string, boolean>>({});
  // Override ottimistico "bonifico pagato" (id -> true): flippa anche paymentStatus.
  const [paid, setPaid] = useState<Record<string, boolean>>({});

  const orders = useMemo(
    () =>
      data.orders.map((o) => {
        let next = o;
        if (overrides[o.id]) next = { ...next, workflowStatus: overrides[o.id] };
        if (acquired[o.id]) {
          next = { ...next, teacherCardAcquired: true };
          // Se il buono copre l'intero ordine, l'acquisizione lo salda
          // (markOrderAsPaid lato server): flippa subito il badge a "Pagato".
          if (teacherCardCoversTotal(o))
            next = { ...next, paymentStatus: "FULLY_CHARGED" };
        }
        if (paid[o.id])
          next = { ...next, bankTransferPaid: true, paymentStatus: "FULLY_CHARGED" };
        return next;
      }),
    [data.orders, overrides, acquired, paid],
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

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Ordini" value={String(filtered.length)} />
        <Kpi label="Totale" value={formatEur(total)} />
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
        onStatusChange={(id, status) =>
          setOverrides((prev) => ({ ...prev, [id]: status }))
        }
        onTeacherCardAcquired={(id) =>
          setAcquired((prev) => ({ ...prev, [id]: true }))
        }
        onBankTransferPaid={(id) =>
          setPaid((prev) => ({ ...prev, [id]: true }))
        }
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
