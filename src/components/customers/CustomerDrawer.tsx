"use client";
// Guscio mobile della scheda cliente: bottom sheet con lo stesso contenuto.
// Su desktop la scheda vive al centro del pannello (CustomersView) — un drawer
// da destra coprirebbe la chat, e Bea deve vedere il cliente mentre lo apre.
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import type { CustomerRow } from "@/lib/customers";
import { CustomerDetail } from "./CustomerDetail";
import type { CustomerTab } from "./customers-filter";

export function CustomerDrawer({
  customer,
  range,
  onClose,
  tab,
  onTabChange,
}: {
  customer: CustomerRow | null;
  range: { from: string; to: string };
  onClose: () => void;
  tab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
}) {
  return (
    <Drawer open={Boolean(customer)} onClose={onClose} side="bottom">
      {customer && (
        <>
          <DrawerHeader
            eyebrow="Cliente"
            title={customer.name || customer.email}
            meta={customer.email}
            onClose={onClose}
            closeLabel="Chiudi"
          />
          <CustomerDetail
            customer={customer}
            range={range}
            tab={tab}
            onTabChange={onTabChange}
          />
        </>
      )}
    </Drawer>
  );
}
