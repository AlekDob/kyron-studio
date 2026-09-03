"use client";
import { ChevronRight, Repeat, UserPlus, User } from "lucide-react";
import { Pill } from "@/components/ui";
import { SectionIcon, type Tone } from "@/components/orders/detail-section";
import { agentName, formatDate, formatEur } from "@/components/orders/format";
import type { CustomerRow } from "@/lib/customers";

// L'icona dice subito che tipo di cliente e': nuovo (primo ordine recente),
// ricorrente (piu' di un ordine), o cliente normale.
function look(c: CustomerRow): { icon: typeof User; tone: Tone } {
  if (c.isReturning) return { icon: Repeat, tone: "emerald" };
  if (c.isNew) return { icon: UserPlus, tone: "amber" };
  return { icon: User, tone: "indigo" };
}

export function CustomerListRow({
  customer,
  onSelect,
}: {
  customer: CustomerRow;
  onSelect: (customer: CustomerRow) => void;
}) {
  const { icon, tone } = look(customer);
  const portals = customer.portals.map((p) => p.name).join(", ");

  return (
    <button
      type="button"
      onClick={() => onSelect(customer)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-paper-soft)]"
    >
      <SectionIcon icon={icon} tone={tone} size={32} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate font-medium">{customer.name || customer.email}</span>
          <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
            {customer.orders} {customer.orders === 1 ? "ordine" : "ordini"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-[var(--color-ink-soft)]">
          {customer.email}
          {portals && <span className="text-[var(--color-ink-muted)]"> · {portals}</span>}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-medium tabular-nums">{formatEur(customer.totalSpent)}</span>
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          {customer.isNew && <Pill size="sm" variant="warning">Nuovo</Pill>}
          {customer.isReturning && <Pill size="sm" variant="tertiary">Ricorrente</Pill>}
          <span className="text-xs text-[var(--color-ink-muted)]">
            ultimo {formatDate(customer.lastOrder)}
          </span>
        </span>
      </div>

      <ChevronRight size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
    </button>
  );
}

/** Agenti del cliente in chiaro, per la scheda. */
export function agentsLabel(customer: CustomerRow): string {
  return customer.agents.map(agentName).join(", ") || "—";
}
