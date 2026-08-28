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

/** Condizione a parole, per il chip in pagina e nella ricevuta di chat. */
export function conditionLabel(c: Condition): string {
  if (c.op === "empty" || c.op === "notEmpty") return `${c.field} ${OP_LABEL[c.op]}`;
  const value = Array.isArray(c.value) ? c.value.join("–") : String(c.value ?? "");
  return `${c.field} ${OP_LABEL[c.op]} ${value}`;
}

/** Tutte le condizioni di una spec come etichette. L'OR si segna come tale. */
export function specChips(spec: QuerySpec | null | undefined): string[] {
  if (!spec) return [];
  const chips = spec.all.map(conditionLabel);
  if (spec.any.length) chips.push(`uno tra: ${spec.any.map(conditionLabel).join(" / ")}`);
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
