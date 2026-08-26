"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { Package } from "lucide-react";
import type { ChatStreamEvent } from "@studiofuturo/studio-core";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { CHANNELS } from "@/components/chat/agent-channels";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import { agentNameOf } from "@/components/shell/modules";
import type { Product } from "@/lib/products";
import { ProductsPanel } from "./ProductsPanel";
import { ProductDrawer } from "./ProductDrawer";

const AGENT = agentNameOf("commesso");

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products", { cache: "no-store" });
  if (!res.ok) return [];
  return ((await res.json()) as { products: Product[] }).products;
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

export function CommessoWorkspace({
  initialProducts,
}: {
  initialProducts: Product[];
}): ReactElement {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selected, setSelected] = useState<Product | null>(null);
  // Quando la lista arriva dall'agente non la sovrascriviamo col catalogo
  // intero: l'utente ha appena visto il risultato di una ricerca.
  const [fromAgent, setFromAgent] = useState(false);
  const selectedRef = useRef<Product | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    if (initialProducts.length) return;
    fetchProducts().then(setProducts);
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

  const selectionContext = useCallback(
    (): string | null => (selectedRef.current ? describe(selectedRef.current) : null),
    [],
  );

  const handleSelect = useCallback(
    (slug: string): void => {
      setSelected(products.find((p) => p.slug === slug) ?? null);
    },
    [products],
  );

  const panel = (
    <ProductsPanel
      products={products}
      selectedSlug={selected?.slug ?? null}
      onSelect={handleSelect}
      fromAgent={fromAgent}
    />
  );

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      <div className="flex-1 min-w-0 min-h-0 flex flex-col border-r border-[var(--color-line)] lg:h-full overflow-hidden">
        <AgentChannel
          agentId="commesso"
          {...CHANNELS.commesso}
          interactive
          onEvent={onEvent}
          selectionContext={selectionContext}
        />
      </div>
      <aside className="hidden lg:flex flex-col bg-[var(--color-paper-soft)] sticky top-0 h-full w-[420px] overflow-hidden">
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
      <ProductDrawer product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
