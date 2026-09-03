"use client";
import { Layers } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/products";
import { Section } from "@/components/orders/detail-section";
import {
  eur,
  portalLabel,
  type ChannelNames,
  type SalesIndex,
} from "@/components/catalogo/catalog-view";
import { VariantPricesPopover } from "@/components/catalogo/VariantPricesPopover";
import { ProductThumbnail } from "@/components/catalogo/ProductThumbnail";

// Le varianti del prodotto: SKU (= Code Danea), giacenza, prezzo per portale e
// le sue foto. La foto qui conta: su un iPad Rosa 256GB la gallery del prodotto
// ne ha 60, ma solo queste sono del colore giusto.
export function ProductVariants({
  product,
  names,
  sales,
}: {
  product: Product;
  names: ChannelNames;
  sales: SalesIndex;
}) {
  return (
    <Section title={`Varianti (${product.variants.length})`} icon={Layers} tone="violet">
      <ul className="flex flex-col divide-y divide-[var(--color-line)]">
        {product.variants.map((v) => {
          const priced = v.channels.filter((c) => c.priceEur !== null);
          const sold = sales[v.sku]?.total ?? 0;
          return (
            <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <VariantPhotos variant={v} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{v.name || v.sku}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {v.sku} · giacenza {v.stock}
                  {sold > 0 && ` · ${sold} vendut${sold === 1 ? "o" : "i"}`}
                </p>
              </div>
              <div className="shrink-0 text-right tabular-nums">
                {priced.length === 0 ? (
                  <span className="text-xs text-[var(--color-ink-muted)]">senza prezzo</span>
                ) : (
                  <VariantPricesPopover
                    label={eur(Math.min(...priced.map((c) => c.priceEur ?? 0)))}
                    rows={priced.map((c) => ({
                      label: portalLabel(names, c.channelSlug),
                      priceEur: c.priceEur ?? 0,
                    }))}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

// Le prime foto della variante. Piu' di tre e la riga diventa una striscia
// illeggibile: il resto sta nella gallery del prodotto, in Informazioni.
function VariantPhotos({ variant }: { variant: ProductVariant }) {
  if (variant.images.length === 0) return null;
  return (
    <span className="flex shrink-0 gap-1">
      {variant.images.slice(0, 3).map((url) => (
        <ProductThumbnail key={url} src={url} className="h-8 w-8 rounded-md" />
      ))}
    </span>
  );
}
