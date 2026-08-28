// Derivazioni di vista del catalogo: nomi portali, vendite, prezzi per portale,
// ordinamento. Stanno qui e non nei componenti perche' le usano sia la lista
// che il drawer (DRY) e perche' sono logica pura, testabile senza React.
import { fuzzyFilter } from "@/lib/fuzzy";
import type { CatalogInsights, Product, SkuSales } from "@/lib/products";

export const MAIN_SHOP = "default-channel";

export type SalesIndex = Record<string, SkuSales>;
export type ChannelNames = Record<string, string>;

export function channelNames(insights: CatalogInsights | null): ChannelNames {
  const out: ChannelNames = {};
  for (const c of insights?.channels ?? []) out[c.slug] = c.name;
  return out;
}

/** Nome leggibile del portale; se manca resta lo slug (meglio che vuoto). */
export function portalLabel(names: ChannelNames, slug: string): string {
  if (slug === MAIN_SHOP) return "Negozio principale";
  return names[slug] ?? slug;
}

const eurFmt = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function eur(n: number | null): string {
  return n === null ? "—" : eurFmt.format(n);
}

/** Vendite totali del prodotto: somma delle sue varianti (chiave = SKU). */
export function productSales(product: Product, sales: SalesIndex): number {
  return product.variants.reduce((sum, v) => sum + (sales[v.sku]?.total ?? 0), 0);
}

function salesOn(product: Product, sales: SalesIndex, channel: string): number {
  return product.variants.reduce(
    (sum, v) => sum + (sales[v.sku]?.byChannel[channel] ?? 0),
    0,
  );
}

/** Prezzi del prodotto su un canale (una voce per variante con prezzo). */
function pricesOn(product: Product, channel: string): number[] {
  return product.variants
    .map((v) => v.channels.find((c) => c.channelSlug === channel)?.priceEur ?? null)
    .filter((p): p is number => p !== null);
}

/**
 * Etichetta della variante nel popover prezzi: la capacita', non il colore.
 * Un iPad costa 509/639/889 per 128/256/512GB e lo stesso su tutti i colori:
 * etichettare col colore mostrava "Blu 509, Rosa 509, Blu 639..." senza dire
 * niente. Se il taglio non c'e' resta il nome della variante.
 */
function variantLabel(v: Product["variants"][number]): string {
  const size = v.attributes.find((a) => /capacit|memoria|taglia/i.test(a.name))?.value;
  return size || v.name || v.sku;
}

/** Prezzo di ogni variante su un canale: quello che sta dietro al "da X". */
export function variantPricesOn(
  product: Product,
  channel: string,
): Array<{ label: string; priceEur: number }> {
  const seen = new Map<string, number>();
  for (const v of product.variants) {
    const price = v.channels.find((c) => c.channelSlug === channel)?.priceEur;
    if (price === undefined || price === null) continue;
    // Un taglio per riga: le quattro varianti colore dello stesso taglio hanno
    // lo stesso prezzo e vanno unite. Se due tagli con la stessa etichetta
    // avessero prezzi diversi si vedrebbero come due righe, ed e' giusto.
    seen.set(`${variantLabel(v)}·${price}`, price);
  }
  return [...seen.entries()]
    .map(([key, priceEur]) => ({ label: key.split("·")[0], priceEur }))
    .sort((a, b) => a.priceEur - b.priceEur);
}

/** Prezzo di riferimento in lista: canale della ricerca, altrimenti main shop, altrimenti il minimo. */
export function listPrice(product: Product, channel?: string | null): number | null {
  const scoped = channel ? pricesOn(product, channel) : [];
  if (scoped.length) return Math.min(...scoped);
  const main = pricesOn(product, MAIN_SHOP);
  if (main.length) return Math.min(...main);
  const all = product.variants.flatMap((v) =>
    v.channels.map((c) => c.priceEur).filter((p): p is number => p !== null),
  );
  return all.length ? Math.min(...all) : null;
}

/** Etichetta prezzo in lista: "da X" se le varianti hanno prezzi diversi. */
export function listPriceLabel(product: Product, channel?: string | null): string {
  const price = listPrice(product, channel);
  if (price === null) return "—";
  const scoped = channel ? pricesOn(product, channel) : [];
  const main = pricesOn(product, MAIN_SHOP);
  const prices = scoped.length
    ? scoped
    : main.length
      ? main
      : product.variants.flatMap((v) =>
          v.channels.map((c) => c.priceEur).filter((p): p is number => p !== null),
        );
  return new Set(prices).size > 1 ? `da ${eur(price)}` : eur(price);
}

export interface PortalRow {
  slug: string;
  name: string;
  /** prezzo minimo sul portale (null = nessun prezzo impostato) */
  priceEur: number | null;
  /** true se le varianti hanno prezzi diversi: il minimo diventa "da X" */
  priceFrom: boolean;
  sales: number;
}

/**
 * I portali su cui il prodotto e' pubblicato, col prezzo e le vendite di quel
 * portale. Ordinati per vendite (chi vende sta sopra), poi per nome.
 */
export function portalRows(
  product: Product,
  names: ChannelNames,
  sales: SalesIndex,
): PortalRow[] {
  return product.channels
    .map((slug) => {
      const prices = pricesOn(product, slug);
      return {
        slug,
        name: portalLabel(names, slug),
        priceEur: prices.length ? Math.min(...prices) : null,
        priceFrom: new Set(prices).size > 1,
        sales: salesOn(product, sales, slug),
      };
    })
    .sort((a, b) => b.sales - a.sales || a.name.localeCompare(b.name));
}

/**
 * Lista di lavoro del pannello: filtro fuzzy (nome, SKU, categoria) e ordine
 * "pubblicati prima, piu' venduti sopra". Senza query l'ordine e' il nostro;
 * con la query vince la rilevanza del match.
 */
export function catalogRows(
  products: Product[],
  sales: SalesIndex,
  query: string,
): Product[] {
  const sorted = [...products].sort((a, b) => {
    const pub = Number(b.channels.length > 0) - Number(a.channels.length > 0);
    if (pub) return pub;
    const bySales = productSales(b, sales) - productSales(a, sales);
    return bySales || a.name.localeCompare(b.name);
  });
  if (!query.trim()) return sorted;
  return fuzzyFilter(sorted, query, (p) =>
    [p.name, p.category ?? "", ...p.variants.map((v) => v.sku)].join(" "),
  );
}
