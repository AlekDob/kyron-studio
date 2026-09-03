"use client";
import { Tag } from "lucide-react";
import type { Product } from "@/lib/products";
import { SectionIcon } from "@/components/orders/detail-section";
import { Slides } from "@/components/animate-ui/primitives/effects/slide";
import { ProductListRow } from "./ProductListRow";
import type { CategoryGroup } from "./products-filter";
import type { ChannelNames, SalesIndex } from "@/components/catalogo/catalog-view";

interface Props {
  groups: CategoryGroup[];
  onSelect: (product: Product) => void;
  names: ChannelNames;
  sales: SalesIndex;
  priceChannel?: string | null;
}

// Lista prodotti raggruppata per categoria. La categoria e' l'appiglio per
// orientarsi in un catalogo lungo: sta sopra le righe con la sua pastiglia.
export function ProductsList({ groups, onSelect, names, sales, priceChannel }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g, gi) => (
        <section key={g.key}>
          {/* Riga di stacco tra una categoria e l'altra: nella lista lunga i
              gruppi si toccherebbero e sembrerebbero un blocco solo. */}
          {gi > 0 && <div className="mb-5 h-px bg-[var(--color-line)]" />}
          <div className="mb-2 flex items-center gap-2 px-1">
            <SectionIcon icon={Tag} tone="amber" size={26} />
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              {g.label}
            </h2>
            <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
              {g.products.length} {g.products.length === 1 ? "prodotto" : "prodotti"}
            </span>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {/* Le righe entrano a scalare: quando Teo cambia il filtro si vede
                che la lista si e' rifatta, invece di cambiare di scatto.
                `asChild` per non infilare un div tra <ul> e <li>. */}
            <Slides asChild direction="up" offset={10} holdDelay={28}>
              {g.products.map((p) => (
                <li key={p.id}>
                  <ProductListRow
                    product={p}
                    onSelect={onSelect}
                    names={names}
                    sales={sales}
                    priceChannel={priceChannel}
                  />
                </li>
              ))}
            </Slides>
          </ul>
        </section>
      ))}
    </div>
  );
}
