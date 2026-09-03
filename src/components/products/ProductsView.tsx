"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { SkeletonRows } from "@/components/ui";
import { useIsMobile } from "@/lib/use-is-mobile";
import { ProductsHeader } from "./ProductsHeader";
import { ProductsList } from "./ProductsList";
import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductDetail, ProductDrawer } from "./ProductDetail";
import { ImportWizard } from "@/components/catalogo/ImportWizard";
import { groupByCategory, type ProductsData, type ProductsFilter, type ProductTab } from "./products-filter";

interface Props {
  data: ProductsData;
  /** Filtro condiviso: lo muove l'umano dalla testata, lo scrive Teo dalla chat. */
  filter: ProductsFilter;
  onFilterChange: (patch: Partial<ProductsFilter>) => void;
  /** Nuova lista in arrivo dal server dopo un cambio filtro. */
  loading?: boolean;
  /** Prodotto aperto. Vive nel workspace: lo apre anche l'agente. */
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  tab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  onOpenPortal: (slug: string) => void;
  onChanged: () => void;
}

export function ProductsView({
  data,
  filter,
  onFilterChange,
  loading = false,
  selectedSlug,
  onSelectSlug,
  tab,
  onTabChange,
  onOpenPortal,
  onChanged,
}: Props) {
  const isMobile = useIsMobile();
  const [importOpen, setImportOpen] = useState(false);

  // Le righe arrivano gia' filtrate e ordinate dalla page: qui si raggruppa.
  const groups = useMemo(() => groupByCategory(data.products), [data.products]);
  const selected = useMemo(
    () => data.products.find((p) => p.slug === selectedSlug) ?? null,
    [data.products, selectedSlug],
  );

  const detail = {
    names: data.names,
    sales: data.sales,
    tab,
    onTabChange,
    onOpenPortal,
    onChanged,
  };

  // Desktop: la scheda prende tutta la colonna centrale al posto della lista.
  // La chat resta a destra, cosi' Teo vede il prodotto mentre e' aperto.
  if (selected && !isMobile) {
    return (
      <ProductDetail product={selected} onBack={() => onSelectSlug(null)} {...detail} />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Testata ferma: tile e filtri restano a vista mentre la lista scorre. */}
      <ProductsHeader
        buckets={data.buckets}
        filter={filter}
        onChange={onFilterChange}
        categories={data.categories}
        portals={data.portals}
        onImport={() => setImportOpen(true)}
        lastImport={data.lastImport}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        {loading ? (
          <SkeletonRows rows={8} rowClassName="h-[66px]" label="Carico i prodotti" />
        ) : data.products.length === 0 ? (
          <ProductsEmptyState variant="no-data" />
        ) : (
          <ProductsList
            groups={groups}
            onSelect={(p: Product) => onSelectSlug(p.slug)}
            names={data.names}
            sales={data.sales}
            priceChannel={filter.portal === "all" ? null : filter.portal}
          />
        )}
      </div>

      {/* Mobile: la stessa scheda dentro una bottom sheet. */}
      <ProductDrawer product={selected} onClose={() => onSelectSlug(null)} {...detail} />

      <ImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={onChanged}
        lastImport={data.lastImport}
      />
    </div>
  );
}
