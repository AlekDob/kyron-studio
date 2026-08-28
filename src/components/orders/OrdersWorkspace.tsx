"use client";

// Workspace Ordini: la lista vera a sinistra, l'agente a destra. Un solo
// componente lista per due chiamanti — l'umano che clicca i filtri e Nico che
// li scrive dalla chat. In chat resta solo la ricevuta, mai una lista.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import type { ChatStreamEvent } from "@studiofuturo/studio-core";
import type { OrdersResponse, OrderRow } from "@/lib/gateway";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { CHANNELS } from "@/components/chat/agent-channels";
import { extractGenerativeDescriptor } from "@/components/chat/generative/types";
import { OrdersView } from "./OrdersView";
import {
  emptyFilter,
  filterChips,
  matchesFilter,
  ordersReceiptSchema,
  type OrdersFilter,
  type OrdersReceiptProps,
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
  from,
  to,
}: {
  data: OrdersResponse;
  from: string;
  to: string;
}): ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrdersFilter>(() => emptyFilter(from, to));

  // Le date sono nell'URL: quando il periodo cambia il server rifa' il fetch e
  // qui riallineiamo lo specchio (gli altri filtri restano dove sono).
  useEffect(() => {
    setFilter((f) => (f.from === from && f.to === to ? f : { ...f, from, to }));
  }, [from, to]);

  const patchFilter = useCallback(
    (patch: Partial<OrdersFilter>) => setFilter((f) => ({ ...f, ...patch })),
    [],
  );

  const onEvent = useCallback(
    (ev: ChatStreamEvent): void => {
      const receipt = parseReceipt(ev);
      if (!receipt) return;
      if (receipt.kind === "order") {
        // Apriamo la scheda solo se l'ordine e' nel periodo che l'operatore ha
        // davanti: aprirne una fuori lista sarebbe una scheda senza contesto.
        const hit = data.orders.find((o) => o.number === receipt.number);
        if (hit) setSelectedId(hit.id);
        return;
      }
      setFilter({ ...receipt.filter, source: "agent" });
      // Periodo diverso da quello in pagina: serve un refetch, l'URL comanda.
      if (receipt.filter.from !== from || receipt.filter.to !== to) {
        const params = new URLSearchParams({
          from: receipt.filter.from,
          to: receipt.filter.to,
        });
        startTransition(() => router.push(`/orders?${params.toString()}`));
      }
    },
    [data.orders, from, to, router],
  );

  const visible = useMemo(
    () => data.orders.filter((o) => matchesFilter(o, filter)),
    [data.orders, filter],
  );

  // Il contesto viaggia in uscita col messaggio: Nico sa periodo, filtri e
  // ordini a video senza rileggere tutto con un tool.
  const ctxRef = useRef<{ visible: OrderRow[]; filter: OrdersFilter; id: string | null }>({
    visible,
    filter,
    id: selectedId,
  });
  ctxRef.current = { visible, filter, id: selectedId };

  const selectionContext = useCallback((): string => {
    const { visible: rows, filter: f, id } = ctxRef.current;
    const chips = filterChips(f);
    const open = id ? rows.find((o) => o.id === id) : null;
    return [
      `Pannello Ordini: periodo ${f.from} → ${f.to}, ${rows.length} ordini a video${
        chips.length ? ` (filtri: ${chips.join(", ")})` : ""
      }.`,
      rows.length
        ? `Primi numeri: ${rows.slice(0, 10).map((o) => o.number).join(", ")}.`
        : "",
      open ? `Scheda aperta: ordine ${open.number}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, []);

  const extraBody = useCallback(() => ({ scope: "orders" }), []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <OrdersView
          data={data}
          filter={filter}
          onFilterChange={patchFilter}
          selectedId={selectedId}
          onSelectId={setSelectedId}
        />
      </div>
      <aside className="hidden min-h-0 w-[420px] shrink-0 flex-col border-l border-[var(--color-line)] lg:flex">
        <AgentChannel
          agentId="orders"
          {...CHANNELS.orders}
          interactive
          onEvent={onEvent}
          extraBody={extraBody}
          selectionContext={selectionContext}
        />
      </aside>
    </div>
  );
}
