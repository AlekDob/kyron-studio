"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { cn } from "@/lib/cn";
import { OrderLines } from "./OrderLines";
import { StatusBadges, PortalLink } from "./StatusBadges";
import { agentName, formatDate, formatEur } from "./format";

const HEADERS = [
  "N°",
  "Data",
  "Portale",
  "Agente",
  "Cod. mecc.",
  "Cliente",
  "Stato",
  "Totale",
];

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--color-paper-soft)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
            <th className="w-8" />
            {HEADERS.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <OrderTableRow key={o.number} order={o} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderTableRow({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer border-t border-[var(--color-line)] hover:bg-[var(--color-paper-soft)]"
      >
        <td className="pl-3 text-[var(--color-ink-muted)]">
          <ChevronRight
            size={15}
            className={cn("transition-transform", open && "rotate-90")}
          />
        </td>
        <td className="px-3 py-3 font-medium tabular-nums">#{order.number}</td>
        <td className="px-3 py-3 whitespace-nowrap">{formatDate(order.created)}</td>
        <td className="px-3 py-3">
          <PortalLink name={order.portalName} url={order.portalUrl} />
        </td>
        <td className="px-3 py-3">{agentName(order.agent)}</td>
        <td className="px-3 py-3 font-mono text-xs">
          {order.codiceMeccanografico || "—"}
        </td>
        <td className="px-3 py-3 text-[var(--color-ink-soft)]">
          {order.userEmail || "—"}
        </td>
        <td className="px-3 py-3">
          <StatusBadges order={order} />
        </td>
        <td className="px-3 py-3 text-right font-medium tabular-nums">
          {formatEur(order.totalGross)}
        </td>
      </tr>
      {open && (
        <tr className="border-t border-[var(--color-line)] bg-[var(--color-paper-soft)]">
          <td />
          <td colSpan={HEADERS.length} className="px-3 py-3">
            <OrderLines lines={order.lines} />
          </td>
        </tr>
      )}
    </>
  );
}
