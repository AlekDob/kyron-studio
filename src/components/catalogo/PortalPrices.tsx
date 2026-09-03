"use client";
import { useMemo, useState } from "react";
import { School, Search, TrendingDown } from "lucide-react";
import { fuzzyFilter } from "@/lib/fuzzy";
import type { PortalDiscount, Product } from "@/lib/products";
import { Pill } from "@/components/ui";
import { SectionIcon } from "@/components/orders/detail-section";
import {
  eur,
  portalRows,
  variantPricesOn,
  type ChannelNames,
  type SalesIndex,
} from "./catalog-view";
import { VariantPricesPopover } from "./VariantPricesPopover";

// Dove il prodotto e' pubblicato: lista ordinata (piu' venduto sopra) con nome
// della scuola, prezzo su quel portale e pezzi venduti. Prima era una riga di
// slug separati da virgola: illeggibile appena il prodotto sta su 20 portali.
const SEARCHABLE_FROM = 6;

export function PortalPrices({
  product,
  names,
  sales,
  onOpenPortal,
  discounts,
}: {
  product: Product;
  names: ChannelNames;
  sales: SalesIndex;
  /** apre il drawer del portale sopra questo */
  onOpenPortal?: (slug: string) => void;
  /** Sconto vero per portale, per slug. Il prezzo qui accanto e' il listino. */
  discounts?: Record<string, PortalDiscount>;
}) {
  const [q, setQ] = useState("");
  const all = useMemo(() => portalRows(product, names, sales), [product, names, sales]);
  const rows = useMemo(() => fuzzyFilter(all, q, (r) => r.name), [all, q]);

  if (all.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Non pubblicato su nessun portale.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {all.length >= SEARCHABLE_FROM && (
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Cerca tra ${all.length} portali`}
            className="w-full rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-paper-muted)] pl-9 pr-3 py-2 text-sm text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-ink)] focus:bg-[var(--color-paper)]"
          />
        </div>
      )}
      <ul className="flex flex-col gap-0.5">
        {rows.map((r, i) => (
          <li
            key={r.slug}
            className="studio-row-in flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--studio-glass-surface)]"
            style={{ animationDelay: `${Math.min(i, 8) * 20}ms` }}
          >
            <SectionIcon icon={School} tone="amber" size={26} />
            {onOpenPortal ? (
              <button
                type="button"
                onClick={() => onOpenPortal(r.slug)}
                className="min-w-0 flex-1 truncate text-left text-[var(--color-ink)] underline-offset-2 hover:underline"
              >
                {r.name}
              </button>
            ) : (
              <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{r.name}</span>
            )}
            <span className="shrink-0 text-right tabular-nums">
              {r.priceFrom ? (
                <VariantPricesPopover
                  label={`da ${eur(r.priceEur)}`}
                  rows={variantPricesOn(product, r.slug)}
                />
              ) : (
                <span className="font-medium">{eur(r.priceEur)}</span>
              )}
              <span className="ml-2 text-xs text-[var(--color-ink-muted)]">
                {r.sales > 0 ? `${r.sales} vend.` : "—"}
              </span>
            </span>
            <Discount row={discounts?.[r.slug]} />
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-2 text-xs text-[var(--color-ink-muted)]">
            Nessun portale per “{q}”.
          </li>
        )}
      </ul>
    </div>
  );
}

// Lo sconto del portale, se c'e'. Il prezzo a sinistra e' sempre il listino:
// senza questa pastiglia la riga dice 509 su un portale dove si paga 469.
function Discount({ row }: { row?: PortalDiscount }) {
  if (!row || row.maxDiscountEur <= 0) {
    return <span className="w-24 shrink-0 text-right text-xs text-[var(--color-ink-muted)]">a listino</span>;
  }
  return (
    <span className="flex w-24 shrink-0 justify-end">
      <Pill size="sm" variant="warning" className="gap-1">
        <TrendingDown size={12} /> -{eur(row.maxDiscountEur)}
      </Pill>
    </span>
  );
}
