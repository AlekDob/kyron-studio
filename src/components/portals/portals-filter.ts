// Stato del filtro portali: uno solo, per due chiamanti. L'umano lo muove dai
// tile e dai chip della testata, Livia lo scrive dalla chat mandando la stessa
// specifica dentro la ricevuta. L'URL e' la sua unica casa, cosi' un filtro e'
// un link condivisibile e il tasto indietro funziona.
//
// Come in Prodotti (e a differenza di Ordini) il filtro NON gira nel BFF:
// `listPortals()` torna gia' tutti i portali (decine), filtrare di la' sarebbe
// un secondo passaggio sugli stessi dati dietro un salto HTTP.
import { z } from "zod";
import { fuzzyFilter } from "@/lib/fuzzy";
import type { PortalSummary } from "@/lib/gateway";

export type PortalStatus = "all" | "live" | "bozze";
export type PortalOrder = "nome" | "prodotti" | "recenti";

export interface PortalsFilter {
  query: string;
  status: PortalStatus;
  city: string; // citta' | "all"
  order: PortalOrder;
  /** Chi possiede il pannello adesso: un tocco umano degrada sempre a "browse". */
  source: "browse" | "agent";
}

export const STATUS_LABELS: Record<Exclude<PortalStatus, "all">, string> = {
  live: "Live",
  bozze: "Bozze",
};

export const ORDER_LABELS: Record<PortalOrder, string> = {
  nome: "nome",
  prodotti: "prodotti",
  recenti: "piu' recenti",
};

export function emptyFilter(): PortalsFilter {
  return { query: "", status: "all", city: "all", order: "nome", source: "browse" };
}

/** Etichette dei filtri attivi: le usano i chip in pagina e la ricevuta in chat. */
export function filterChips(f: PortalsFilter): string[] {
  const chips: string[] = [];
  if (f.city !== "all") chips.push(f.city);
  if (f.status !== "all") chips.push(STATUS_LABELS[f.status]);
  if (f.query.trim()) chips.push(`"${f.query.trim()}"`);
  if (f.order !== "nome") chips.push(`per ${ORDER_LABELS[f.order]}`);
  return chips;
}

export function toSearchParams(f: PortalsFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query.trim()) p.set("q", f.query.trim());
  if (f.status !== "all") p.set("stato", f.status);
  if (f.city !== "all") p.set("citta", f.city);
  if (f.order !== "nome") p.set("ord", f.order);
  return p;
}

// --- Derivazioni pure --------------------------------------------------------

/**
 * Modello a due stati: solo `draft` e' Bozza, tutto il resto (review, approved,
 * onboarded) e' Live. Gli stati legacy esistono ancora nei doc Payload vecchi.
 */
export function isDraft(p: PortalSummary): boolean {
  return p.status === "draft";
}

/**
 * I quattro numeri della testata, calcolati sulla lista NON filtrata: i tile
 * dicono quanto c'e' in tutto, non quanto resta del filtro corrente.
 */
export function buckets(portals: PortalSummary[]) {
  let drafts = 0;
  let kits = 0;
  for (const p of portals) {
    if (isDraft(p)) drafts += 1;
    kits += p.bundleCount;
  }
  return { total: portals.length, live: portals.length - drafts, drafts, kits };
}

function compare(a: PortalSummary, b: PortalSummary, f: PortalOrder): number {
  if (f === "prodotti") return b.productCount - a.productCount || a.nome.localeCompare(b.nome);
  // Senza data va in fondo: e' un dato mancante, non un portale vecchissimo.
  if (f === "recenti") return (b.collectedAt || "").localeCompare(a.collectedAt || "");
  return a.nome.localeCompare(b.nome);
}

/** Lista a schermo: filtri semplici, poi ricerca fuzzy, poi ordinamento. */
export function applyFilter(portals: PortalSummary[], f: PortalsFilter): PortalSummary[] {
  const kept = portals.filter((p) => {
    if (f.status === "bozze" && !isDraft(p)) return false;
    if (f.status === "live" && isDraft(p)) return false;
    if (f.city !== "all" && p.city !== f.city) return false;
    return true;
  });
  const sorted = kept.sort((a, b) => compare(a, b, f.order));
  if (!f.query.trim()) return sorted;
  // Con la query vince la rilevanza del match: e' quello che si sta cercando.
  return fuzzyFilter(sorted, f.query, (p) => [p.nome, p.slug, p.city].join(" "));
}

export interface PortalGroup {
  key: string;
  label: string;
  portals: PortalSummary[];
}

/**
 * Due gruppi: Bozze in cima (sono il lavoro da finire), Live sotto. Dentro il
 * gruppo l'ordine e' quello che arriva, quindi il raggruppamento spezza e non
 * riordina. I gruppi vuoti non si rendono.
 */
export function groupByStatus(portals: PortalSummary[]): PortalGroup[] {
  const drafts = portals.filter(isDraft);
  const live = portals.filter((p) => !isDraft(p));
  return [
    { key: "bozze", label: "Bozze", portals: drafts },
    { key: "live", label: "Live", portals: live },
  ].filter((g) => g.portals.length > 0);
}

// --- Ricevuta in chat (descriptor _ui) ---------------------------------------
// Un solo schema per tre posti: il tool lato server lo riempie, il parser del
// workspace lo legge, PortalsReceipt lo valida. Se divergono e' un errore zod
// visibile, non una card muta.

/** Le tre sezioni della scheda portale. Anche l'agente le nomina cosi'. */
export const PORTAL_TABS = ["informazioni", "catalogo", "kit"] as const;
export type PortalTab = (typeof PORTAL_TABS)[number];

export const filterSpecSchema = z.object({
  query: z.string().default(""),
  status: z.enum(["all", "live", "bozze"]).default("all"),
  city: z.string().default("all"),
  order: z.enum(["nome", "prodotti", "recenti"]).default("nome"),
});

export const portalsReceiptSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("filter"),
    filter: filterSpecSchema,
  }),
  z.object({
    kind: z.literal("portal"),
    /** Lo slug e' l'identita' del portale ovunque: URL shop, canale Saleor, doc. */
    slug: z.string(),
    name: z.string().default(""),
    /** Sezione da mostrare: l'agente puo' portare l'operatore sul punto giusto. */
    tab: z.enum(PORTAL_TABS).optional(),
    /** L'agente ha scritto sul portale: i dati in pagina sono vecchi, rileggi. */
    refresh: z.boolean().default(false),
    city: z.string().default(""),
    statusLabel: z.string().default(""),
  }),
]);

export type PortalsReceiptProps = z.infer<typeof portalsReceiptSchema>;
export type PortalsFilterSpec = z.infer<typeof filterSpecSchema>;

// --- Dati della pagina -------------------------------------------------------

/** Quello che la page ha gia' risolto lato server per il workspace. */
export interface PortalsData {
  /** Portali dopo `applyFilter`: sono le righe a schermo. */
  portals: PortalSummary[];
  /** Contati su tutti i portali, non sulla lista filtrata. */
  buckets: ReturnType<typeof buckets>;
  cities: string[];
}
