"use client";

import {
  memo,
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { PortalsChat } from "./PortalsChat";
import { LivePortalCard } from "./LivePortalCard";
import { PortalsList } from "./PortalsList";
import { PortalDetail as PortalDetailView } from "./PortalDetail";
import { LayoutList } from "lucide-react";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import type { PortalSummary, PortalDetail } from "@/lib/gateway";

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

export type SidePanelMode =
  | { kind: "list" }
  | { kind: "creating" }
  | { kind: "detail"; portal: PortalDetail };

interface Props {
  initialPortals: PortalSummary[];
  initialDetailSlug?: string;
}

async function fetchPortals(): Promise<PortalSummary[]> {
  const res = await fetch("/api/portals", { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as PortalSummary[];
}

async function fetchPortalDetail(slug: string): Promise<PortalDetail | null> {
  const res = await fetch(`/api/portals/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as PortalDetail;
}

export function PortalsWorkspace({ initialPortals, initialDetailSlug }: Props): ReactElement {
  const [portals, setPortals] = useState<PortalSummary[]>(initialPortals);
  const [draft, setDraft] = useState<PortalDraft>({});
  const [panel, setPanel] = useState<SidePanelMode>({ kind: "list" });

  useEffect(() => {
    if (!initialDetailSlug) return;
    fetchPortalDetail(initialDetailSlug).then((portal) => {
      if (portal) setPanel({ kind: "detail", portal });
    });
  }, [initialDetailSlug]);

  useEffect(() => {
    if (!draft.saved) return;
    fetchPortals().then(setPortals);
    setPanel({ kind: "list" });
  }, [draft.saved]);

  const handleStartCreating = useCallback((): void => {
    setDraft({});
    setPanel({ kind: "creating" });
  }, []);

  const handleViewPortal = useCallback((portal: PortalDetail): void => {
    setPanel({ kind: "detail", portal });
  }, []);

  const handleSelectPortal = useCallback((slug: string): void => {
    fetchPortalDetail(slug).then((portal) => {
      if (portal) setPanel({ kind: "detail", portal });
    });
  }, []);

  const handleBackToList = useCallback((): void => {
    setPanel({ kind: "list" });
  }, []);

  const detailSlug = panel.kind === "detail" ? panel.portal.slug : null;
  const handleRefreshDetail = useCallback(async (): Promise<void> => {
    if (!detailSlug) return;
    const refreshed = await fetchPortalDetail(detailSlug);
    if (refreshed) setPanel({ kind: "detail", portal: refreshed });
    fetchPortals().then(setPortals);
  }, [detailSlug]);

  const isDetail = panel.kind === "detail";

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      <div className="flex-1 min-w-0 min-h-0 flex flex-col border-r border-[var(--color-line)] lg:h-full overflow-hidden">
        <header className="px-5 py-3 border-b border-[var(--color-line)] shrink-0">
          <p className="eyebrow">Agente · Portali</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Onboarding + gestione portali
          </p>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <PortalsChat
            onDraftUpdate={setDraft}
            onStartCreating={handleStartCreating}
            onViewPortal={handleViewPortal}
          />
        </div>
      </div>
      <aside
        className={`hidden lg:flex flex-col bg-[var(--color-paper-soft)] sticky top-0 h-full overflow-hidden transition-[width] duration-500 ease-out ${
          isDetail ? "w-[560px]" : "w-[420px]"
        }`}
      >
        <MemoSidePanel
          mode={panel}
          draft={draft}
          portals={portals}
          onBackToList={handleBackToList}
          onSelectPortal={handleSelectPortal}
          onDetailChanged={handleRefreshDetail}
        />
      </aside>
      <MobileChatOverlay
        label="Portali"
        icon={<LayoutList className="h-5 w-5" />}
        position="top-right"
      >
        <MemoSidePanel
          mode={panel}
          draft={draft}
          portals={portals}
          onBackToList={handleBackToList}
          onSelectPortal={handleSelectPortal}
          onDetailChanged={handleRefreshDetail}
        />
      </MobileChatOverlay>
    </div>
  );
}

const MemoSidePanel = memo(SidePanel);

function SidePanel({
  mode,
  draft,
  portals,
  onBackToList,
  onSelectPortal,
  onDetailChanged,
}: {
  mode: SidePanelMode;
  draft: PortalDraft;
  portals: PortalSummary[];
  onBackToList: () => void;
  onSelectPortal: (slug: string) => void;
  onDetailChanged?: () => void;
}) {
  if (mode.kind === "creating") {
    return (
      <>
        <header className="px-5 py-3 border-b border-[var(--color-line)] flex items-center justify-between">
          <div>
            <p className="eyebrow">Nuovo portale</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              {draft.nome ?? "In attesa dei dati..."}
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToList}
            className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            Lista
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <LivePortalCard draft={draft} />
        </div>
      </>
    );
  }

  if (mode.kind === "detail") {
    const p = mode.portal;
    return (
      <>
        <header className="px-5 py-3 border-b border-[var(--color-line)] flex items-center justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Dettaglio</p>
            <p className="text-sm font-medium text-[var(--color-ink)] mt-0.5 truncate">
              {p.nome}
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToList}
            className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] shrink-0 ml-3"
          >
            Lista
          </button>
        </header>
        <div
          key={p.slug}
          className="flex-1 overflow-y-auto px-5 py-4 motion-safe:animate-[fadeIn_280ms_ease-out]"
        >
          <PortalDetailView portal={p} onChanged={onDetailChanged} />
        </div>
      </>
    );
  }

  return (
    <>
      <header className="px-5 py-3 border-b border-[var(--color-line)]">
        <p className="eyebrow">Portali</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1">
          {portals.length} configurat{portals.length !== 1 ? "i" : "o"}
        </p>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <PortalsList portals={portals} onSelect={onSelectPortal} />
      </div>
    </>
  );
}

