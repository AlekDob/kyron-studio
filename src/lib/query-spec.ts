// Source: studio-server src/core/query/spec.ts — stesso schema, lato client solo
// per trasportare la query e descriverla a parole. Il filtraggio vero lo fa il
// server: qui non si valuta niente, si serializza e si etichetta.
import { z } from "zod";

export const conditionSchema = z.object({
  field: z.string(),
  op: z.enum([
    "eq",
    "ne",
    "gt",
    "gte",
    "lt",
    "lte",
    "contains",
    "in",
    "between",
    "empty",
    "notEmpty",
  ]),
  value: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number()])),
    ])
    .optional(),
});

export const querySpecSchema = z.object({
  all: z.array(conditionSchema).default([]),
  any: z.array(conditionSchema).default([]),
  sort: z.object({ field: z.string(), dir: z.enum(["asc", "desc"]) }).optional(),
});

export type Condition = z.infer<typeof conditionSchema>;
export type QuerySpec = z.infer<typeof querySpecSchema>;

export function isEmptySpec(spec: QuerySpec | null | undefined): boolean {
  return !spec || (spec.all.length === 0 && spec.any.length === 0);
}

const OP_LABEL: Record<Condition["op"], string> = {
  eq: "=",
  ne: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  contains: "contiene",
  in: "tra",
  between: "tra",
  empty: "vuoto",
  notEmpty: "valorizzato",
};

// I nomi dei campi arrivano dal linguaggio dei tool (camelCase). In pagina
// finiscono dentro una frase letta da una persona: qui diventano italiano.
const FIELD_LABEL: Record<string, string> = {
  portaleNome: "portale",
  agenteEmail: "agente",
  statoLavorazione: "stato lavorazione",
  statoPagamento: "pagamento",
  statoSaleor: "stato Saleor",
  metodoPagamento: "metodo di pagamento",
  codiceMeccanografico: "codice meccanografico",
  ivaAgevolata: "IVA agevolata",
  cartaDocente: "Carta del Docente",
  cartaDocenteAcquisita: "buono acquisito",
  bonificoIncassato: "bonifico incassato",
  citta: "citta",
};

const fieldLabel = (field: string): string => FIELD_LABEL[field] ?? field;

/** Condizione a parole, per il chip in pagina e nella ricevuta di chat. */
export function conditionLabel(c: Condition): string {
  if (c.op === "empty" || c.op === "notEmpty")
    return `${fieldLabel(c.field)} ${OP_LABEL[c.op]}`;
  const value = Array.isArray(c.value) ? c.value.join("–") : String(c.value ?? "");
  return `${fieldLabel(c.field)} ${OP_LABEL[c.op]} ${value}`;
}

/** Tutte le condizioni di una spec come etichette. L'OR si segna come tale. */
export function specChips(spec: QuerySpec | null | undefined): string[] {
  if (!spec) return [];
  // `all`/`any` hanno un default nello schema, ma una spec puo' arrivare da una
  // ricevuta o da un URL scritti a mano: qui si legge, non si valida.
  const chips = (spec.all ?? []).map(conditionLabel);
  if (spec.any?.length) chips.push(`uno tra: ${spec.any!.map(conditionLabel).join(" / ")}`);
  return chips;
}

/** Spec da stringa JSON (URL o ricevuta). null se assente o malformata. */
export function parseSpec(raw: string | null | undefined): QuerySpec | null {
  if (!raw) return null;
  try {
    const parsed = querySpecSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
