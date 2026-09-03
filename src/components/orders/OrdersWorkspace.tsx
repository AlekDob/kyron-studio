"use client";

// Workspace Ordini: la lista vera a sinistra, l'agente a destra. Un solo
// componente lista per due chiamanti — l'umano che clicca i filtri e Nico che
// li scrive dalla chat. In chat resta solo la ricevuta, mai una lista.
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
import type { OrdersResponse, OrderRow } from "@/lib/gateway";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { AgentFace } from "@/components/chat/AgentFace";
import { CHANNELS } from "@/components/chat/agent-channels";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import { agentNameOf } from "@/components/shell/modules";
import { OrdersPanelContext } from "./orders-panel-context";
import { extractGenerativeDescriptor } from "@/components/chat/generative/types";
import { OrdersView } from "./OrdersView";
import {
  filterChips,
  ordersReceiptSchema,
  toSearchParams,
  type OrdersFilter,
  type OrdersReceiptProps,
  type OrderTab,
} from "./orders-filter";

// La ricevuta e' l'unica fonte: stesso descriptor che la chat renderizza, letto
// qui per muovere il pannello. Nessun secondo parsing del result grezzo.
function parseReceipt(ev: ChatStreamEvent): OrdersReceiptProps | null {
  if (ev.type !== "tool-result") return null;
  const d = extractGenerativeDescriptor(ev.result);
  if (!d || d.component !== "OrdersReceipt") return null;
  const parsed = ordersReceiptSchema.safeParse(d.props);
  return parsed.success ? parsed.data : null;
}

export function OrdersWorkspace({
  data,
  filter: serverFilter,
}: {
  data: OrdersResponse;
  /** Filtro risolto dall'URL: e' quello che il server ha gia' applicato. */
  filter: OrdersFilter;
}): ReactElement {
  const router = useRouter();
  // `pending` = la nuova lista e' in volo: al suo posto va lo skeleton, o si
  // resterebbe a guardare i risultati del filtro precedente credendoli nuovi.
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Specchio locale del filtro: i select si accendono subito, senza aspettare
  // il giro sul server. La verita' resta l'URL.
  const [filter, setFilter] = useState<OrdersFilter>(serverFilter);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  // Tab della scheda: sta qui e non in OrderDetail perche' lo cambia anche
  // Nico (`get_order`/`add_order_note` mandano `tab` dentro la ricevuta).
  const [tab, setTab] = useState<OrderTab>("cliente");

  useEffect(() => setFilter(serverFilter), [serverFilter]);

  // Unico punto di scrittura del filtro: lo usano i controlli, le tile di stato
  // e la ricevuta dell'agente. Un giro solo di router.push per ogni cambio.
  const pushFilter = useCallback(
    (patch: Partial<OrdersFilter>) => {
      const next = { ...filterRef.current, ...patch };
      filterRef.current = next;
      setFilter(next);
      startTransition(() => router.push(`/orders?${toSearchParams(next).toString()}`));
    },
    [router],
  );

  // Un punto solo: la chiama l'evento in arrivo e la richiama il click sulla
  // ricevuta, cosi' riaprire un risultato vecchio fa esattamente la stessa cosa.
  const applyReceipt = useCallback(
    (receipt: OrdersReceiptProps): void => {
      if (receipt.kind === "order") {
        if (receipt.tab) setTab(receipt.tab);
        // L'agente ha scritto sull'ordine: il payload in memoria e' di prima.
        if (receipt.refresh) startTransition(() => router.refresh());
        // Apriamo la scheda solo se l'ordine e' nel periodo che l'operatore ha
        // davanti: aprirne una fuori lista sarebbe una scheda senza contesto.
        const hit = data.orders.find((o) => o.number === receipt.number);
        if (hit) setSelectedId(hit.id);
        return;
      }
      // La ricevuta arriva gia' normalizzata dal tool (splitSimpleFilters):
      // portale, agente e stato sono chip, nella spec resta solo il resto.
      pushFilter({ ...receipt.filter, source: "agent" });
    },
    [data.orders, pushFilter, router],
  );

  const onEvent = useCallback(
    (ev: ChatStreamEvent): void => {
      const receipt = parseReceipt(ev);
      if (receipt) applyReceipt(receipt);
    },
    [applyReceipt],
  );

  // Il contesto viaggia in uscita col messaggio: Nico sa periodo, filtri e
  // ordini a video senza rileggere tutto con un tool.
  const ctxRef = useRef<{ rows: OrderRow[]; filter: OrdersFilter; id: string | null }>({
    rows: data.orders,
    filter,
    id: selectedId,
  });
  ctxRef.current = { rows: data.orders, filter, id: selectedId };

  const selectionContext = useCallback((): string => {
    const { rows, filter: f, id } = ctxRef.current;
    const chips = filterChips(f);
    const open = id ? rows.find((o) => o.id === id) : null;
    return [
      `Pannello Ordini: periodo ${f.from} → ${f.to}, ${rows.length} ordini a video${
        chips.length ? ` (filtri: ${chips.join(", ")})` : ""
      }.`,
      // La spec attiva serve tale e quale: Nico ci aggiunge condizioni sopra
      // invece di ricomporre il filtro da zero a ogni richiesta di raffinamento.
      f.spec ? `Spec attiva: ${JSON.stringify(f.spec)}.` : "",
      rows.length
        ? `Primi numeri: ${rows.slice(0, 10).map((o) => o.number).join(", ")}.`
        : "",
      open ? `Scheda aperta: ordine ${open.number}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, []);

  const extraBody = useCallback(() => ({ scope: "orders" }), []);

  // Stesso canale in due gusci: colonna a destra su desktop, bottom sheet
  // dietro la faccia di Nico su mobile. Il montaggio e' esclusivo (MobileChat-
  // Overlay non monta sopra i 1024px), quindi non ci sono due chat vive.
  const channel = (hideHeader: boolean) => (
    <AgentChannel
      agentId="orders"
      {...CHANNELS.orders}
      interactive
      hideHeader={hideHeader}
      onEvent={onEvent}
      extraBody={extraBody}
      selectionContext={selectionContext}
    />
  );

  const agent = agentNameOf("orders");

  return (
    <OrdersPanelContext.Provider value={applyReceipt}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <OrdersView
            data={data}
            filter={filter}
            onFilterChange={pushFilter}
            loading={pending}
            selectedId={selectedId}
            onSelectId={setSelectedId}
            tab={tab}
            onTabChange={setTab}
          />
        </div>
        <aside className="hidden min-h-0 w-[420px] shrink-0 flex-col border-l border-[var(--color-line)] lg:flex">
          {channel(false)}
        </aside>
        <MobileChatOverlay
          label={agent}
          icon={<AgentFace seed="orders" label={agent} size={36} />}
        >
          {channel(true)}
        </MobileChatOverlay>
      </div>
    </OrdersPanelContext.Provider>
  );
}
