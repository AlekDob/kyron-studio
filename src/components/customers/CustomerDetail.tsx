"use client";
// Scheda cliente: quattro tab, stessa impalcatura della scheda ordine (tab
// colorati + Section). I dati della riga li abbiamo gia' dalla lista; ordini e
// comunicazioni arrivano quando la scheda si apre (server action).
import { useEffect, useState, type ComponentType } from "react";
import { ChevronLeft, Mail, ShoppingBag, StickyNote, User } from "lucide-react";
import { fetchCustomerAction } from "@/app/(authed)/clienti/actions";
import { Section, SectionIcon, type Tone } from "@/components/orders/detail-section";
import { InfoRow } from "@/components/orders/drawer-primitives";
import { OrderListRow } from "@/components/orders/OrderListRow";
import { agentName, formatDate, formatEur } from "@/components/orders/format";
import { SkeletonRows } from "@/components/ui";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import type { CustomerDetailResponse, CustomerRow } from "@/lib/customers";
import { CustomerComms } from "./CustomerComms";
import { CustomerNotes } from "./CustomerNotes";
import { CUSTOMER_TABS, type CustomerTab } from "./customers-filter";

const TAB_META: Record<
  CustomerTab,
  { label: string; icon: ComponentType<{ size?: number }>; tone: Tone }
> = {
  anagrafica: { label: "Anagrafica", icon: User, tone: "indigo" },
  ordini: { label: "Ordini", icon: ShoppingBag, tone: "emerald" },
  comunicazioni: { label: "Comunicazioni", icon: Mail, tone: "sky" },
  note: { label: "Note", icon: StickyNote, tone: "violet" },
};

interface Props {
  customer: CustomerRow;
  /** Periodo del pannello: la scheda mostra gli ordini dello stesso intervallo. */
  range: { from: string; to: string };
  onBack?: () => void;
  tab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
}

export function CustomerDetail({ customer, range, onBack, tab, onTabChange }: Props) {
  const [detail, setDetail] = useState<CustomerDetailResponse | null>(null);

  useEffect(() => {
    if (!onBack) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  useEffect(() => {
    let alive = true;
    setDetail(null);
    // Se il gateway non risponde la scheda resta viva: l'anagrafica c'e' gia'.
    fetchCustomerAction(customer.email, range)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setDetail({ customer, orders: [], comms: [], note: null }));
    return () => {
      alive = false;
    };
  }, [customer, range]);

  return (
    <Slide direction="right" offset={18} className="flex h-full min-h-0 flex-1 flex-col">
      {onBack && <BackBar customer={customer} onBack={onBack} />}

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as CustomerTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 px-6 pt-4">
          <TabsList variant="line" className="h-auto w-full justify-start gap-1">
            {CUSTOMER_TABS.map((k) => (
              <TabsTrigger key={k} value={k} className="flex-none gap-2 px-2.5 py-1.5">
                <SectionIcon icon={TAB_META[k].icon} tone={TAB_META[k].tone} size={24} />
                {TAB_META[k].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <TabsContent value="anagrafica" className="flex flex-col gap-6">
            <Section title="Contatti" icon={User} tone="indigo">
              <InfoRow label="Nome" value={customer.name || "—"} />
              <InfoRow label="Email" value={customer.email} />
              <InfoRow label="Telefono" value={customer.phone || "—"} />
              <InfoRow label="Indirizzo" value={customer.address || "—"} />
              <InfoRow label="Studente" value={customer.studentName || "—"} />
            </Section>
            <Section title="Dati fiscali" icon={StickyNote} tone="slate">
              <InfoRow label="Intestatario" value={customer.companyName || "—"} />
              <InfoRow label="Codice fiscale" value={customer.fiscalCode || "—"} />
              <InfoRow label="Partita IVA" value={customer.vatNumber || "—"} />
            </Section>
            <Section title="Acquisti" icon={ShoppingBag} tone="emerald">
              <InfoRow label="Ordini" value={customer.orders} />
              {customer.canceled > 0 && <InfoRow label="Annullati" value={customer.canceled} />}
              <InfoRow label="Speso" value={formatEur(customer.totalSpent)} />
              <InfoRow label="Primo ordine" value={formatDate(customer.firstOrder)} />
              <InfoRow label="Ultimo ordine" value={formatDate(customer.lastOrder)} />
              <InfoRow
                label="Portali"
                value={customer.portals.map((p) => p.name).join(", ") || "—"}
              />
              <InfoRow label="Agenti" value={customer.agents.map(agentName).join(", ") || "—"} />
            </Section>
          </TabsContent>

          <TabsContent value="ordini" className="flex flex-col gap-6">
            <Section title="Ordini del cliente" icon={ShoppingBag} tone="emerald">
              {!detail ? (
                <SkeletonRows rows={3} rowClassName="h-[62px]" label="Carico gli ordini" />
              ) : detail.orders.length === 0 ? (
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Nessun ordine nel periodo selezionato.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--color-line)]">
                  {detail.orders.map((o) => (
                    <li key={o.id}>
                      {/* Sola lettura: la scheda ordine sta nel modulo Ordini. */}
                      <OrderListRow order={o} onSelect={() => {}} />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </TabsContent>

          <TabsContent value="comunicazioni" className="flex flex-col gap-6">
            <Section title="Comunicazioni inviate" icon={Mail} tone="sky">
              {!detail ? (
                <SkeletonRows rows={3} rowClassName="h-[38px]" label="Carico le comunicazioni" />
              ) : (
                <CustomerComms comms={detail.comms} />
              )}
            </Section>
          </TabsContent>

          <TabsContent value="note" className="flex flex-col gap-6">
            <Section title="Note interne" icon={StickyNote} tone="violet">
              {!detail ? (
                <SkeletonRows rows={2} rowClassName="h-[38px]" label="Carico le note" />
              ) : (
                // key = email: cambiando cliente il campo riparte pulito.
                <CustomerNotes key={customer.email} email={customer.email} note={detail.note} />
              )}
            </Section>
          </TabsContent>
        </div>
      </Tabs>
    </Slide>
  );
}

function BackBar({ customer, onBack }: { customer: CustomerRow; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-line)] px-5 py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
      >
        <ChevronLeft size={16} />
        Clienti
      </button>
      <span className="text-[var(--color-line-strong)]">/</span>
      <p className="text-base font-semibold">{customer.name || customer.email}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">
        {customer.orders} {customer.orders === 1 ? "ordine" : "ordini"} ·{" "}
        {formatEur(customer.totalSpent)}
      </p>
    </div>
  );
}
