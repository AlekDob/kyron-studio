// Stato del filtro ordini: uno solo, per due chiamanti. L'umano lo muove dai
// select/tile della pagina, Nico lo scrive dalla chat mandando la stessa
// specifica dentro la ricevuta. Nessun filtro si applica qui: tutto vive
// nell'URL e lo esegue il server (studio-server, core/query + query-fields).
import { z } from "zod";
import { querySpecSchema, specChips, type QuerySpec } from "@/lib/query-spec";

export type StatusBucket = "all" | "da-confermare" | "confermati" | "annullati";

export interface OrdersFilter {
  from: string;
  to: string;
  portal: string; // channelSlug | "all"
  agent: string; // local-part | "all"
  status: StatusBucket;
  query: string;
  /** Query ricca composta da Nico. null = solo i filtri semplici. */
  spec: QuerySpec | null;
  /** Chi possiede il pannello adesso: un tocco umano degrada sempre a "browse". */
  source: "browse" | "agent";
}

export const STATUS_LABELS: Record<Exclude<StatusBucket, "all">, string> = {
  confermati: "Confermati",
  "da-confermare": "Da confermare",
  annullati: "Annullati",
};

/** Etichette dei filtri attivi: le usano i chip in pagina e la ricevuta in chat. */
export function filterChips(f: OrdersFilter): string[] {
  const chips: string[] = [];
  if (f.portal !== "all") chips.push(f.portal);
  if (f.agent !== "all") chips.push(`agente ${f.agent}`);
  if (f.status !== "all") chips.push(STATUS_LABELS[f.status]);
  if (f.query.trim()) chips.push(`"${f.query.trim()}"`);
  chips.push(...specChips(f.spec));
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
    spec: null,
    source: "browse",
  };
}

/** Il filtro come query string: e' l'URL la sua unica casa. */
export function toSearchParams(f: OrdersFilter): URLSearchParams {
  const p = new URLSearchParams({ from: f.from, to: f.to });
  if (f.portal !== "all") p.set("portal", f.portal);
  if (f.agent !== "all") p.set("agent", f.agent);
  if (f.status !== "all") p.set("status", f.status);
  if (f.query.trim()) p.set("q", f.query.trim());
  if (f.spec) p.set("spec", JSON.stringify(f.spec));
  return p;
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
  spec: querySpecSchema.nullable().default(null),
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
