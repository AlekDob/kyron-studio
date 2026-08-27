"use client";
import { Badge } from "@/components/ui";
import type { Product } from "@/lib/products";
import { ProductThumbnail } from "./ProductThumbnail";
import {
  listPriceLabel,
  portalLabel,
  productSales,
  type ChannelNames,
  type SalesIndex,
} from "./catalog-view";

// Riga di catalogo: anteprima, nome, quanti portali lo vendono e quanto ha
// venduto. Il magazzino non e' qui di proposito: dice poco a chi guarda il
// catalogo, le vendite dicono tutto (richiesta FUT-82).
export function ProductRow({
  product,
  selected,
  onSelect,
  names,
  sales,
  index,
}: {
  product: Product;
  selected: boolean;
  onSelect: (slug: string) => void;
  names: ChannelNames;
  sales: SalesIndex;
  index: number;
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
      onClick={() => onSelect(product.slug)}
      // Stagger solo sulle prime righe: oltre e' attesa inutile.
      className={`studio-row-in group flex w-full items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.995] ${
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)]"
          : "border-transparent hover:border-[var(--studio-glass-line)] hover:bg-[var(--studio-glass-surface)]"
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }}
    >
      <ProductThumbnail src={product.imageUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-medium text-[var(--color-ink)]">
            {product.name}
          </span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--color-ink)]">
            {listPriceLabel(product)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Badge tone={published ? "muted" : "critical"}>{where}</Badge>
          {sold > 0 ? (
            <Badge tone="accent">{sold} vendut{sold === 1 ? "o" : "i"}</Badge>
          ) : (
            <span className="text-[11px] text-[var(--color-ink-muted)]">
              nessuna vendita
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
