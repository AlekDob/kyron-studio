// Tipi e lettura del catalogo Saleor per il modulo Catalogo. Rispecchiano
// quello che studio-server espone su /api/v1/products: unica fonte, cosi' il
// pannello e il drawer non ridefiniscono la forma dei dati.
import { gatewayFetch } from "./gateway";

export interface VariantChannelPrice {
  channelSlug: string;
  priceEur: number | null;
  published: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  stock: number;
  attributes: Array<{ name: string; value: string }>;
  /** Foto legate alla variante (il colore giusto), non a tutto il prodotto. */
  images: string[];
  channels: VariantChannelPrice[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  productType: string;
  description: string;
  imageUrl: string | null;
  /** Gallery completa dal media Saleor. Vuota se il prodotto non ha foto. */
  images: string[];
  channels: string[];
  variants: ProductVariant[];
}

export async function listProducts(search?: string): Promise<Product[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const body = await gatewayFetch<{ products: Product[] }>(`/api/v1/products${qs}`);
  return body.products;
}

// Contorno del catalogo: nomi leggibili dei portali (lo slug non dice a nessuno
// di che scuola si tratta) e vendite per SKU, totali e per portale.
export interface SkuSales {
  total: number;
  byChannel: Record<string, number>;
}

export interface CatalogInsights {
  channels: Array<{ slug: string; name: string }>;
  sales: { updatedAt: string; orderCount: number; bySku: Record<string, SkuSales> };
}

export async function listCatalogInsights(): Promise<CatalogInsights> {
  return gatewayFetch<CatalogInsights>("/api/v1/products/insights");
}

// Sconto per portale di un prodotto (promotion CATALOGUE Saleor). Il channel
// listing mostra sempre il listino: qui c'e' quanto si paga davvero.
export interface PortalDiscount {
  channelSlug: string;
  fromEur: number | null;
  fromListEur: number | null;
  maxDiscountEur: number;
  onSale: number;
  listed: number;
}

// Storico degli import del listino Danea (collection Payload `danea-imports`).
// Lo legge la pagina lato server: il dato cambia solo quando qualcuno importa,
// e dopo un import il workspace fa gia' `router.refresh()`.
export type DaneaImportStatus = "new" | "changed" | "unchanged";

export interface DaneaImportRow {
  sku: string;
  name: string;
  priceEur: number | null;
  currentPriceEur: number | null;
  productSlug: string;
  status: DaneaImportStatus;
}

export interface DaneaImportLog {
  importId: string;
  filename: string;
  uploadedAt: string;
  appliedAt?: string | null;
  channelSlug?: string;
  target?: string;
  recordCount?: number;
  totals?: { newProducts: number; newVariants: number; priceChanges: number; unchanged: number };
  rows?: DaneaImportRow[];
  applied?: {
    createdProducts: string[];
    createdVariants: Array<{ sku: string; priceEur: number }>;
    skipped: Array<{ aggregator: string; reason: string }>;
  };
}

/** L'ultimo listino Danea caricato, o `null` se non ne risulta nessuno. */
export async function lastDaneaImport(): Promise<DaneaImportLog | null> {
  const body = await gatewayFetch<{ imports: DaneaImportLog[] }>(
    "/api/v1/products/import/history?limit=1",
  );
  return body.imports[0] ?? null;
}
