// Stato del filtro ordini: uno solo, per due chiamanti. L'umano lo muove dai
// select/KPI della pagina, Nico lo scrive dalla chat mandando la stessa
// specifica dentro la ricevuta. Le date NON si filtrano qui: vivono nell'URL e
// fanno un refetch server-side (il payload in memoria e' gia' quel periodo).
import { z } from "zod";
import type { OrderRow } from "@/lib/gateway";
import { agentName } from "./format";

export type StatusBucket = "all" | "da-confermare" | "confermati" | "annullati";

export interface OrdersFilter {
  from: string; // specchio dell'URL
  to: string; // specchio dell'URL
  portal: string; // channelSlug | "all"
  agent: string; // local-part | "all"
  status: StatusBucket;
  query: string;
  /** Chi possiede il pannello adesso: un tocco umano degrada sempre a "browse". */
  source: "browse" | "agent";
}

export const STATUS_LABELS: Record<Exclude<StatusBucket, "all">, string> = {
  confermati: "Confermati",
  "da-confermare": "Da confermare",
  annullati: "Annullati",
};

/**
 * Bucket di stato di un ordine. Priorita': annullato -> bozza -> confermato.
 * Questa stessa priorita' e' replicata in studio-server (order-tools.ts): se le
 * due divergono, il conteggio della ricevuta e quello dei KPI non tornano.
 */
export function statusBucketOf(o: OrderRow): Exclude<StatusBucket, "all"> {
  if (o.workflowStatus === "annullato" || o.status === "CANCELED") return "annullati";
  if (o.status === "UNCONFIRMED" || o.status === "DRAFT") return "da-confermare";
  return "confermati";
}

// Ricerca su numero ordine, dati cliente (nome/email/telefono) e Stripe.
export function matchesQuery(o: OrderRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [
    o.number,
    o.customerName,
    o.companyName,
    o.userEmail,
    o.customerPhone,
    o.fiscalCode,
    o.vatNumber,
    o.sdiCode,
    o.pspReference,
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function matchesFilter(o: OrderRow, f: OrdersFilter): boolean {
  if (f.portal !== "all" && o.channelSlug !== f.portal) return false;
  if (f.agent !== "all" && agentName(o.agent) !== f.agent) return false;
  if (f.status !== "all" && statusBucketOf(o) !== f.status) return false;
  return matchesQuery(o, f.query);
}

/** Etichette dei filtri attivi: le usano i chip in pagina e la ricevuta in chat. */
export function filterChips(f: OrdersFilter): string[] {
  const chips: string[] = [];
  if (f.portal !== "all") chips.push(f.portal);
  if (f.agent !== "all") chips.push(`agente ${f.agent}`);
  if (f.status !== "all") chips.push(STATUS_LABELS[f.status]);
  if (f.query.trim()) chips.push(`"${f.query.trim()}"`);
  return chips;
}

export function emptyFilter(from: string, to: string): OrdersFilter {
  return {
    from,
    to,
    portal: "all",
    agent: "all",
    status: "all",
    query: "",
    source: "browse",
  };
}

// --- Ricevuta in chat (descriptor _ui) ---------------------------------------
// Un solo schema per tre posti: il tool lato server lo riempie, il parser del
// workspace lo legge, OrdersReceipt lo valida. Se divergono e' un errore zod
// visibile, non una card muta.

/** Le quattro sezioni della scheda ordine. Anche l'agente le nomina cosi'. */
export const ORDER_TABS = ["cliente", "pagamento", "prodotti", "note"] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export const filterSpecSchema = z.object({
  from: z.string(),
  to: z.string(),
  portal: z.string(),
  agent: z.string(),
  status: z.enum(["all", "da-confermare", "confermati", "annullati"]),
  query: z.string(),
});

export const ordersReceiptSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("filter"),
    filter: filterSpecSchema,
    count: z.number(),
    totalGross: z.number(),
  }),
  z.object({
    kind: z.literal("order"),
    number: z.string(),
    /** Sezione da mostrare: l'agente puo' portare l'operatore sul punto giusto. */
    tab: z.enum(ORDER_TABS).optional(),
    /** L'agente ha scritto sull'ordine: i dati in pagina sono vecchi, rileggi. */
    refresh: z.boolean().default(false),
    customer: z.string().default(""),
    portalName: z.string().default(""),
    totalGross: z.number().default(0),
  }),
]);

export type OrdersReceiptProps = z.infer<typeof ordersReceiptSchema>;
export type OrdersFilterSpec = z.infer<typeof filterSpecSchema>;
