"use client";

import { type ReactElement } from "react";
import {
  filterChips,
  productsReceiptSchema,
  type ProductsReceiptProps,
} from "@/components/products/products-filter";
import { useProductsPanel } from "@/components/products/products-panel-context";
import { useCloseMobileChat } from "@/components/shell/MobileChatOverlay";

// Ricevuta di quello che Teo ha fatto al pannello Prodotti. In chat NON va mai
// la lista (420px di larghezza, log che scorre): la lista e' gia' a fianco, qui
// basta una riga. Niente conteggio: il pannello cerca in fuzzy e il tool per
// sottostringa, un numero da qui smentirebbe le righe a schermo.
export function ProductsReceipt(props: Record<string, unknown>): ReactElement | null {
  const apply = useProductsPanel();
  const closeSheet = useCloseMobileChat();
  const parsed = productsReceiptSchema.safeParse(props);
  if (!parsed.success) return null;
  const data = parsed.data;

  // Su mobile la chat copre il pannello: prima riapplica, poi si toglie di
  // mezzo, altrimenti si clicca e non si vede niente succedere.
  const onClick = apply
    ? () => {
        apply(data);
        closeSheet?.();
      }
    : undefined;

  if (data.kind === "product") {
    return (
      <Receipt
        title={data.name || data.slug}
        sub={[data.category, data.priceLabel].filter(Boolean).join(" · ")}
        onClick={onClick}
      />
    );
  }

  const chips = filterChips({ ...data.filter, source: "agent" });
  return (
    <Receipt
      title="Lista prodotti aggiornata"
      sub={chips.length ? chips.join(" · ") : "tutto il catalogo"}
      onClick={onClick}
    />
  );
}

function Receipt({
  title,
  sub,
  onClick,
}: {
  title: string;
  sub: string;
  /** Presente solo dentro il pannello Prodotti: la riga torna a essere un'azione. */
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
    </Tag>
  );
}
