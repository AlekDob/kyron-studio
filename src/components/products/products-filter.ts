// Stato del filtro prodotti: uno solo, per due chiamanti. L'umano lo muove dai
// tile e dai chip della testata, Teo lo scrive dalla chat mandando la stessa
// specifica dentro la ricevuta. L'URL e' la sua unica casa, cosi' un filtro e'
// un link condivisibile e il tasto indietro funziona.
//
// A differenza degli Ordini il filtro NON gira nel BFF: `listProducts()` torna
// gia' tutto il catalogo (<=500 prodotti) con categoria, canali e prezzi, e il
// gateway fa gia' un giro in memoria suo. Filtrare di la' sarebbe un secondo
// passaggio sugli stessi dati dietro un salto HTTP.
import { z } from "zod";
import { fuzzyFilter } from "@/lib/fuzzy";
import type { DaneaImportLog, Product } from "@/lib/products";
import { listPrice, productSales, type SalesIndex } from "@/components/catalogo/catalog-view";

export type ProductStatus = "all" | "pubblicati" | "non-pubblicati";
export type ProductOrder = "vendite" | "nome" | "prezzo";

export interface ProductsFilter {
  query: string;
  category: string; // categoria | "all"
  portal: string; // channelSlug | "all"
  status: ProductStatus;
  order: ProductOrder;
  /** Chi possiede il pannello adesso: un tocco umano degrada sempre a "browse". */
  source: "browse" | "agent";
}

export const STATUS_LABELS: Record<Exclude<ProductStatus, "all">, string> = {
  pubblicati: "Pubblicati",
  "non-pubblicati": "Non pubblicati",
};

export const ORDER_LABELS: Record<ProductOrder, string> = {
  vendite: "venduti",
  nome: "nome",
  prezzo: "prezzo",
};

export function emptyFilter(): ProductsFilter {
  return {
    query: "",
    category: "all",
    portal: "all",
    status: "all",
    order: "vendite",
    source: "browse",
  };
}

/** Etichette dei filtri attivi: le usano i chip in pagina e la ricevuta in chat. */
export function filterChips(f: ProductsFilter): string[] {
  const chips: string[] = [];
  if (f.category !== "all") chips.push(f.category);
  if (f.portal !== "all") chips.push(f.portal);
  if (f.status !== "all") chips.push(STATUS_LABELS[f.status]);
  if (f.query.trim()) chips.push(`"${f.query.trim()}"`);
  if (f.order !== "vendite") chips.push(`per ${ORDER_LABELS[f.order]}`);
  return chips;
}

export function toSearchParams(f: ProductsFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query.trim()) p.set("q", f.query.trim());
  if (f.category !== "all") p.set("cat", f.category);
  if (f.portal !== "all") p.set("portale", f.portal);
  if (f.status !== "all") p.set("stato", f.status);
  if (f.order !== "vendite") p.set("ord", f.order);
  return p;
}

// --- Derivazioni pure --------------------------------------------------------

/** Categoria di lavoro: i prodotti senza categoria stanno tutti insieme. */
export function categoryOf(p: Product): string {
  return p.category ?? "Senza categoria";
}

function isPublished(p: Product): boolean {
  return p.channels.length > 0;
}

/**
 * I quattro numeri della testata, calcolati sulla lista NON filtrata (come
 * `data.buckets` in Ordini): i tile devono dire quanto c'e' in tutto, non
 * quanto resta del filtro corrente.
 */
export function buckets(products: Product[], sales: SalesIndex) {
  let published = 0;
  let sold = 0;
  for (const p of products) {
    if (isPublished(p)) published += 1;
    sold += productSales(p, sales);
  }
  return { total: products.length, published, unpublished: products.length - published, sold };
}

function compare(a: Product, b: Product, f: ProductsFilter, sales: SalesIndex): number {
  if (f.order === "nome") return a.name.localeCompare(b.name);
  if (f.order === "prezzo") {
    // Senza prezzo va in fondo: e' un buco da riempire, non un prodotto gratis.
    const pa = listPrice(a, f.portal === "all" ? null : f.portal) ?? Infinity;
    const pb = listPrice(b, f.portal === "all" ? null : f.portal) ?? Infinity;
    return pa - pb || a.name.localeCompare(b.name);
  }
  return productSales(b, sales) - productSales(a, sales) || a.name.localeCompare(b.name);
}

/** Lista a schermo: filtri semplici, poi ricerca fuzzy, poi ordinamento. */
export function applyFilter(
  products: Product[],
  f: ProductsFilter,
  sales: SalesIndex,
): Product[] {
  const kept = products.filter((p) => {
    if (f.category !== "all" && categoryOf(p) !== f.category) return false;
    if (f.portal !== "all" && !p.channels.includes(f.portal)) return false;
    if (f.status === "pubblicati" && !isPublished(p)) return false;
    if (f.status === "non-pubblicati" && isPublished(p)) return false;
    return true;
  });
  const sorted = kept.sort((a, b) => compare(a, b, f, sales));
  if (!f.query.trim()) return sorted;
  // Con la query vince la rilevanza del match: e' quello che si sta cercando.
  return fuzzyFilter(sorted, f.query, (p) =>
    [p.name, categoryOf(p), ...p.variants.map((v) => v.sku)].join(" "),
  );
}

export interface CategoryGroup {
  key: string;
  label: string;
  products: Product[];
}

/** Soglia oltre la quale le categorie minori finiscono in un gruppo unico. */
const MAX_GROUPS = 12;
const OTHERS = "Altre categorie";

/**
 * Gruppi per categoria nell'ordine in cui le categorie compaiono nella lista
 * gia' ordinata: cosi' il raggruppamento non riordina niente, spezza solo.
 * Se le categorie sono troppe le piu' piccole si fondono in "Altre categorie",
 * altrimenti la lista diventa un elenco di intestazioni da una riga.
 */
export function groupByCategory(products: Product[]): CategoryGroup[] {
  const groups: CategoryGroup[] = [];
  const index = new Map<string, CategoryGroup>();
  for (const p of products) {
    const key = categoryOf(p);
    let g = index.get(key);
    if (!g) {
      g = { key, label: key, products: [] };
      index.set(key, g);
      groups.push(g);
    }
    g.products.push(p);
  }
  if (groups.length <= MAX_GROUPS) return groups;
  const big = groups.filter((g) => g.products.length > 1).slice(0, MAX_GROUPS - 1);
  const rest = groups.filter((g) => !big.includes(g)).flatMap((g) => g.products);
  return rest.length ? [...big, { key: OTHERS, label: OTHERS, products: rest }] : big;
}

// --- Ricevuta in chat (descriptor _ui) ---------------------------------------
// Un solo schema per tre posti: il tool lato server lo riempie, il parser del
// workspace lo legge, ProductsReceipt lo valida. Se divergono e' un errore zod
// visibile, non una card muta.

/** Le due sezioni della scheda prodotto. Anche l'agente le nomina cosi'. */
export const PRODUCT_TABS = ["informazioni", "sconti", "varianti"] as const;
export type ProductTab = (typeof PRODUCT_TABS)[number];

export const filterSpecSchema = z.object({
  query: z.string().default(""),
  category: z.string().default("all"),
  portal: z.string().default("all"),
  status: z.enum(["all", "pubblicati", "non-pubblicati"]).default("all"),
  order: z.enum(["vendite", "nome", "prezzo"]).default("vendite"),
});

// Niente `count` nella ricevuta: il gateway cerca per sottostringa, il pannello
// per sottosequenza (fuzzy). Un numero dal tool smentirebbe le righe a schermo.
export const productsReceiptSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("filter"),
    filter: filterSpecSchema,
  }),
  z.object({
    kind: z.literal("product"),
    /** Lo slug e' l'identita' del prodotto in pagina (l'id Saleor non si vede). */
    slug: z.string(),
    name: z.string().default(""),
    /** Sezione da mostrare: l'agente puo' portare l'operatore sul punto giusto. */
    tab: z.enum(PRODUCT_TABS).optional(),
    /** L'agente ha scritto sul prodotto: i dati in pagina sono vecchi, rileggi. */
    refresh: z.boolean().default(false),
    category: z.string().default(""),
    priceLabel: z.string().default(""),
  }),
]);

export type ProductsReceiptProps = z.infer<typeof productsReceiptSchema>;
export type ProductsFilterSpec = z.infer<typeof filterSpecSchema>;

// --- Dati della pagina -------------------------------------------------------

/** Quello che la page ha gia' risolto lato server per il workspace. */
export interface ProductsData {
  /** Prodotti dopo `applyFilter`: sono le righe a schermo. */
  products: Product[];
  /** Contati su tutto il catalogo, non sulla lista filtrata. */
  buckets: ReturnType<typeof buckets>;
  categories: string[];
  portals: Array<{ slug: string; name: string }>;
  names: Record<string, string>;
  sales: SalesIndex;
  /** Quando sono state calcolate le vendite (cache 15' lato gateway). */
  salesUpdatedAt: string;
  /** Ultimo listino Danea caricato. `null` = non risulta nessun import. */
  lastImport: DaneaImportLog | null;
}
