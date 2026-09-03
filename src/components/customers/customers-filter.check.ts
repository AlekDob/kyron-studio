// Self-check delle funzioni pure del filtro clienti. Non e' una suite: e' la
// cosa piu' piccola che fallisce se il filtro smette di finire nell'URL o se la
// ricevuta di Bea e il pannello si scollano (schema divergente = card muta).
// Si esegue a mano: `npx tsx src/components/customers/customers-filter.check.ts`
import assert from "node:assert/strict";
import {
  customersReceiptSchema,
  emptyFilter,
  filterChips,
  toSearchParams,
} from "./customers-filter";

const base = emptyFilter("2026-01-01", "2026-08-31");

// 1. Vuoto: nell'URL vanno solo le date. Un "portal=all" farebbe credere al
//    server che c'e' un filtro portale.
assert.equal(toSearchParams(base).toString(), "from=2026-01-01&to=2026-08-31");

// 2. Filtri pieni: ogni valore ha la sua chiave, la spec va in JSON.
const full = {
  ...base,
  portal: "massari",
  agent: "r.russo",
  group: "ricorrenti" as const,
  query: "  rossi  ",
  spec: { all: [{ field: "speso", op: "gte" as const, value: 1000 }], any: [] },
};
const q = toSearchParams(full);
assert.equal(q.get("portal"), "massari");
assert.equal(q.get("agent"), "r.russo");
assert.equal(q.get("group"), "ricorrenti");
assert.equal(q.get("q"), "rossi", "la ricerca va ripulita dagli spazi");
assert.deepEqual(JSON.parse(q.get("spec") ?? ""), full.spec);

// 3. I chip raccontano tutti i filtri attivi, spec inclusa: senza, la lista
//    sarebbe filtrata e la frase in testata direbbe "tutti i portali".
const chips = filterChips(full);
assert.ok(chips.includes("massari"));
assert.ok(chips.includes("Ricorrenti"));
assert.ok(chips.some((c) => c.includes("speso")), `spec assente dai chip: ${chips.join(", ")}`);
assert.deepEqual(filterChips(base), [], "senza filtri nessun chip");

// 4. La ricevuta: e' lo stesso schema che riempie il tool lato server. Il
//    filtro deve poter tornare dentro senza `source` (che e' solo del client).
const receipt = customersReceiptSchema.parse({
  kind: "filter",
  filter: { from: base.from, to: base.to, portal: "all", agent: "all", group: "all", query: "", spec: null },
  count: 12,
});
assert.equal(receipt.kind === "filter" && receipt.totalSpent, 0, "totalSpent ha default 0");
const card = customersReceiptSchema.parse({ kind: "customer", email: "a@b.it", tab: "note" });
assert.equal(card.kind === "customer" && card.name, "");
assert.equal(
  customersReceiptSchema.safeParse({ kind: "customer", email: "a@b.it", tab: "pagamento" }).success,
  false,
  "un tab che nella scheda cliente non esiste deve essere rifiutato",
);

console.log("customers-filter: ok");
