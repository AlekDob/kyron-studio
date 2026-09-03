"use client";

// Workspace Portali: la lista vera a sinistra, Livia a destra. Stesso guscio di
// Ordini e Prodotti. Il filtro vive nell'URL: lo muovono i chip dell'operatore
// e le ricevute di Livia, e in chat resta solo una riga, mai una lista.
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
import { LivePortalCard } from "./LivePortalCard";
import { PortalsPanelContext } from "./portals-panel-context";
import { PortalsView } from "./PortalsView";
import { usePortalDraftSync } from "./use-portal-draft-sync";
import {
  filterChips,
  portalsReceiptSchema,
  toSearchParams,
  type PortalsData,
  type PortalsFilter,
  type PortalsReceiptProps,
  type PortalTab,
} from "./portals-filter";

// La bozza in costruzione: la riempie `usePortalDraftSync` guardando lo stream.
export interface PortalDraft {
  nome?: string;
  slug?: string;
  sitoUfficiale?: string;
  codiceMeccanografico?: string;
  via?: string;
  cap?: string;
  city?: string;
  provincia?: string;
  selectedProducts?: string[];
  productDiscounts?: Array<{ slug: string; kind: "percent" | "eur"; value: number }>;
  bundles?: Array<{ name: string; priceEur: number; components: string[] }>;
  shipToSchool?: boolean;
  logoUploaded?: boolean;
  logoFilename?: string;
  saved?: boolean;
}

// Dopo una scrittura di Livia la lista in pagina e' vecchia: si rilegge dal
// server (router.refresh), non si rifa' una fetch a mano.
const WRITE_TOOLS = [
  "save_pending_school",
  "set_portal_status",
  "update_portal",
  "delete_portal",
  "add_bundle_to_portal",
  "update_bundle",
  "remove_bundle",
  "update_catalog",
  "update_discounts",
  "apply_to_saleor",
];

// La ricevuta e' l'unica fonte: stesso descriptor che la chat renderizza, letto
// qui per muovere il pannello.
function parseReceipt(ev: ChatStreamEvent): PortalsReceiptProps | null {
  if (ev.type !== "tool-result") return null;
  const d = extractGenerativeDescriptor(ev.result);
  if (!d || d.component !== "PortalsReceipt") return null;
  const parsed = portalsReceiptSchema.safeParse(d.props);
  return parsed.success ? parsed.data : null;
}

export function PortalsWorkspace({
  data,
  filter: serverFilter,
  initialSlug = null,
}: {
  data: PortalsData;
  /** Filtro risolto dall'URL: e' quello che il server ha gia' applicato. */
  filter: PortalsFilter;
  /** Scheda da aprire subito: arriva dal deep link `?detail=<slug>`. */
  initialSlug?: string | null;
}): ReactElement {
  const router = useRouter();
  // `pending` = la nuova lista e' in volo: al suo posto va lo skeleton.
  const [pending, startTransition] = useTransition();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  // Specchio locale del filtro: i chip si accendono subito. La verita' e' l'URL.
  const [filter, setFilter] = useState<PortalsFilter>(serverFilter);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  // Tab della scheda: sta qui perche' lo cambia anche Livia (`get_portal`).
  const [tab, setTab] = useState<PortalTab>("informazioni");
  const [draft, setDraft] = useState<PortalDraft>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => setFilter(serverFilter), [serverFilter]);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  // Portale salvato: la lista si rilegge e la card di bozza esce di scena.
  useEffect(() => {
    if (!draft.saved) return;
    setCreating(false);
    refresh();
  }, [draft.saved, refresh]);

  // Unico punto di scrittura del filtro: chip, tile e ricevuta dell'agente.
  const pushFilter = useCallback(
    (patch: Partial<PortalsFilter>) => {
      const next = { ...filterRef.current, ...patch };
      filterRef.current = next;
      setFilter(next);
      const params = toSearchParams(next);
      if (next.source === "agent") params.set("agente", "1");
      startTransition(() => router.push(`/portals?${params.toString()}`));
    },
    [router],
  );

  // Un punto solo: la chiama l'evento in arrivo e il click su una ricevuta
  // vecchia, cosi' riaprire un risultato di ieri fa la stessa cosa.
  const applyReceipt = useCallback(
    (receipt: PortalsReceiptProps): void => {
      if (receipt.kind === "portal") {
        if (receipt.tab) setTab(receipt.tab);
        if (receipt.refresh) refresh();
        setSelectedSlug(receipt.slug);
        return;
      }
      pushFilter({ ...receipt.filter, source: "agent" });
    },
    [pushFilter, refresh],
  );

  // La chat guida anche la creazione: la card di bozza vive nella colonna chat,
  // il pannello resta sulla lista finche' il portale non e' salvato.
  const draftSync = usePortalDraftSync(
    setDraft,
    useCallback(() => {
      setDraft({});
      setCreating(true);
    }, []),
    useCallback((portal) => setSelectedSlug(portal.slug), []),
  );

  const onEvent = useCallback(
    (ev: ChatStreamEvent): void => {
      draftSync.onEvent(ev);
      const receipt = parseReceipt(ev);
      if (receipt) {
        applyReceipt(receipt);
        return;
      }
      if (ev.type === "tool-result" && WRITE_TOOLS.includes(ev.tool)) refresh();
    },
    [applyReceipt, draftSync, refresh],
  );

  // Scritture dalla scheda: passano dal BFF e poi rileggono la lista.
  const changeStatus = useCallback(
    async (slug: string, status: string) => {
      await fetch(`/api/portals/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      refresh();
    },
    [refresh],
  );

  const deletePortal = useCallback(
    async (slug: string) => {
      await fetch(`/api/portals/${slug}`, { method: "DELETE" });
      setSelectedSlug(null);
      refresh();
    },
    [refresh],
  );

  // Su errore (es. slug esistente) rilancia: il messaggio lo mostra il modal.
  const duplicatePortal = useCallback(
    async (sourceSlug: string, body: { newSlug: string; newNome: string }) => {
      const res = await fetch(`/api/portals/${sourceSlug}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "duplicazione fallita");
      }
      // La copia e' una bozza da sistemare subito: si apre al posto della lista.
      setSelectedSlug(body.newSlug);
      refresh();
    },
    [refresh],
  );

  // Il contesto viaggia col messaggio: Livia sa filtri, portali a video e
  // scheda aperta senza rileggere tutto con un tool.
  const ctxRef = useRef({ data, filter, slug: selectedSlug });
  ctxRef.current = { data, filter, slug: selectedSlug };

  const selectionContext = useCallback((): string => {
    const { data: d, filter: f, slug } = ctxRef.current;
    const chips = filterChips(f);
    const open = slug ? d.portals.find((p) => p.slug === slug) : null;
    return [
      `Pannello Portali: ${d.portals.length} portali a video su ${d.buckets.total}${
        chips.length ? ` (filtri: ${chips.join(", ")})` : ""
      }.`,
      d.portals.length ? `Primi: ${d.portals.slice(0, 10).map((p) => p.nome).join(", ")}.` : "",
      open ? `Scheda aperta: "${open.nome}" (slug ${open.slug}).` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, []);

  // Stesso canale in due gusci: colonna a destra su desktop, bottom sheet
  // dietro la faccia di Livia su mobile. Il montaggio e' esclusivo.
  const channel = (hideHeader: boolean) => (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <AgentChannel
          agentId="portals"
          {...CHANNELS.portals}
          interactive
          hideHeader={hideHeader}
          onEvent={onEvent}
          onSubmission={draftSync.onSubmission}
          selectionContext={selectionContext}
        />
      </div>
      {/* Portale nuovo: la bozza cresce qui sotto la chat, dove Livia sta
          raccogliendo i dati. Il pannello non si muove finche' non e' salvata. */}
      {creating && (
        <div className="max-h-[45%] shrink-0 overflow-y-auto border-t border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3">
          <p className="eyebrow mb-2">Nuovo portale</p>
          <LivePortalCard draft={draft} />
        </div>
      )}
    </>
  );

  const agent = agentNameOf("portals");

  return (
    <PortalsPanelContext.Provider value={applyReceipt}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <PortalsView
            data={data}
            filter={filter}
            onFilterChange={pushFilter}
            loading={pending}
            selectedSlug={selectedSlug}
            onSelectSlug={setSelectedSlug}
            tab={tab}
            onTabChange={setTab}
            onChanged={refresh}
            onChangeStatus={changeStatus}
            onDelete={deletePortal}
            onDuplicate={duplicatePortal}
          />
        </div>
        <aside className="hidden min-h-0 w-[420px] shrink-0 flex-col border-l border-[var(--color-line)] lg:flex">
          {channel(false)}
        </aside>
        <MobileChatOverlay
          label={agent}
          icon={<AgentFace seed="portals" label={agent} size={36} />}
        >
          {channel(true)}
        </MobileChatOverlay>
      </div>
    </PortalsPanelContext.Provider>
  );
}
