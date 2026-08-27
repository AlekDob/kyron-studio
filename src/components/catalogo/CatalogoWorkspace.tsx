"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { Package } from "lucide-react";
import type { ChatStreamEvent } from "@studiofuturo/studio-core";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { CHANNELS } from "@/components/chat/agent-channels";
import type { GenerativeSubmission } from "@/components/chat/generative/types";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import { agentNameOf } from "@/components/shell/modules";
import type { CatalogInsights, Product } from "@/lib/products";
import { ProductsPanel } from "./ProductsPanel";
import { ProductDrawer } from "./ProductDrawer";
import { PortalDrawer } from "@/components/portals/PortalDrawer";
import { channelNames } from "./catalog-view";

const AGENT = agentNameOf("catalogo");

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products", { cache: "no-store" });
  if (!res.ok) return [];
  return ((await res.json()) as { products: Product[] }).products;
}

// Nomi dei portali + vendite per SKU. Contorno: arrivano dopo la lista e la
// pagina funziona anche se non arrivano (slug al posto dei nomi, vendite a 0).
async function fetchInsights(): Promise<CatalogInsights | null> {
  const res = await fetch("/api/products/insights", { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as CatalogInsights;
}

// Riga di contesto per l'agente: SKU, prezzi e giacenze del prodotto aperto.
// Compatta di proposito — e' testo appeso a ogni messaggio, non un report.
function describe(product: Product): string {
  const variants = product.variants
    .map((v) => {
      const price = v.channels.find((c) => c.priceEur !== null);
      return `${v.sku}${price ? ` a ${price.priceEur} su ${price.channelSlug}` : " senza prezzo"}, stock ${v.stock}`;
    })
    .join("; ");
  return `prodotto aperto — "${product.name}" (slug ${product.slug}); ${variants}`;
}

interface DaneaContext {
  id: string;
  filename: string;
  kind: "products" | "ddt";
}

function daneaContextOf(sub: GenerativeSubmission): DaneaContext | null {
  if (
    sub.component !== "DaneaUploader" ||
    !sub.data ||
    typeof sub.data !== "object"
  ) return null;
  const data = sub.data as Record<string, unknown>;
  if (typeof data.id !== "string" || !data.id.trim()) return null;
  if (typeof data.filename !== "string" || !data.filename.trim()) return null;
  if (data.kind !== "products" && data.kind !== "ddt") return null;
  return { id: data.id, filename: data.filename, kind: data.kind };
}

function describeDanea(context: DaneaContext): string {
  return `file Danea attivo — importId "${context.id}"; tipo ${context.kind}; file "${context.filename}"`;
}

// Dopo una scrittura il pannello e' vecchio: si rilegge il catalogo.
const WRITE_TOOLS = [
  "update_product",
  "update_variant",
  "set_stock",
  "apply_price_plan",
  "publish_product",
  "create_product",
  "apply_danea_import",
];

export function CatalogoWorkspace({
  initialProducts,
}: {
  initialProducts: Product[];
}): ReactElement {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selected, setSelected] = useState<Product | null>(null);
  // Quando la lista arriva dall'agente non la sovrascriviamo col catalogo
  // intero: l'utente ha appena visto il risultato di una ricerca.
  const [fromAgent, setFromAgent] = useState(false);
  const [insights, setInsights] = useState<CatalogInsights | null>(null);
  // Portale aperto sopra il drawer prodotto (click sul nome in "Portali").
  const [portalSlug, setPortalSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const selectedRef = useRef<Product | null>(null);
  const daneaRef = useRef<DaneaContext | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    void fetchInsights().then(setInsights);
  }, []);

  useEffect(() => {
    if (initialProducts.length) return;
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [initialProducts.length]);

  const refresh = useCallback(async (): Promise<void> => {
    setFromAgent(false);
    setProducts(await fetchProducts());
  }, []);

  // Lo stream dell'agente muove il pannello: nessun tool _ui per il catalogo,
  // basta guardare i risultati che passano.
  const onEvent = useCallback((ev: ChatStreamEvent): void => {
    if (ev.type !== "tool-result") return;
    const r = (ev.result ?? {}) as { products?: Product[]; slug?: string };
    if (ev.tool === "list_products" && Array.isArray(r.products)) {
      setProducts(r.products);
      setFromAgent(true);
      return;
    }
    if (ev.tool === "get_product" && r.slug) {
      setSelected(r as Product);
      return;
    }
    // Dopo una scrittura la lista in pagina e' vecchia: ricarichiamo.
    if (WRITE_TOOLS.includes(ev.tool)) {
      void fetchProducts().then(setProducts);
    }
  }, []);

  const onSubmission = useCallback((sub: GenerativeSubmission): void => {
    const context = daneaContextOf(sub);
    if (context) daneaRef.current = context;
  }, []);

  const selectionContext = useCallback((): string | null => {
    const parts: string[] = [];
    if (selectedRef.current) parts.push(describe(selectedRef.current));
    if (daneaRef.current) parts.push(describeDanea(daneaRef.current));
    return parts.length ? parts.join("\n") : null;
  }, []);

  const handleSelect = useCallback(
    (slug: string): void => {
      setSelected(products.find((p) => p.slug === slug) ?? null);
    },
    [products],
  );

  const names = channelNames(insights);
  const sales = insights?.sales.bySku ?? {};

  const panel = (
    <ProductsPanel
      products={products}
      selectedSlug={selected?.slug ?? null}
      onSelect={handleSelect}
      fromAgent={fromAgent}
      loading={loading}
      names={names}
      sales={sales}
      salesUpdatedAt={insights?.sales.updatedAt ?? ""}
    />
  );

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      <div className="flex-1 min-w-0 min-h-0 flex flex-col border-r border-[var(--color-line)] lg:h-full overflow-hidden">
        <AgentChannel
          agentId="catalogo"
          {...CHANNELS.catalogo}
          interactive
          onEvent={onEvent}
          onSubmission={onSubmission}
          selectionContext={selectionContext}
        />
      </div>
      <aside className="catalog-glass hidden lg:flex flex-col sticky top-0 h-full w-[420px] overflow-hidden">
        {fromAgent && (
          <button
            type="button"
            onClick={refresh}
            className="mx-5 mt-3 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            Mostra tutto il catalogo
          </button>
        )}
        {panel}
      </aside>
      <MobileChatOverlay
        label={AGENT}
        icon={<Package className="h-5 w-5" />}
        position="top-right"
      >
        {panel}
      </MobileChatOverlay>
      <ProductDrawer
        product={selected}
        onClose={() => setSelected(null)}
        names={names}
        sales={sales}
        onOpenPortal={setPortalSlug}
      />
      <PortalDrawer slug={portalSlug} onClose={() => setPortalSlug(null)} />
    </div>
  );
}
