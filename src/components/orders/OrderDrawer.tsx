"use client";
import { ExternalLink } from "lucide-react";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { OrderRow } from "@/lib/gateway";
import { EditableLines } from "./EditableLines";
import { OrderComms } from "./OrderComms";
import { StatusBadges, PortalLink } from "./StatusBadges";
import { Section, InfoRow } from "./drawer-primitives";
import {
  StatusSelector,
  TeacherCardBlock,
  BankTransferBlock,
  NoteSection,
  VatOverrideSection,
  PaymentTotalSection,
  VatReliefSection,
} from "./OrderBlocks";
import { agentName, formatDate, formatEur, formatTime } from "./format";

interface OrderDrawerProps {
  order: OrderRow | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onTeacherCardAcquired: (id: string) => void;
  onBankTransferPaid: (id: string) => void;
  onResidualPaid: (id: string) => void;
  onNoteSaved: (id: string, note: string) => void;
  onVatSaved: (id: string, vat: string) => void;
  onPaymentTotalSaved: (id: string, override: number | null) => void;
  onVatReliefValidated: (id: string, status: string) => void;
}

// Drawer dettaglio ordine: bottom sheet su mobile, da destra su desktop.
// Il Drawer di studio-core porta animazione, Esc, scroll-lock e cache dei figli
// durante l'uscita: qui non serve piu' nessuno stato locale.
export function OrderDrawer({
  order,
  onClose,
  onStatusChange,
  onTeacherCardAcquired,
  onBankTransferPaid,
  onResidualPaid,
  onNoteSaved,
  onVatSaved,
  onPaymentTotalSaved,
  onVatReliefValidated,
}: OrderDrawerProps) {
  const isMobile = useIsMobile();

  return (
    <Drawer
      open={Boolean(order)}
      onClose={onClose}
      side={isMobile ? "bottom" : "right"}
      width={440}
    >
      {order && (
        <>
          <DrawerHeader
            eyebrow="Ordine"
            title={`#${order.number}`}
            meta={`${formatDate(order.created)} · ${formatTime(order.created)}`}
            onClose={onClose}
            closeLabel="Chiudi"
          />
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-6">
            <Section title="Stato lavorazione">
              <StatusSelector order={order} onStatusChange={onStatusChange} />
            </Section>

            <Section title="Cliente">
              <InfoRow label="Nome" value={order.customerName || "—"} />
              <InfoRow label="Email" value={order.userEmail || "—"} />
              {order.customerPhone && (
                <InfoRow label="Telefono" value={order.customerPhone} />
              )}
              {order.customerAddress && (
                <InfoRow label="Indirizzo" value={order.customerAddress} />
              )}
              {/* Dati studente (portali scuola, feature 028). Mostrati se presenti. */}
              {order.studentName && (
                <InfoRow label="Studente" value={order.studentName} />
              )}
              {order.studentClass && (
                <InfoRow label="Classe" value={order.studentClass} />
              )}
            </Section>

            <FiscalSection order={order} />

            <Section title="Pagamento">
              <div className="flex items-center justify-between gap-3">
                <StatusBadges order={order} />
                <span className="font-medium tabular-nums">
                  {/* Importo annotato prevale sul totale reale (allineamento Danea). */}
                  {formatEur(order.paymentAmountOverride ?? order.totalGross)}
                </span>
              </div>
              {order.pspReference && <StripeLink order={order} />}
              {/* Allinea il totale (es. IVA 22% -> 4%): reale su bozza, annotazione su confermato. */}
              <PaymentTotalSection order={order} onSaved={onPaymentTotalSaved} />
            </Section>

            {/* Feature 002: richiesta IVA agevolata 4% dal checkout, da validare. */}
            {order.vatReliefStatus && (
              <Section title="IVA agevolata 4%">
                <VatReliefSection
                  order={order}
                  onValidated={onVatReliefValidated}
                  onAmountSaved={onPaymentTotalSaved}
                />
              </Section>
            )}

            {order.paymentMethod === "teacher-card" && (
              <Section title="Carta del Docente">
                <TeacherCardBlock
                  order={order}
                  onAcquired={onTeacherCardAcquired}
                  onResidualPaid={onResidualPaid}
                />
              </Section>
            )}

            {order.paymentMethod === "bank-transfer" && (
              <Section title="Bonifico">
                <BankTransferBlock order={order} onPaid={onBankTransferPaid} />
              </Section>
            )}

            <Section title="Portale">
              <InfoRow
                label="Scuola"
                value={
                  <PortalLink name={order.portalName} url={order.portalUrl} />
                }
              />
              <InfoRow label="Agente" value={agentName(order.agent)} />
              <InfoRow
                label="Cod. mecc."
                value={order.codiceMeccanografico || "—"}
              />
            </Section>

            {/* Prodotti (Parte C2 + decision-019): EditableLines sceglie la modalita'
                — modifica reale (ordine bozza), cambio colore come annotazione (ordine
                confermato non spedito) o sola lettura (spedito/chiuso). */}
            <Section title="Prodotti">
              <EditableLines order={order} />
            </Section>

            {/* Parte C1: override IVA per l'export Danea (non tocca Saleor). */}
            <Section title="IVA (Danea)">
              <VatOverrideSection order={order} onSaved={onVatSaved} />
            </Section>

            {/* Parte B: nota libera interna + FootNotes Danea. */}
            <Section title="Comunicazioni inviate">
              <OrderComms orderNumber={order.number} />
            </Section>

            <Section title="Note">
              <NoteSection order={order} onSaved={onNoteSaved} />
            </Section>
          </div>
        </>
      )}
    </Drawer>
  );
}

// Dati fiscali (CF / P.IVA / SDI / azienda). Renderizzata solo se c'e' almeno
// un valore. Codici in mono per leggibilita'.
function FiscalSection({ order }: { order: OrderRow }) {
  const has = order.fiscalCode || order.vatNumber || order.sdiCode || order.companyName;
  if (!has) return null;
  const mono = (v: string) => <span className="font-mono text-xs">{v}</span>;
  return (
    <Section title="Dati fiscali">
      {order.companyName && (
        <InfoRow label="Azienda" value={order.companyName} />
      )}
      {order.fiscalCode && (
        <InfoRow label="Cod. fiscale" value={mono(order.fiscalCode)} />
      )}
      {order.vatNumber && <InfoRow label="P. IVA" value={mono(order.vatNumber)} />}
      {order.sdiCode && <InfoRow label="SDI" value={mono(order.sdiCode)} />}
    </Section>
  );
}

function StripeLink({ order }: { order: OrderRow }) {
  return (
    <a
      href={order.stripeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2 text-sm hover:border-[var(--color-line-strong)]"
    >
      <span className="font-medium">Apri su Stripe</span>
      <span className="font-mono text-xs text-[var(--color-ink-muted)]">
        {order.pspReference}
      </span>
      <ExternalLink size={14} className="text-[var(--color-ink-muted)]" />
    </a>
  );
}
