"use client";
import {
  Ban,
  ChevronRight,
  PackageCheck,
  PackageOpen,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { Pill } from "@/components/ui";
import { SectionIcon, type Tone } from "./detail-section";
import {
  agentName,
  formatEur,
  formatTime,
  paymentBadge,
  paymentMethodLabel,
  workflowBadge,
} from "./format";

// L'icona della riga dice due cose insieme: la FORMA e' a che punto e' la
// lavorazione, il COLORE e' come sta il pagamento. Scorrendo la lista si vede
// dove serve intervenire senza leggere le pastiglie una per una.
const WORKFLOW_ICONS: Record<string, LucideIcon> = {
  nuovo: ShoppingBag,
  in_preparazione: PackageOpen,
  spedito: Truck,
  consegnato: PackageCheck,
  annullato: Ban,
};

function orderTone(order: OrderRow): Tone {
  if (order.workflowStatus === "annullato") return "slate";
  const { variant } = paymentBadge(order.paymentStatus);
  if (variant === "tertiary") return "emerald";
  if (variant === "warning") return "amber";
  if (variant === "critical") return "violet";
  return "slate";
}

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
      <SectionIcon
        icon={WORKFLOW_ICONS[order.workflowStatus] ?? ShoppingBag}
        tone={orderTone(order)}
        size={32}
      />

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
            {/* Metodo di pagamento accanto a scuola/agente: serve alla
                contabilizzazione senza aprire il singolo ordine. */}
            {paymentMethodLabel(order) && ` · ${paymentMethodLabel(order)}`}
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
