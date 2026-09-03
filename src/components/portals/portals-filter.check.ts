// Self-check delle funzioni pure del filtro portali. Non e' una suite: e' la
// cosa piu' piccola che fallisce se il raggruppamento riordina la lista, se i
// tile smettono di contare tutto, o se uno stato legacy (review/approved)
// torna a passare per bozza.
// Si esegue a mano: `npx tsx src/components/portals/portals-filter.check.ts`
import assert from "node:assert/strict";
import type { PortalSummary } from "@/lib/gateway";
import { applyFilter, buckets, emptyFilter, groupByStatus } from "./portals-filter";

function portal(
  nome: string,
  status: string,
  city: string,
  productCount: number,
  bundleCount: number,
  collectedAt: string,
): PortalSummary {
  return {
    slug: nome.toLowerCase(),
    nome,
    city,
    countryArea: "BA",
    status,
    collectedBy: "",
    requestedBy: "",
    collectedAt,
    bundleCount,
    productCount,
    logoUrl: null,
  };
}

const massari = portal("Massari", "onboarded", "Bari", 12, 2, "2026-01-10");
const moro = portal("Moro", "draft", "Bari", 3, 0, "2026-03-01");
const russo = portal("Russo", "approved", "Lecce", 7, 1, "2026-02-01");
const all = [massari, moro, russo];

// 1. Il raggruppamento spezza, non riordina: la lista appiattita e' identica.
const sorted = applyFilter(all, emptyFilter());
assert.deepEqual(sorted.map((p) => p.nome), ["Massari", "Moro", "Russo"]);
assert.deepEqual(
  groupByStatus(sorted).flatMap((g) => g.portals.map((p) => p.nome)),
  ["Moro", "Massari", "Russo"],
  "atteso: bozze prima, e dentro il gruppo l'ordine di partenza",
);

// 2. Stato legacy: "approved" e' Live, non bozza.
assert.deepEqual(
  applyFilter(all, { ...emptyFilter(), status: "bozze" }).map((p) => p.nome),
  ["Moro"],
);
assert.deepEqual(
  applyFilter(all, { ...emptyFilter(), status: "live" }).map((p) => p.nome),
  ["Massari", "Russo"],
);

// 3. I tile contano tutto, non la lista filtrata.
assert.deepEqual(buckets(all), { total: 3, live: 2, drafts: 1, kits: 3 });

// 4. Citta' e ordinamenti.
assert.deepEqual(
  applyFilter(all, { ...emptyFilter(), city: "Lecce" }).map((p) => p.nome),
  ["Russo"],
);
assert.deepEqual(
  applyFilter(all, { ...emptyFilter(), order: "prodotti" }).map((p) => p.nome),
  ["Massari", "Russo", "Moro"],
);
assert.deepEqual(
  applyFilter(all, { ...emptyFilter(), order: "recenti" }).map((p) => p.nome),
  ["Moro", "Russo", "Massari"],
);

console.log("portals-filter: ok");
