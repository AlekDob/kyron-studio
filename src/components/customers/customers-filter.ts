// Stato del filtro clienti: uno solo, per due chiamanti. L'umano lo muove dai
// tile e dai chip della testata, Bea lo scrive dalla chat mandando la stessa
// specifica dentro la ricevuta. Nessun filtro si applica qui: tutto vive
// nell'URL e lo esegue il server (studio-server, features/customers).
import { z } from "zod";
import { querySpecSchema, specChips, type QuerySpec } from "@/lib/query-spec";

export type CustomerGroup = "all" | "nuovi" | "ricorrenti";

export interface CustomersFilter {
  from: string;
  to: string;
  portal: string; // channelSlug | "all"
  agent: string; // local-part | "all"
  group: CustomerGroup;
  query: string;
  /** Query ricca composta da Bea. null = solo i filtri semplici. */
  spec: QuerySpec | null;
  /** Chi possiede il pannello adesso: un tocco umano degrada sempre a "browse". */
  source: "browse" | "agent";
}

export const GROUP_LABELS: Record<Exclude<CustomerGroup, "all">, string> = {
  nuovi: "Nuovi",
  ricorrenti: "Ricorrenti",
};

/** Etichette dei filtri attivi: le usano i chip in pagina e la ricevuta in chat. */
export function filterChips(f: CustomersFilter): string[] {
  const chips: string[] = [];
  if (f.portal !== "all") chips.push(f.portal);
  if (f.agent !== "all") chips.push(`agente ${f.agent}`);
  if (f.group !== "all") chips.push(GROUP_LABELS[f.group]);
  if (f.query.trim()) chips.push(`"${f.query.trim()}"`);
  chips.push(...specChips(f.spec));
  return chips;
}

export function emptyFilter(from: string, to: string): CustomersFilter {
  return { from, to, portal: "all", agent: "all", group: "all", query: "", spec: null, source: "browse" };
}

/** Il filtro come query string: e' l'URL la sua unica casa. */
export function toSearchParams(f: CustomersFilter): URLSearchParams {
  const p = new URLSearchParams({ from: f.from, to: f.to });
  if (f.portal !== "all") p.set("portal", f.portal);
  if (f.agent !== "all") p.set("agent", f.agent);
  if (f.group !== "all") p.set("group", f.group);
  if (f.query.trim()) p.set("q", f.query.trim());
  if (f.spec) p.set("spec", JSON.stringify(f.spec));
  return p;
}

// --- Ricevuta in chat (descriptor _ui) ---------------------------------------
// Un solo schema per tre posti: il tool lato server lo riempie, il parser del
// workspace lo legge, CustomersReceipt lo valida.

/** Le quattro sezioni della scheda cliente. Anche l'agente le nomina cosi'. */
export const CUSTOMER_TABS = ["anagrafica", "ordini", "comunicazioni", "note"] as const;
export type CustomerTab = (typeof CUSTOMER_TABS)[number];

export const filterSpecSchema = z.object({
  from: z.string(),
  to: z.string(),
  portal: z.string(),
  agent: z.string(),
  group: z.enum(["all", "nuovi", "ricorrenti"]),
  query: z.string(),
  spec: querySpecSchema.nullable().default(null),
});

export const customersReceiptSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("filter"),
    filter: filterSpecSchema,
    count: z.number(),
    totalSpent: z.number().default(0),
  }),
  z.object({
    kind: z.literal("customer"),
    /** L'email e' l'identita' del cliente: non esiste un id. */
    email: z.string(),
    name: z.string().default(""),
    tab: z.enum(CUSTOMER_TABS).optional(),
  }),
]);

export type CustomersReceiptProps = z.infer<typeof customersReceiptSchema>;
export type CustomersFilterSpec = z.infer<typeof filterSpecSchema>;
