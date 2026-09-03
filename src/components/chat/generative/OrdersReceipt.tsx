"use client";

import { type ReactElement } from "react";
import {
  ordersReceiptSchema,
  filterChips,
  type OrdersReceiptProps,
} from "@/components/orders/orders-filter";
import { formatEur } from "@/components/orders/format";
import { useOrdersPanel } from "@/components/orders/orders-panel-context";
import { useCloseMobileChat } from "@/components/shell/MobileChatOverlay";

// Ricevuta di quello che Nico ha fatto al pannello Ordini. In chat NON va mai
// la lista (400px di larghezza, log che scorre, bottoni distruttivi lontani
// dal loro contesto): la lista e' gia' a fianco, qui basta una riga.
export function OrdersReceipt(props: Record<string, unknown>): ReactElement | null {
  const apply = useOrdersPanel();
  const closeSheet = useCloseMobileChat();
  const parsed = ordersReceiptSchema.safeParse(props);
  if (!parsed.success) return null;
  const data = parsed.data;

  // Su mobile la chat copre il pannello: prima riapplica, poi si toglie di
  // mezzo, altrimenti si clicca e non si vede niente succedere.
  const onClick = apply
    ? (r: OrdersReceiptProps) => {
        apply(r);
        closeSheet?.();
      }
    : undefined;

  if (data.kind === "order") {
    const sub = [data.customer, data.portalName].filter(Boolean).join(" · ");
    return (
      <Receipt
        title={`Ordine #${data.number}`}
        sub={sub}
        amount={data.totalGross}
        onClick={onClick && (() => onClick(data))}
      />
    );
  }

  const chips = filterChips({ ...data.filter, source: "agent" });
  return (
    <Receipt
      title={`${data.count} ${data.count === 1 ? "ordine" : "ordini"}`}
      sub={chips.length ? chips.join(" · ") : "tutto il periodo"}
      amount={data.totalGross}
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
  amount: number;
  /** Presente solo dentro il pannello Ordini: la riga torna a essere un'azione. */
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
        {sub && (
          <p className="truncate text-xs text-[var(--color-ink-muted)]">{sub}</p>
        )}
      </div>
      <p className="shrink-0 text-sm tabular-nums">{formatEur(amount)}</p>
    </Tag>
  );
}
