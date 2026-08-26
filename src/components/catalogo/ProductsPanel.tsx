"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { ProductRow } from "./ProductRow";

// Il filtro e' client-side sulla lista gia' caricata: cercare a ogni tasto
// significherebbe una query admin Saleor per lettera.
export function ProductsPanel({
  products,
  selectedSlug,
  onSelect,
  fromAgent,
}: {
  products: Product[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  fromAgent: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.slug.includes(needle) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(needle)),
    );
  }, [products, q]);

  return (
    <>
      <header className="px-5 py-3 border-b border-[var(--color-line)]">
        <p className="eyebrow">Catalogo</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          {products.length} prodott{products.length !== 1 ? "i" : "o"}
          {fromAgent && " · selezione dell'agente"}
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca nome o codice"
          className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-ink)]"
        />
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1.5">
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--color-ink-muted)]">Nessun prodotto.</p>
        )}
        {filtered.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            selected={p.slug === selectedSlug}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}
