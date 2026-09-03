"use client";

import { type ReactElement } from "react";
import {
  customersReceiptSchema,
  filterChips,
  type CustomersReceiptProps,
} from "@/components/customers/customers-filter";
import { formatEur } from "@/components/orders/format";
import { useCustomersPanel } from "@/components/customers/customers-panel-context";
import { useCloseMobileChat } from "@/components/shell/MobileChatOverlay";

// Ricevuta di quello che Bea ha fatto al pannello Clienti. In chat NON va mai
// la lista: e' gia' a fianco, qui basta una riga su cui tornare.
export function CustomersReceipt(props: Record<string, unknown>): ReactElement | null {
  const apply = useCustomersPanel();
  const closeSheet = useCloseMobileChat();
  const parsed = customersReceiptSchema.safeParse(props);
  if (!parsed.success) return null;
  const data = parsed.data;

  // Su mobile la chat copre il pannello: prima riapplica, poi si toglie di mezzo.
  const onClick = apply
    ? (r: CustomersReceiptProps) => {
        apply(r);
        closeSheet?.();
      }
    : undefined;

  if (data.kind === "customer") {
    return (
      <Receipt
        title={data.name || data.email}
        sub={data.name ? data.email : "scheda cliente"}
        onClick={onClick && (() => onClick(data))}
      />
    );
  }

  const chips = filterChips({ ...data.filter, source: "agent" });
  return (
    <Receipt
      title={`${data.count} ${data.count === 1 ? "cliente" : "clienti"}`}
      sub={chips.length ? chips.join(" · ") : "tutto il periodo"}
      amount={data.totalSpent}
      onClick={onClick && (() => onClick(data))}
    />
  );
}

function Receipt({
  title,
  sub,
  amount,
  onClick,
}: {
  title: string;
  sub: string;
  /** Assente sulla scheda cliente: li' il numero non aggiunge niente. */
  amount?: number;
  onClick?: () => void;
}): ReactElement {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-baseline justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-left${
        onClick ? " transition-colors hover:border-[var(--color-line-strong)]" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {sub && <p className="truncate text-xs text-[var(--color-ink-muted)]">{sub}</p>}
      </div>
      {amount !== undefined && (
        <p className="shrink-0 text-sm tabular-nums">{formatEur(amount)}</p>
      )}
    </Tag>
  );
}
