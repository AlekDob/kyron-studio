"use client";
import { ChevronRight } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { Pill } from "@/components/ui";
import { agentName, formatEur, formatTime, paymentBadge, workflowBadge } from "./format";

interface OrderListRowProps {
  order: OrderRow;
  onSelect: (order: OrderRow) => void;
}

// Riga ordine cliccabile (apre il drawer). Layout responsive: su mobile le info
// si impilano, su desktop si distribuiscono in orizzontale.
export function OrderListRow({ order, onSelect }: OrderListRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-paper-soft)]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-medium tabular-nums">#{order.number}</span>
          <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
            {formatTime(order.created)}
          </span>
          <span className="min-w-0 truncate text-sm text-[var(--color-ink-soft)]">
            · {order.portalName}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm">
          {order.customerName || order.userEmail || "—"}
          <span className="text-[var(--color-ink-muted)]">
            {" "}· {agentName(order.agent)}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-medium tabular-nums">
          {formatEur(order.totalGross)}
        </span>
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          <Pill size="sm" variant={workflowBadge(order.workflowStatus).variant}>
            {workflowBadge(order.workflowStatus).label}
          </Pill>
          <Pill size="sm" variant={paymentBadge(order.paymentStatus).variant}>
            {paymentBadge(order.paymentStatus).label}
          </Pill>
          {order.paymentMethod === "teacher-card" && (
            <Pill size="sm" variant={order.teacherCardAcquired ? "tertiary" : "warning"}>
              {order.teacherCardAcquired
                ? "Carta docente acquisita"
                : "Carta docente da riscuotere"}
            </Pill>
          )}
        </span>
      </div>

      <ChevronRight
        size={16}
        className="shrink-0 text-[var(--color-ink-muted)]"
      />
    </button>
  );
}
