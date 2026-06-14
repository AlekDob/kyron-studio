"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui";
import { OrderLines } from "./OrderLines";
import { StatusBadges, PortalLink } from "./StatusBadges";
import { agentName, formatDate, formatEur } from "./format";

// Vista ordine mobile (lg:hidden). Tap sull'header espande le righe prodotto.
export function OrderCard({ order }: { order: OrderRow }) {
  const [open, setOpen] = useState(false);
  return (
    <Card padding="none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 px-4 py-3 text-left"
      >
        <ChevronRight
          size={16}
          className={cn(
            "mt-0.5 shrink-0 text-[var(--color-ink-muted)] transition-transform",
            open && "rotate-90",
          )}
        />
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium tabular-nums">#{order.number}</span>
            <span className="font-medium tabular-nums">
              {formatEur(order.totalGross)}
            </span>
          </div>
          <p className="mt-0.5 text-sm">
            <PortalLink name={order.portalName} url={order.portalUrl} />
          </p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            {formatDate(order.created)} · {agentName(order.agent)}
            {order.codiceMeccanografico ? ` · ${order.codiceMeccanografico}` : ""}
          </p>
          <div className="mt-2">
            <StatusBadges order={order} />
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-[var(--color-line)] px-4 py-3">
          {order.userEmail && (
            <p className="mb-2 text-xs text-[var(--color-ink-muted)]">
              {order.userEmail}
            </p>
          )}
          <OrderLines lines={order.lines} />
        </div>
      )}
    </Card>
  );
}
