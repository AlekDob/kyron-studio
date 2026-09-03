"use client";
import { useMemo } from "react";
import type { CustomerRow, CustomersResponse } from "@/lib/customers";
import { SkeletonRows } from "@/components/ui";
import { useIsMobile } from "@/lib/use-is-mobile";
import { CustomersHeader } from "./CustomersHeader";
import { CustomersList } from "./CustomersList";
import { CustomersEmptyState } from "./CustomersEmptyState";
import { CustomerDetail } from "./CustomerDetail";
import { CustomerDrawer } from "./CustomerDrawer";
import type { CustomerTab, CustomersFilter } from "./customers-filter";

interface Props {
  data: CustomersResponse;
  filter: CustomersFilter;
  onFilterChange: (patch: Partial<CustomersFilter>) => void;
  /** Nuova lista in arrivo dal server dopo un cambio filtro. */
  loading?: boolean;
  /** Cliente aperto: l'identita' e' l'email, non esiste un id. */
  selectedEmail: string | null;
  onSelectEmail: (email: string | null) => void;
  tab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
}

export function CustomersView({
  data,
  filter,
  onFilterChange,
  loading = false,
  selectedEmail,
  onSelectEmail,
  tab,
  onTabChange,
}: Props) {
  const isMobile = useIsMobile();
  const selected = useMemo(
    () => data.customers.find((c) => c.email === selectedEmail) ?? null,
    [data.customers, selectedEmail],
  );
  const range = useMemo(() => ({ from: filter.from, to: filter.to }), [filter.from, filter.to]);

  // Desktop: la scheda prende la colonna centrale al posto della lista, la chat
  // resta a destra.
  if (selected && !isMobile) {
    return (
      <CustomerDetail
        customer={selected}
        range={range}
        onBack={() => onSelectEmail(null)}
        tab={tab}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CustomersHeader
        buckets={data.buckets}
        filter={filter}
        onChange={onFilterChange}
        portals={data.portals}
        agents={data.agents}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        {loading ? (
          <SkeletonRows rows={8} rowClassName="h-[66px]" label="Carico i clienti" />
        ) : data.customers.length === 0 ? (
          <CustomersEmptyState variant="no-data" />
        ) : (
          <CustomersList
            customers={data.customers}
            onSelect={(c: CustomerRow) => onSelectEmail(c.email)}
          />
        )}
      </div>

      <CustomerDrawer
        customer={selected}
        range={range}
        onClose={() => onSelectEmail(null)}
        tab={tab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
