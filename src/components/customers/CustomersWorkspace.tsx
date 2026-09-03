"use client";

// Workspace Clienti: la lista vera a sinistra, Bea a destra. Stesso schema di
// Ordini e Prodotti — un solo componente lista per due chiamanti, l'umano che
// clicca i filtri e l'agente che li scrive dalla chat. In chat resta solo la
// ricevuta, mai una lista.
import { useCallback, useEffect, useRef, useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import type { ChatStreamEvent } from "@studiofuturo/studio-core";
import type { CustomerRow, CustomersResponse } from "@/lib/customers";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { AgentFace } from "@/components/chat/AgentFace";
import { CHANNELS } from "@/components/chat/agent-channels";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import { agentNameOf } from "@/components/shell/modules";
import { extractGenerativeDescriptor } from "@/components/chat/generative/types";
import { CustomersPanelContext } from "./customers-panel-context";
import { CustomersView } from "./CustomersView";
import {
  customersReceiptSchema,
  filterChips,
  toSearchParams,
  type CustomerTab,
  type CustomersFilter,
  type CustomersReceiptProps,
} from "./customers-filter";

// La ricevuta e' l'unica fonte: stesso descriptor che la chat renderizza, letto
// qui per muovere il pannello.
function parseReceipt(ev: ChatStreamEvent): CustomersReceiptProps | null {
  if (ev.type !== "tool-result") return null;
  const d = extractGenerativeDescriptor(ev.result);
  if (!d || d.component !== "CustomersReceipt") return null;
  const parsed = customersReceiptSchema.safeParse(d.props);
  return parsed.success ? parsed.data : null;
}

export function CustomersWorkspace({
  data,
  filter: serverFilter,
}: {
  data: CustomersResponse;
  filter: CustomersFilter;
}): ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [filter, setFilter] = useState<CustomersFilter>(serverFilter);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  // Il tab sta qui e non nella scheda perche' lo cambia anche Bea
  // (`get_customer` manda `tab` dentro la ricevuta).
  const [tab, setTab] = useState<CustomerTab>("anagrafica");

  useEffect(() => setFilter(serverFilter), [serverFilter]);

  const pushFilter = useCallback(
    (patch: Partial<CustomersFilter>) => {
      const next = { ...filterRef.current, ...patch };
      filterRef.current = next;
      setFilter(next);
      startTransition(() => router.push(`/clienti?${toSearchParams(next).toString()}`));
    },
    [router],
  );

  const applyReceipt = useCallback(
    (receipt: CustomersReceiptProps): void => {
      if (receipt.kind === "customer") {
        if (receipt.tab) setTab(receipt.tab);
        // Apriamo la scheda solo se il cliente e' nella lista che l'operatore
        // ha davanti: aprirne uno fuori periodo sarebbe una scheda senza contesto.
        const hit = data.customers.find((c) => c.email === receipt.email.toLowerCase());
        if (hit) setSelectedEmail(hit.email);
        return;
      }
      pushFilter({ ...receipt.filter, source: "agent" });
    },
    [data.customers, pushFilter],
  );

  const onEvent = useCallback(
    (ev: ChatStreamEvent): void => {
      const receipt = parseReceipt(ev);
      if (receipt) applyReceipt(receipt);
    },
    [applyReceipt],
  );

  // Il contesto viaggia in uscita col messaggio: Bea sa periodo, filtri e
  // clienti a video senza rileggere tutto con un tool.
  const ctxRef = useRef<{ rows: CustomerRow[]; filter: CustomersFilter; email: string | null }>({
    rows: data.customers,
    filter,
    email: selectedEmail,
  });
  ctxRef.current = { rows: data.customers, filter, email: selectedEmail };

  const selectionContext = useCallback((): string => {
    const { rows, filter: f, email } = ctxRef.current;
    const chips = filterChips(f);
    return [
      `Pannello Clienti: periodo ${f.from} → ${f.to}, ${rows.length} clienti a video${
        chips.length ? ` (filtri: ${chips.join(", ")})` : ""
      }.`,
      f.spec ? `Spec attiva: ${JSON.stringify(f.spec)}.` : "",
      rows.length ? `Primi: ${rows.slice(0, 10).map((c) => c.email).join(", ")}.` : "",
      email ? `Scheda aperta: ${email}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, []);

  const channel = (hideHeader: boolean) => (
    <AgentChannel
      agentId="customers"
      {...CHANNELS.customers}
      interactive
      hideHeader={hideHeader}
      onEvent={onEvent}
      selectionContext={selectionContext}
    />
  );

  const agent = agentNameOf("customers");

  return (
    <CustomersPanelContext.Provider value={applyReceipt}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <CustomersView
            data={data}
            filter={filter}
            onFilterChange={pushFilter}
            loading={pending}
            selectedEmail={selectedEmail}
            onSelectEmail={setSelectedEmail}
            tab={tab}
            onTabChange={setTab}
          />
        </div>
        <aside className="hidden min-h-0 w-[420px] shrink-0 flex-col border-l border-[var(--color-line)] lg:flex">
          {channel(false)}
        </aside>
        <MobileChatOverlay
          label={agent}
          icon={<AgentFace seed="customers" label={agent} size={36} />}
        >
          {channel(true)}
        </MobileChatOverlay>
      </div>
    </CustomersPanelContext.Provider>
  );
}
