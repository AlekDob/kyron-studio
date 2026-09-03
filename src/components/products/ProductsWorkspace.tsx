"use client";

// Workspace Prodotti: la lista vera a sinistra, Teo a destra. Un solo
// componente lista per due chiamanti — l'umano che clicca i filtri e Teo che li
// scrive dalla chat. In chat resta solo la ricevuta, mai una lista.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import type { ChatStreamEvent } from "@studiofuturo/studio-core";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { AgentFace } from "@/components/chat/AgentFace";
import { CHANNELS } from "@/components/chat/agent-channels";
import { extractGenerativeDescriptor, type GenerativeSubmission } from "@/components/chat/generative/types";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import { agentNameOf } from "@/components/shell/modules";
import { PortalDrawer } from "@/components/portals/PortalDrawer";
import { ProductsPanelContext } from "./products-panel-context";
import { ProductsView } from "./ProductsView";
import {
  filterChips,
  productsReceiptSchema,
  toSearchParams,
  type ProductsData,
  type ProductsFilter,
  type ProductsReceiptProps,
  type ProductTab,
} from "./products-filter";

// Dopo una scrittura di Teo la lista in pagina e' vecchia: si rilegge dal
// server (router.refresh), non si rifa' una fetch a mano — i dati stanno nella
// page, non in uno stato locale.
const WRITE_TOOLS = [
  "update_product",
  "update_variant",
  "set_stock",
  "apply_price_plan",
  "publish_product",
  "create_product",
  "apply_danea_import",
  "add_to_portals",
  "add_product_image",
];

// La ricevuta e' l'unica fonte: stesso descriptor che la chat renderizza, letto
// qui per muovere il pannello. Nessun secondo parsing del result grezzo.
function parseReceipt(ev: ChatStreamEvent): ProductsReceiptProps | null {
  if (ev.type !== "tool-result") return null;
  const d = extractGenerativeDescriptor(ev.result);
  if (!d || d.component !== "ProductsReceipt") return null;
  const parsed = productsReceiptSchema.safeParse(d.props);
  return parsed.success ? parsed.data : null;
}

interface DaneaContext {
  id: string;
  filename: string;
  kind: "products" | "ddt";
}

// Il file Danea appena caricato: senza questo contesto `apply_danea_import` non
// trova l'import (l'id vive solo nella submission del componente generativo).
function daneaContextOf(sub: GenerativeSubmission): DaneaContext | null {
  if (sub.component !== "DaneaUploader" || !sub.data || typeof sub.data !== "object") {
    return null;
  }
  const data = sub.data as Record<string, unknown>;
  if (typeof data.id !== "string" || !data.id.trim()) return null;
  if (typeof data.filename !== "string" || !data.filename.trim()) return null;
  if (data.kind !== "products" && data.kind !== "ddt") return null;
  return { id: data.id, filename: data.filename, kind: data.kind };
}

export function ProductsWorkspace({
  data,
  filter: serverFilter,
}: {
  data: ProductsData;
  /** Filtro risolto dall'URL: e' quello che il server ha gia' applicato. */
  filter: ProductsFilter;
}): ReactElement {
  const router = useRouter();
  // `pending` = la nuova lista e' in volo: al suo posto va lo skeleton, o si
  // resterebbe a guardare i risultati del filtro precedente credendoli nuovi.
  const [pending, startTransition] = useTransition();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [portalSlug, setPortalSlug] = useState<string | null>(null);
  // Specchio locale del filtro: i chip si accendono subito, senza aspettare il
  // giro sul server. La verita' resta l'URL.
  const [filter, setFilter] = useState<ProductsFilter>(serverFilter);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  // Tab della scheda: sta qui e non in ProductDetail perche' lo cambia anche
  // Teo (`get_product` manda `tab` dentro la ricevuta).
  const [tab, setTab] = useState<ProductTab>("informazioni");
  const daneaRef = useRef<DaneaContext | null>(null);

  useEffect(() => setFilter(serverFilter), [serverFilter]);

  // Unico punto di scrittura del filtro: lo usano i chip, le tile di stato e la
  // ricevuta dell'agente. Un giro solo di router.push per ogni cambio.
  const pushFilter = useCallback(
    (patch: Partial<ProductsFilter>) => {
      const next = { ...filterRef.current, ...patch };
      filterRef.current = next;
      setFilter(next);
      const params = toSearchParams(next);
      if (next.source === "agent") params.set("agente", "1");
      startTransition(() => router.push(`/prodotti?${params.toString()}`));
    },
    [router],
  );

  // Un punto solo: la chiama l'evento in arrivo e la richiama il click sulla
  // ricevuta, cosi' riaprire un risultato vecchio fa la stessa cosa.
  const applyReceipt = useCallback(
    (receipt: ProductsReceiptProps): void => {
      if (receipt.kind === "product") {
        if (receipt.tab) setTab(receipt.tab);
        // L'agente ha scritto sul prodotto: il payload in pagina e' di prima.
        if (receipt.refresh) startTransition(() => router.refresh());
        // Apriamo la scheda solo se il prodotto e' nella lista che l'operatore
        // ha davanti: aprirne uno fuori lista sarebbe una scheda senza contesto.
        if (data.products.some((p) => p.slug === receipt.slug)) {
          setSelectedSlug(receipt.slug);
        }
        return;
      }
      pushFilter({ ...receipt.filter, source: "agent" });
    },
    [data.products, pushFilter, router],
  );

  const onEvent = useCallback(
    (ev: ChatStreamEvent): void => {
      const receipt = parseReceipt(ev);
      if (receipt) {
        applyReceipt(receipt);
        return;
      }
      if (ev.type === "tool-result" && WRITE_TOOLS.includes(ev.tool)) {
        startTransition(() => router.refresh());
      }
    },
    [applyReceipt, router],
  );

  const onSubmission = useCallback((sub: GenerativeSubmission): void => {
    const context = daneaContextOf(sub);
    if (context) daneaRef.current = context;
  }, []);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  // Il contesto viaggia in uscita col messaggio: Teo sa filtri, prodotti a
  // video e scheda aperta senza rileggere tutto con un tool.
  const ctxRef = useRef({ data, filter, slug: selectedSlug });
  ctxRef.current = { data, filter, slug: selectedSlug };

  const selectionContext = useCallback((): string => {
    const { data: d, filter: f, slug } = ctxRef.current;
    const chips = filterChips(f);
    const open = slug ? d.products.find((p) => p.slug === slug) : null;
    return [
      `Pannello Prodotti: ${d.products.length} prodotti a video su ${d.buckets.total}${
        chips.length ? ` (filtri: ${chips.join(", ")})` : ""
      }.`,
      d.products.length
        ? `Primi: ${d.products.slice(0, 10).map((p) => p.name).join(", ")}.`
        : "",
      open ? `Scheda aperta: "${open.name}" (slug ${open.slug}).` : "",
      daneaRef.current
        ? `File Danea attivo — importId "${daneaRef.current.id}"; tipo ${daneaRef.current.kind}; file "${daneaRef.current.filename}".`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, []);

  const extraBody = useCallback(() => ({ scope: "catalogo" }), []);

  // Stesso canale in due gusci: colonna a destra su desktop, bottom sheet
  // dietro la faccia di Teo su mobile. Il montaggio e' esclusivo (MobileChat-
  // Overlay non monta sopra i 1024px), quindi non ci sono due chat vive.
  const channel = (hideHeader: boolean) => (
    <AgentChannel
      agentId="products"
      {...CHANNELS.products}
      interactive
      hideHeader={hideHeader}
      onEvent={onEvent}
      onSubmission={onSubmission}
      extraBody={extraBody}
      selectionContext={selectionContext}
    />
  );

  const agent = agentNameOf("products");

  return (
    <ProductsPanelContext.Provider value={applyReceipt}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ProductsView
            data={data}
            filter={filter}
            onFilterChange={pushFilter}
            loading={pending}
            selectedSlug={selectedSlug}
            onSelectSlug={setSelectedSlug}
            tab={tab}
            onTabChange={setTab}
            onOpenPortal={setPortalSlug}
            onChanged={refresh}
          />
        </div>
        <aside className="hidden min-h-0 w-[420px] shrink-0 flex-col border-l border-[var(--color-line)] lg:flex">
          {channel(false)}
        </aside>
        <MobileChatOverlay
          label={agent}
          icon={<AgentFace seed="products" label={agent} size={36} />}
        >
          {channel(true)}
        </MobileChatOverlay>
        <PortalDrawer slug={portalSlug} onClose={() => setPortalSlug(null)} />
      </div>
    </ProductsPanelContext.Provider>
  );
}
