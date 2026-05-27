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

  const isDetail = panel.kind === "detail";

  return (
    <div
      className={`grid grid-cols-1 gap-0 min-h-screen ${
        isDetail
          ? "lg:grid-cols-[360px_1fr]"
          : "lg:grid-cols-[1fr_420px]"
      }`}
    >
      <div
        className={`flex flex-col border-r border-[var(--color-line)] h-screen overflow-hidden ${
          isDetail ? "lg:order-first" : ""
        }`}
      >
        <header className="px-5 py-3 border-b border-[var(--color-line)]">
          <p className="eyebrow">Agente · Portali</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Onboarding + gestione portali
          </p>
        </header>
        <PortalsChat
          onDraftUpdate={setDraft}
          onStartCreating={handleStartCreating}
          onViewPortal={handleViewPortal}
        />
      </div>
      <aside className="hidden lg:flex flex-col bg-[var(--color-paper-soft)] sticky top-0 h-screen overflow-hidden">
        <MemoSidePanel
          mode={panel}
          draft={draft}
          portals={portals}
          onBackToList={handleBackToList}
          onSelectPortal={handleSelectPortal}
        />
      </aside>
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
}: {
  mode: SidePanelMode;
  draft: PortalDraft;
  portals: PortalSummary[];
  onBackToList: () => void;
  onSelectPortal: (slug: string) => void;
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
          <div>
            <p className="eyebrow">Dettaglio</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              {p.nome}
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
          <DetailView portal={p} />
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

function DetailView({ portal }: { portal: PortalDetail }) {
  const EURO = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });
  const addr = portal.schoolAddress as Record<string, string>;

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
        <p className="font-medium text-[var(--color-ink)] mb-1">{portal.nome}</p>
        <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">
          {portal.slug}
        </p>
        <p className="text-[var(--color-ink-soft)] mt-1">
          {addr.streetAddress1}, {addr.postalCode} {addr.city} (
          {addr.countryArea})
        </p>
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
        <p className="text-[10px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
          Catalogo ({portal.catalog.visibleSlugs.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {portal.catalog.visibleSlugs.map((s) => (
            <span
              key={s}
              className="px-1.5 py-0.5 rounded bg-[var(--color-paper-muted)] text-[10px] text-[var(--color-ink-soft)]"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      {portal.bundles.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
          <p className="text-[10px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
            Kit ({portal.bundles.length})
          </p>
          {portal.bundles.map((b) => (
            <div key={b.slug} className="flex justify-between py-1">
              <span className="text-[var(--color-ink)]">{b.name}</span>
              <span className="tabular-nums text-[var(--color-ink)]">
                {EURO.format(b.finalPriceEur)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
