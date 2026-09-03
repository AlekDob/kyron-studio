"use client";
import { useMemo } from "react";
import type { RequestRow } from "@/lib/requests";
import { SkeletonRows } from "@/components/ui";
import { useIsMobile } from "@/lib/use-is-mobile";
import { RequestsHeader } from "./RequestsHeader";
import { RequestsList } from "./RequestsList";
import { RequestsEmptyState } from "./RequestsEmptyState";
import { RequestDetail } from "./RequestDetail";
import { RequestDrawer } from "./RequestDrawer";
import { filterRequests, groupTotals, type RequestsFilter } from "./requests-filter";

interface Props {
  /** Tutte le richieste del progetto: i chip filtrano qui, senza tornare in rete. */
  requests: RequestRow[];
  filter: RequestsFilter;
  onFilterChange: (patch: Partial<RequestsFilter>) => void;
  userEmail: string;
  loading?: boolean;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}

export function RequestsView({
  requests,
  filter,
  onFilterChange,
  userEmail,
  loading = false,
  selectedId,
  onSelectId,
}: Props) {
  const isMobile = useIsMobile();
  const visible = useMemo(
    () => filterRequests(requests, filter, userEmail),
    [requests, filter, userEmail],
  );
  // I numeri delle tile si contano PRIMA dei chip: cliccando "Da fare" il
  // collega deve continuare a vedere quante sono le altre.
  const totals = useMemo(() => groupTotals(requests), [requests]);
  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) ?? null,
    [requests, selectedId],
  );

  // Desktop: la scheda prende la colonna centrale al posto della lista, la chat
  // resta a destra.
  if (selected && !isMobile) {
    return <RequestDetail request={selected} onBack={() => onSelectId(null)} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <RequestsHeader totals={totals} filter={filter} onChange={onFilterChange} />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        {loading ? (
          <SkeletonRows rows={8} rowClassName="h-[66px]" label="Carico le richieste" />
        ) : visible.length === 0 ? (
          <RequestsEmptyState variant="no-data" />
        ) : (
          <RequestsList requests={visible} onSelect={(r: RequestRow) => onSelectId(r.id)} />
        )}
      </div>

      <RequestDrawer request={selected} onClose={() => onSelectId(null)} />
    </div>
  );
}
