"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { fuzzyFilter } from "@/lib/fuzzy";
import type { Product } from "@/lib/products";
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
}: {
  product: Product;
  names: ChannelNames;
  sales: SalesIndex;
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
    <div className="flex flex-col gap-2">
      {all.length >= SEARCHABLE_FROM && (
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-muted)]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Cerca tra ${all.length} portali`}
            className="w-full rounded-lg border border-[var(--studio-glass-line)] bg-[var(--studio-glass-surface-strong)] pl-8 pr-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-ink)]"
          />
        </div>
      )}
      <ul className="flex flex-col gap-0.5">
        {rows.map((r, i) => (
          <li
            key={r.slug}
            className="studio-row-in flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--studio-glass-surface)]"
            style={{ animationDelay: `${Math.min(i, 8) * 20}ms` }}
          >
            <span className="min-w-0 truncate text-[var(--color-ink)]">{r.name}</span>
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
