"use client";
import { useEffect, useState } from "react";
import type { CatalogInsights, Product } from "@/lib/products";
import { type SalesIndex } from "./catalog-view";

// Catalogo + insights per chi NON li ha in pagina (il modulo portali): nomi
// veri, prezzi per canale e vendite. Una sola fetch per sessione — la Promise
// sta a livello di modulo, cosi' aprire dieci portali non rilegge dieci volte
// gli stessi 400 prodotti. Il modulo Catalogo non usa questo hook: ha i dati SSR.
let cache: Promise<{ products: Product[]; insights: CatalogInsights | null }> | null = null;

async function json<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

function load() {
  cache ??= Promise.all([
    json<{ products: Product[] }>("/api/products", { products: [] }),
    json<CatalogInsights | null>("/api/products/insights", null),
  ]).then(([p, insights]) => ({ products: p.products ?? [], insights }));
  return cache;
}

export interface CatalogIndex {
  /** prodotto per slug: le sezioni portale hanno solo gli slug */
  bySlug: Map<string, Product>;
  sales: SalesIndex;
  loading: boolean;
}

export function useCatalogIndex(): CatalogIndex {
  const [data, setData] = useState<{ bySlug: Map<string, Product>; sales: SalesIndex } | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    void load().then(({ products, insights }) => {
      if (!alive) return;
      setData({
        bySlug: new Map(products.map((p) => [p.slug, p])),
        sales: insights?.sales.bySku ?? {},
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  return { bySlug: data?.bySlug ?? new Map(), sales: data?.sales ?? {}, loading: !data };
}
