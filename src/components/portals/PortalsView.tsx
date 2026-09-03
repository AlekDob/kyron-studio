"use client";
import { useMemo } from "react";
import { SkeletonRows } from "@/components/ui";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { PortalSummary } from "@/lib/gateway";
import { PortalsHeader } from "./PortalsHeader";
import { PortalsList } from "./PortalsList";
import { PortalsEmptyState } from "./PortalsEmptyState";
import { PortalCard, PortalCardDrawer } from "./PortalCard";
import type { PortalActionHandlers } from "./PortalActions";
import { groupByStatus, type PortalsData, type PortalsFilter, type PortalTab } from "./portals-filter";

interface Props extends PortalActionHandlers {
  data: PortalsData;
  /** Filtro condiviso: lo muove l'umano dalla testata, lo scrive Livia dalla chat. */
  filter: PortalsFilter;
  onFilterChange: (patch: Partial<PortalsFilter>) => void;
  /** Nuova lista in arrivo dal server dopo un cambio filtro. */
  loading?: boolean;
  /** Portale aperto. Vive nel workspace: lo apre anche l'agente. */
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  tab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  onChanged: () => void;
}

export function PortalsView({
  data,
  filter,
  onFilterChange,
  loading = false,
  selectedSlug,
  onSelectSlug,
  tab,
  onTabChange,
  onChanged,
  ...actions
}: Props) {
  const isMobile = useIsMobile();

  // Le righe arrivano gia' filtrate e ordinate dalla page: qui si raggruppa.
  const groups = useMemo(() => groupByStatus(data.portals), [data.portals]);

  // Il nome serve solo a riempire la testata mentre la scheda carica.
  const nome = useMemo(
    () => data.portals.find((p) => p.slug === selectedSlug)?.nome ?? "",
    [data.portals, selectedSlug],
  );

  const card = {
    nome,
    tab,
    onTabChange,
    onBack: () => onSelectSlug(null),
    onListChanged: onChanged,
    ...actions,
  };

  // Desktop: la scheda prende tutta la colonna centrale al posto della lista.
  // La chat resta a destra, cosi' Livia vede il portale mentre e' aperto.
  if (selectedSlug && !isMobile) {
    return <PortalCard slug={selectedSlug} {...card} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Testata ferma: tile e filtri restano a vista mentre la lista scorre. */}
      <PortalsHeader
        buckets={data.buckets}
        filter={filter}
        onChange={onFilterChange}
        cities={data.cities}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        {loading ? (
          <SkeletonRows rows={8} rowClassName="h-[66px]" label="Carico i portali" />
        ) : data.portals.length === 0 ? (
          <PortalsEmptyState variant="no-data" />
        ) : (
          <PortalsList groups={groups} onSelect={(p: PortalSummary) => onSelectSlug(p.slug)} />
        )}
      </div>

      {/* Mobile: la stessa scheda dentro una bottom sheet. */}
      <PortalCardDrawer slug={isMobile ? selectedSlug : null} {...card} />
    </div>
  );
}
