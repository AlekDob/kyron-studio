import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import {
  lastDaneaImport,
  listCatalogInsights,
  listProducts,
  type CatalogInsights,
  type Product,
} from "@/lib/products";
import { ProductsWorkspace } from "@/components/products/ProductsWorkspace";
import { ProductsEmptyState } from "@/components/products/ProductsEmptyState";
import {
  applyFilter,
  buckets,
  categoryOf,
  type ProductOrder,
  type ProductStatus,
  type ProductsFilter,
} from "@/components/products/products-filter";
import { channelNames, portalLabel } from "@/components/catalogo/catalog-view";

export const metadata = { title: "Prodotti — Studio" };

// Modulo Prodotti (Teo). Tutti i filtri stanno nell'URL, ma li applica QUESTA
// pagina e non il BFF: `listProducts()` torna gia' tutto il catalogo (<=500
// prodotti) con categoria, canali e prezzi, quindi filtrare di la' sarebbe un
// secondo passaggio sugli stessi dati dietro un salto HTTP. Effetto identico
// agli Ordini: un filtro e' un link condivisibile e il tasto indietro funziona.

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUSES = ["all", "pubblicati", "non-pubblicati"] as const;
const ORDERS = ["vendite", "nome", "prezzo"] as const;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function readFilter(params: Record<string, string | string[] | undefined>): ProductsFilter {
  const status = one(params.stato) as ProductStatus;
  const order = one(params.ord) as ProductOrder;
  return {
    query: one(params.q),
    category: one(params.cat) || "all",
    portal: one(params.portale) || "all",
    status: STATUSES.includes(status) ? status : "all",
    order: ORDERS.includes(order) ? order : "vendite",
    // Un filtro scritto in URL da Teo arriva con `agente=1`: e' lui a possedere
    // il pannello finche' l'operatore non tocca un chip.
    source: one(params.agente) ? "agent" : "browse",
  };
}

/** Le categorie viste nel catalogo, in ordine alfabetico: sono i chip del filtro. */
function categoriesOf(products: Product[]): string[] {
  return [...new Set(products.map(categoryOf))].sort((a, b) => a.localeCompare(b));
}

function portalsOf(insights: CatalogInsights | null): Array<{ slug: string; name: string }> {
  const names = channelNames(insights);
  return (insights?.channels ?? [])
    .map((c) => ({ slug: c.slug, name: portalLabel(names, c.slug) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const filter = readFilter(await searchParams);

  // Tre letture indipendenti, ognuna col suo try: senza gli insights la pagina
  // funziona comunque (slug al posto dei nomi, vendite a 0), senza lo storico
  // import sparisce solo la data sul bottone. Senza i prodotti no.
  const [products, insights, lastImport] = await Promise.all([
    listProducts().catch(() => null),
    listCatalogInsights().catch(() => null),
    lastDaneaImport().catch(() => null),
  ]);

  if (!products) {
    return (
      <main className="px-5 py-8 sm:px-8">
        <ProductsEmptyState variant="error" />
      </main>
    );
  }

  const sales = insights?.sales.bySku ?? {};

  return (
    <ProductsWorkspace
      filter={filter}
      data={{
        products: applyFilter(products, filter, sales),
        buckets: buckets(products, sales),
        categories: categoriesOf(products),
        portals: portalsOf(insights),
        names: channelNames(insights),
        sales,
        salesUpdatedAt: insights?.sales.updatedAt ?? "",
        lastImport,
      }}
    />
  );
}
