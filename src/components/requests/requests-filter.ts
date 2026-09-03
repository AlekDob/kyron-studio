// Stato del filtro richieste: uno solo, per due chiamanti. Il collega lo muove
// dai chip della testata, Ivo lo scrive dalla chat mandando la stessa specifica
// dentro la ricevuta. L'URL e' la sua unica casa.
//
// Qui il filtro si applica davvero (a differenza di Clienti): i ticket sono al
// massimo un centinaio e arrivano tutti in un colpo da Linear, non ha senso
// rifare il giro di rete per un chip.
import { z } from "zod";
import type { RequestGroup, RequestRow } from "@/lib/requests";

export const REQUEST_LABELS = ["Bug", "Feature", "Improvement", "Article"] as const;
export type RequestLabel = (typeof REQUEST_LABELS)[number];

export interface RequestsFilter {
  /** "all" = tutti gli stati. */
  group: RequestGroup | "all";
  label: RequestLabel | "all";
  query: string;
  /** Solo le richieste aperte da chi sta guardando. */
  mine: boolean;
  /** Chi possiede il pannello adesso: un tocco umano degrada sempre a "browse". */
  source: "browse" | "agent";
}

export const GROUP_LABELS: Record<RequestGroup, string> = {
  todo: "Da fare",
  doing: "In corso",
  done: "Fatte",
};

export function emptyFilter(): RequestsFilter {
  return { group: "all", label: "all", query: "", mine: false, source: "browse" };
}

/** Etichette dei filtri attivi: le usano i chip in pagina e la ricevuta in chat. */
export function filterChips(f: RequestsFilter): string[] {
  const chips: string[] = [];
  if (f.group !== "all") chips.push(GROUP_LABELS[f.group]);
  if (f.label !== "all") chips.push(f.label);
  if (f.mine) chips.push("solo le mie");
  if (f.query.trim()) chips.push(`"${f.query.trim()}"`);
  return chips;
}

export function toSearchParams(f: RequestsFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (f.group !== "all") p.set("group", f.group);
  if (f.label !== "all") p.set("label", f.label);
  if (f.mine) p.set("mine", "1");
  if (f.query.trim()) p.set("q", f.query.trim());
  return p;
}

/**
 * Applica il filtro. Funzione pura: la usa la pagina lato server e il
 * self-check qui accanto.
 */
export function filterRequests(
  rows: RequestRow[],
  f: RequestsFilter,
  userEmail: string,
): RequestRow[] {
  const needle = f.query.trim().toLowerCase();
  const me = userEmail.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (f.group === "all" || r.group === f.group) &&
      (f.label === "all" || r.labels.includes(f.label)) &&
      (!f.mine || r.requestedBy.toLowerCase() === me) &&
      (!needle ||
        r.title.toLowerCase().includes(needle) ||
        r.description.toLowerCase().includes(needle)),
  );
}

/** Quante ce ne sono per stato: sono i numeri delle tile, contati prima dei chip. */
export function groupTotals(rows: RequestRow[]): Record<RequestGroup, number> {
  return {
    todo: rows.filter((r) => r.group === "todo").length,
    doing: rows.filter((r) => r.group === "doing").length,
    done: rows.filter((r) => r.group === "done").length,
  };
}

// --- Ricevuta in chat (descriptor _ui) ---------------------------------------
// Un solo schema per tre posti: il tool lato server lo riempie, il parser del
// workspace lo legge, RequestsReceipt lo valida.

export const requestsFilterSpecSchema = z.object({
  group: z.enum(["all", "todo", "doing", "done"]),
  label: z.enum(["all", ...REQUEST_LABELS]),
  query: z.string().default(""),
  mine: z.boolean().default(false),
});

export const requestsReceiptSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("filter"),
    filter: requestsFilterSpecSchema,
    count: z.number(),
  }),
  z.object({
    kind: z.literal("created"),
    identifier: z.string(),
    title: z.string(),
    url: z.string(),
  }),
]);

export type RequestsReceiptProps = z.infer<typeof requestsReceiptSchema>;
