// Self-check delle funzioni pure del filtro prodotti. Non e' una suite: e' la
// cosa piu' piccola che fallisce se il raggruppamento riordina la lista o se
// "non pubblicato" e "senza prezzo" tornano a essere lo stesso insieme.
// Si esegue a mano: `npx tsx src/components/products/products-filter.check.ts`
import assert from "node:assert/strict";
import type { Product } from "@/lib/products";
import type { SalesIndex } from "@/components/catalogo/catalog-view";
import { applyFilter, buckets, emptyFilter, groupByCategory } from "./products-filter";

function product(
  name: string,
  category: string | null,
  channels: string[],
  priceEur: number | null,
): Product {
  return {
    id: name,
    slug: name.toLowerCase(),
    name,
    category,
    productType: "test",
    description: "",
    imageUrl: null,
    images: [],
    channels,
    variants: [
      {
        id: `${name}-v`,
        sku: `SKU-${name}`,
        name: "unica",
        stock: 1,
        attributes: [],
        images: [],
        channels: [{ channelSlug: "default-channel", priceEur, published: true }],
      },
    ],
  };
}

// iPad venduto, Mac mai venduto ma pubblicato, Cavo con prezzo e nessun canale.
const ipad = product("iPad", "Tablet", ["default-channel", "massari"], 500);
const mac = product("Mac", "Computer", ["default-channel"], 1500);
const cavo = product("Cavo", "Accessori", [], 19);
const custodia = product("Custodia", "Accessori", ["default-channel"], null);
const all = [cavo, custodia, mac, ipad];
const sales: SalesIndex = { "SKU-iPad": { total: 7, byChannel: { massari: 7 } } };

// 1. Il raggruppamento spezza, non riordina: la lista appiattita e' identica.
const sorted = applyFilter(all, emptyFilter(), sales);
assert.deepEqual(
  sorted.map((p) => p.name),
  ["iPad", "Cavo", "Custodia", "Mac"],
  "atteso: venduti prima, poi ordine alfabetico",
);
assert.deepEqual(
  groupByCategory(sorted).flatMap((g) => g.products.map((p) => p.name)),
  sorted.map((p) => p.name),
  "groupByCategory ha cambiato l'ordine della lista",
);

// 2. "Non pubblicati" != "senza prezzo": Custodia e' pubblicata senza prezzo,
//    Cavo ha un prezzo ma nessun canale. I due insiemi non coincidono.
const unpublished = applyFilter(all, { ...emptyFilter(), status: "non-pubblicati" }, sales);
assert.deepEqual(unpublished.map((p) => p.name), ["Cavo"]);
const published = applyFilter(all, { ...emptyFilter(), status: "pubblicati" }, sales);
assert.ok(published.some((p) => p.name === "Custodia"), "senza prezzo resta pubblicata");

// 3. I tile contano tutto il catalogo, non la lista filtrata.
assert.deepEqual(buckets(all, sales), { total: 4, published: 3, unpublished: 1, sold: 7 });

// 4. Portale e ordinamento.
assert.deepEqual(
  applyFilter(all, { ...emptyFilter(), portal: "massari" }, sales).map((p) => p.name),
  ["iPad"],
);
assert.deepEqual(
  applyFilter(all, { ...emptyFilter(), order: "prezzo" }, sales).map((p) => p.name),
  ["Cavo", "iPad", "Mac", "Custodia"],
  "senza prezzo va in fondo",
);

console.log("products-filter: ok");
