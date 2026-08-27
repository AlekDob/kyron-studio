"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SkeletonRows } from "@/components/ui";
import type { Product } from "@/lib/products";
import { ProductRow } from "./ProductRow";
import { catalogRows, type ChannelNames, type SalesIndex } from "./catalog-view";

// Il filtro e' client-side sulla lista gia' caricata: cercare a ogni tasto
// significherebbe una query admin Saleor per lettera. Match fuzzy (lib/fuzzy):
// "mcbk air" trova "MacBook Air".
export function ProductsPanel({
  products,
  selectedSlug,
  onSelect,
  fromAgent,
  loading,
  names,
  sales,
  salesUpdatedAt,
}: {
  products: Product[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  fromAgent: boolean;
  loading: boolean;
  names: ChannelNames;
  sales: SalesIndex;
  salesUpdatedAt: string;
}) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => catalogRows(products, sales, q), [products, sales, q]);

  return (
    <>
      <header className="px-5 py-3 border-b border-[var(--studio-glass-line)]">
        <p className="eyebrow">Catalogo</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          {products.length} prodott{products.length !== 1 ? "i" : "o"}
          {fromAgent && " · selezione dell'agente"}
          {salesUpdatedAt &&
            ` · vendite alle ${new Date(salesUpdatedAt).toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })}`}
        </p>
        <div className="relative mt-2">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-muted)]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca nome, codice o categoria"
            className="w-full rounded-lg border border-[var(--studio-glass-line)] bg-[var(--studio-glass-surface-strong)] pl-8 pr-2.5 py-1.5 text-xs outline-none transition-colors focus:border-[var(--color-ink)]"
          />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        {loading ? (
          <SkeletonRows rows={7} rowClassName="h-[60px]" label="Carico il catalogo" />
        ) : rows.length === 0 ? (
          <p className="px-2 text-xs text-[var(--color-ink-muted)]">
            {q ? `Nessun prodotto per “${q}”.` : "Nessun prodotto."}
          </p>
        ) : (
          rows.map((p, i) => (
            <ProductRow
              key={p.id}
              product={p}
              selected={p.slug === selectedSlug}
              onSelect={onSelect}
              names={names}
              sales={sales}
              index={i}
            />
          ))
        )}
      </div>
    </>
  );
}
