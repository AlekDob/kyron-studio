"use client";

// Workspace Richieste: la lista vera a sinistra, Ivo a destra. Stesso schema di
// Clienti e Ordini — un solo componente lista per due chiamanti, il collega che
// clicca i chip e l'agente che li scrive dalla chat. In chat resta solo la
// ricevuta, mai una lista.
import { useCallback, useEffect, useRef, useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import type { ChatStreamEvent } from "@studiofuturo/studio-core";
import type { RequestRow } from "@/lib/requests";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { AgentFace } from "@/components/chat/AgentFace";
import { CHANNELS } from "@/components/chat/agent-channels";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import { agentNameOf } from "@/components/shell/modules";
import { extractGenerativeDescriptor } from "@/components/chat/generative/types";
import { RequestsPanelContext } from "./requests-panel-context";
import { RequestsView } from "./RequestsView";
import {
  filterChips,
  requestsReceiptSchema,
  toSearchParams,
  type RequestsFilter,
  type RequestsReceiptProps,
} from "./requests-filter";

// La ricevuta e' l'unica fonte: stesso descriptor che la chat renderizza, letto
// qui per muovere il pannello.
function parseReceipt(ev: ChatStreamEvent): RequestsReceiptProps | null {
  if (ev.type !== "tool-result") return null;
  const d = extractGenerativeDescriptor(ev.result);
  if (!d || d.component !== "RequestsReceipt") return null;
  const parsed = requestsReceiptSchema.safeParse(d.props);
  return parsed.success ? parsed.data : null;
}

export function RequestsWorkspace({
  requests,
  filter: serverFilter,
  userEmail,
}: {
  requests: RequestRow[];
  filter: RequestsFilter;
  userEmail: string;
}): ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestsFilter>(serverFilter);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  useEffect(() => setFilter(serverFilter), [serverFilter]);

  const pushFilter = useCallback(
    (patch: Partial<RequestsFilter>) => {
      const next = { ...filterRef.current, ...patch };
      filterRef.current = next;
      setFilter(next);
      startTransition(() => router.push(`/richieste?${toSearchParams(next).toString()}`));
    },
    [router],
  );

  const applyReceipt = useCallback(
    (receipt: RequestsReceiptProps): void => {
      // Ticket appena aperto: la lista lo prende al giro dopo, quindi si
      // ricarica la pagina invece di inventarsi una riga che il server non ha.
      if (receipt.kind === "created") {
        startTransition(() => router.refresh());
        return;
      }
      pushFilter({ ...receipt.filter, source: "agent" });
    },
    [pushFilter, router],
  );

  const onEvent = useCallback(
    (ev: ChatStreamEvent): void => {
      const receipt = parseReceipt(ev);
      if (receipt) applyReceipt(receipt);
    },
    [applyReceipt],
  );

  // Il contesto viaggia in uscita col messaggio: Ivo sa cosa c'e' a video senza
  // rileggere tutto con un tool.
  const ctxRef = useRef<{ filter: RequestsFilter; count: number; id: string | null }>({
    filter,
    count: requests.length,
    id: selectedId,
  });
  ctxRef.current = { filter, count: requests.length, id: selectedId };

  const selectionContext = useCallback((): string => {
    const { filter: f, count, id } = ctxRef.current;
    const chips = filterChips(f);
    const open = id ? requests.find((r) => r.id === id) : null;
    return [
      `Pannello Richieste: ${count} ticket nel progetto${chips.length ? ` (filtri: ${chips.join(", ")})` : ""}.`,
      open ? `Scheda aperta: ${open.identifier} — ${open.title}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, [requests]);

  const channel = (hideHeader: boolean) => (
    <AgentChannel
      agentId="requests"
      {...CHANNELS.requests}
      interactive
      hideHeader={hideHeader}
      onEvent={onEvent}
      selectionContext={selectionContext}
    />
  );

  const agent = agentNameOf("requests");

  return (
    <RequestsPanelContext.Provider value={applyReceipt}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <RequestsView
            requests={requests}
            filter={filter}
            onFilterChange={pushFilter}
            userEmail={userEmail}
            loading={pending}
            selectedId={selectedId}
            onSelectId={setSelectedId}
          />
        </div>
        <aside className="hidden min-h-0 w-[420px] shrink-0 flex-col border-l border-[var(--color-line)] lg:flex">
          {channel(false)}
        </aside>
        <MobileChatOverlay
          label={agent}
          icon={<AgentFace seed="requests" label={agent} size={36} />}
        >
          {channel(true)}
        </MobileChatOverlay>
      </div>
    </RequestsPanelContext.Provider>
  );
}
