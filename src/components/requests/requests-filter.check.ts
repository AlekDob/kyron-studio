// Self-check delle funzioni pure del filtro richieste. Non e' una suite: e' la
// cosa piu' piccola che fallisce se il filtro smette di finire nell'URL, se la
// ricerca smette di guardare la descrizione, o se la ricevuta di Ivo e il
// pannello si scollano (schema divergente = card muta).
// Si esegue a mano: `npx tsx src/components/requests/requests-filter.check.ts`
import assert from "node:assert/strict";
import type { RequestRow } from "@/lib/requests";
import {
  emptyFilter,
  filterChips,
  filterRequests,
  groupTotals,
  requestsReceiptSchema,
  toSearchParams,
} from "./requests-filter";

const row = (p: Partial<RequestRow>): RequestRow => ({
  id: p.id ?? "1",
  identifier: p.identifier ?? "FUT-1",
  title: p.title ?? "Titolo",
  description: p.description ?? "",
  url: "https://linear.app/x",
  state: "Todo",
  stateColor: "#000",
  group: p.group ?? "todo",
  labels: p.labels ?? [],
  urgency: p.urgency ?? "media",
  requestedBy: p.requestedBy ?? "",
  createdAt: "2026-09-01",
  updatedAt: "2026-09-01",
});

const base = emptyFilter();

// 1. Vuoto: nell'URL non va niente. Un "group=all" farebbe credere che ci sia
//    un filtro dove non c'e'.
assert.equal(toSearchParams(base).toString(), "");
assert.deepEqual(filterChips(base), []);

// 2. Filtri pieni: ogni valore ha la sua chiave, la ricerca ripulita.
const full = { ...base, group: "doing" as const, label: "Bug" as const, mine: true, query: "  foto  " };
const q = toSearchParams(full);
assert.equal(q.get("group"), "doing");
assert.equal(q.get("label"), "Bug");
assert.equal(q.get("mine"), "1");
assert.equal(q.get("q"), "foto", "la ricerca va ripulita dagli spazi");
assert.equal(filterChips(full).length, 4);

const rows = [
  row({ id: "a", group: "todo", labels: ["Bug"], requestedBy: "Mario@kyron.it", title: "Le foto non si caricano" }),
  row({ id: "b", group: "doing", labels: ["Feature"], requestedBy: "lucia@kyron.it", description: "servono le FOTO grandi" }),
  row({ id: "c", group: "done", labels: ["Bug"], requestedBy: "mario@kyron.it" }),
];

// 3. La ricerca guarda anche la descrizione: chi cerca "foto" deve trovare
//    anche il ticket che la nomina solo li' dentro.
const found = filterRequests(rows, { ...base, query: "foto" }, "");
assert.deepEqual(found.map((r) => r.id), ["a", "b"]);

// 4. "Solo le mie" confronta le email senza badare alle maiuscole: su Linear
//    l'email la scrive l'agente, non un menu a tendina.
assert.deepEqual(
  filterRequests(rows, { ...base, mine: true }, "MARIO@kyron.it").map((r) => r.id),
  ["a", "c"],
);

// 5. Stato e tipo filtrano in AND.
assert.deepEqual(
  filterRequests(rows, { ...base, group: "done", label: "Bug" }, "").map((r) => r.id),
  ["c"],
);

// 6. Le tile si contano su TUTTE le righe, non su quelle filtrate: cliccando
//    "Da fare" i numeri delle altre devono restare veri.
assert.deepEqual(groupTotals(rows), { todo: 1, doing: 1, done: 1 });

// 7. La ricevuta: stesso schema che riempie il tool lato server. Il filtro deve
//    poter tornare dentro senza `source` (che e' solo del client).
const receipt = requestsReceiptSchema.parse({
  kind: "filter",
  filter: { group: "todo", label: "all" },
  count: 3,
});
assert.equal(receipt.kind === "filter" && receipt.filter.query, "", "query ha default vuoto");
assert.equal(
  requestsReceiptSchema.safeParse({ kind: "filter", filter: { group: "chiuse", label: "all" }, count: 1 }).success,
  false,
  "uno stato che il pannello non conosce deve essere rifiutato",
);
requestsReceiptSchema.parse({ kind: "created", identifier: "FUT-9", title: "x", url: "https://linear.app/x" });

console.log("requests-filter: ok");
