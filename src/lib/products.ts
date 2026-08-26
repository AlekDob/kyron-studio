// Tipi e lettura del catalogo Saleor per il modulo Commesso. Rispecchiano
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
  channels: string[];
  variants: ProductVariant[];
}

export async function listProducts(search?: string): Promise<Product[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const body = await gatewayFetch<{ products: Product[] }>(`/api/v1/products${qs}`);
  return body.products;
}
