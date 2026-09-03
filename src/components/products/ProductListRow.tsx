"use client";
import { ChevronRight } from "lucide-react";
import { Pill } from "@/components/ui";
import type { Product } from "@/lib/products";
import { ProductThumbnail } from "@/components/catalogo/ProductThumbnail";
import {
  listPriceLabel,
  portalLabel,
  productSales,
  type ChannelNames,
  type SalesIndex,
} from "@/components/catalogo/catalog-view";

// Riga prodotto cliccabile (apre la scheda). Anteprima, nome, dove si vende e
// quanto ha venduto. Il magazzino non e' qui di proposito: dice poco a chi
// guarda il catalogo, le vendite dicono tutto (richiesta FUT-82).
export function ProductListRow({
  product,
  onSelect,
  names,
  sales,
  priceChannel,
}: {
  product: Product;
  onSelect: (product: Product) => void;
  names: ChannelNames;
  sales: SalesIndex;
  /** Portale del filtro: il prezzo mostrato e' quello di quel portale. */
  priceChannel?: string | null;
}) {
  const sold = productSales(product, sales);
  const published = product.channels.length > 0;
  // Un solo portale: mostriamo il nome, non "1 portale".
  const where = !published
    ? "non pubblicato"
    : product.channels.length === 1
      ? portalLabel(names, product.channels[0])
      : `${product.channels.length} portali`;

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-paper-soft)]"
    >
      <ProductThumbnail src={product.imageUrl} className="h-10 w-10 rounded-xl" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{product.name}</p>
        <p className="mt-0.5 truncate text-sm text-[var(--color-ink-soft)]">
          {product.variants.length} variant{product.variants.length === 1 ? "e" : "i"}
          <span className="text-[var(--color-ink-muted)]"> · {where}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-medium tabular-nums">
          {listPriceLabel(product, priceChannel)}
        </span>
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          {!published && <Pill size="sm" variant="warning">Non pubblicato</Pill>}
          {sold > 0 ? (
            <Pill size="sm" variant="tertiary">
              {sold} vendut{sold === 1 ? "o" : "i"}
            </Pill>
          ) : (
            <span className="text-xs text-[var(--color-ink-muted)]">nessuna vendita</span>
          )}
        </span>
      </div>

      <ChevronRight size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
    </button>
  );
}
