"use client";
import { useMemo, useState } from "react";
import type { OrdersResponse, OrderRow } from "@/lib/gateway";
import { Card } from "@/components/ui";
import { OrdersFilters, type PortalOption } from "./OrdersFilters";
import { OrdersTable } from "./OrdersTable";
import { OrderCard } from "./OrderCard";
import { OrdersEmptyState } from "./OrdersEmptyState";
import { agentName, formatEur } from "./format";

interface OrdersViewProps {
  data: OrdersResponse;
  from: string;
  to: string;
}

// Opzioni portale uniche dal payload del periodo (channelSlug -> nome).
function portalOptions(orders: OrderRow[]): PortalOption[] {
  const map = new Map<string, string>();
  for (const o of orders) map.set(o.channelSlug, o.portalName);
  return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

// Agenti unici (local-part) presenti negli ordini del periodo.
function agentOptions(orders: OrderRow[]): string[] {
  const set = new Set<string>();
  for (const o of orders) if (o.agent) set.add(agentName(o.agent));
  return Array.from(set).sort();
}

export function OrdersView({ data, from, to }: OrdersViewProps) {
  const [portal, setPortal] = useState("all");
  const [agent, setAgent] = useState("all");

  const portals = useMemo(() => portalOptions(data.orders), [data.orders]);
  const agents = useMemo(() => agentOptions(data.orders), [data.orders]);

  const filtered = useMemo(
    () =>
      data.orders.filter(
        (o) =>
          (portal === "all" || o.channelSlug === portal) &&
          (agent === "all" || agentName(o.agent) === agent),
      ),
    [data.orders, portal, agent],
  );

  const total = useMemo(
    () => filtered.reduce((sum, o) => sum + o.totalGross, 0),
    [filtered],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Ordini" value={String(filtered.length)} />
        <Kpi label="Totale" value={formatEur(total)} />
      </div>

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
        <>
          <div className="hidden lg:block">
            <OrdersTable orders={filtered} />
          </div>
          <div className="flex flex-col gap-3 lg:hidden">
            {filtered.map((o) => (
              <OrderCard key={o.number} order={o} />
            ))}
          </div>
        </>
      )}
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
