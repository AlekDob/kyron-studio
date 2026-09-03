"use client";
// Testata del pannello Prodotti: tile (cliccabili, sono il filtro stato) e la
// frase con i chip che tiene tutti gli altri filtri. Resta ferma mentre la
// lista scorre. Ogni tocco qui e' umano, quindi riporta sempre `source` a
// "browse": il pannello torna in mano all'operatore.
import { ProductsSentence } from "./ProductsSentence";
import { ProductsTiles } from "./ProductsTiles";
import type { ProductsData, ProductsFilter, ProductStatus } from "./products-filter";

interface Props {
  buckets: ProductsData["buckets"];
  filter: ProductsFilter;
  onChange: (patch: Partial<ProductsFilter>) => void;
  categories: string[];
  portals: ProductsData["portals"];
  onImport: () => void;
  lastImport: ProductsData["lastImport"];
}

export function ProductsHeader({
  buckets,
  filter,
  onChange,
  categories,
  portals,
  onImport,
  lastImport,
}: Props) {
  const setStatus = (status: ProductStatus) => onChange({ status, source: "browse" });

  return (
    <div className="flex shrink-0 flex-col gap-5 px-5 pb-4 pt-5">
      <ProductsTiles buckets={buckets} status={filter.status} onStatus={setStatus} />

      {/* Aria sopra la frase: incollata alle tile sembrava la loro didascalia. */}
      <div className="pt-2">
        <ProductsSentence
          filter={filter}
          categories={categories}
          portals={portals}
          onChange={onChange}
          onImport={onImport}
          lastImport={lastImport}
        />
      </div>

      {/* Stacca i filtri dalla lista: sopra si filtra, sotto si legge. */}
      <div className="h-px bg-[var(--color-line)]" />
    </div>
  );
}
