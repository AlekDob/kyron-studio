"use client";
import { useEffect, type ReactNode } from "react";
import { ChevronLeft, ExternalLink } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { EditableLines } from "./EditableLines";
import { OrderComms } from "./OrderComms";
import { StatusBadges, PortalLink } from "./StatusBadges";
import { InfoRow } from "./drawer-primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
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

export interface OrderDetailHandlers {
  onStatusChange: (id: string, status: string) => void;
  onTeacherCardAcquired: (id: string) => void;
  onBankTransferPaid: (id: string) => void;
  onResidualPaid: (id: string) => void;
  onNoteSaved: (id: string, note: string) => void;
  onVatSaved: (id: string, vat: string) => void;
  onPaymentTotalSaved: (id: string, override: number | null) => void;
  onVatReliefValidated: (id: string, status: string) => void;
}

interface Props extends OrderDetailHandlers {
  order: OrderRow;
  /** Presente = scheda inline al centro: disegna la barra indietro e ascolta Esc. */
  onBack?: () => void;
}

// Contenuto della scheda ordine, senza guscio: al centro del pannello su
// desktop, dentro la bottom sheet su mobile. Il drawer non serve piu' perche'
// coprirebbe la chat, e l'agente deve vedere l'ordine mentre lo apre.
export function OrderDetail({ order, onBack, ...h }: Props) {
  // Esc chiudeva la scheda quando era un Drawer: inline va rimesso a mano.
  useEffect(() => {
    if (!onBack) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    // Entra da destra: la scheda prende il posto della lista, e il movimento
    // dice da dove arriva. Offset piccolo, e' un pannello non una slide.
    <Slide
      direction="right"
      offset={18}
      className="@container flex h-full min-h-0 flex-1 flex-col"
    >
      {onBack && <BackBar order={order} onBack={onBack} />}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        {/* Due colonne quando il pannello e' largo. Container query e non
            breakpoint di finestra: la larghezza cambia col resize della chat. */}
        <div className="flex flex-col gap-6 @3xl:flex-row @3xl:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <IdentityColumn order={order} {...h} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <MoneyColumn order={order} {...h} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {/* Prodotti (Parte C2 + decision-019): EditableLines sceglie la modalita'
              — modifica reale (ordine bozza), cambio colore come annotazione (ordine
              confermato non spedito) o sola lettura (spedito/chiuso). */}
          <Section title="Prodotti">
            <EditableLines order={order} />
          </Section>

          {/* Parte B: nota libera interna + FootNotes Danea. */}
          <Section title="Comunicazioni inviate">
            <OrderComms orderNumber={order.number} />
          </Section>

          <Section title="Note">
            <NoteSection order={order} onSaved={h.onNoteSaved} />
          </Section>
        </div>
      </div>
    </Slide>
  );
}

// Prova shadcn (solo Ordini): la sezione del dettaglio diventa una Card vera
// invece dell'eyebrow su sfondo piatto. Il `Section` condiviso in
// drawer-primitives NON si tocca: lo usano anche Portali e Catalogo.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="gap-3 border-border py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-4">{children}</CardContent>
    </Card>
  );
}

// Barra indietro della scheda inline: sostituisce la X del DrawerHeader.
function BackBar({ order, onBack }: { order: OrderRow; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-line)] px-5 py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
      >
        <ChevronLeft size={16} />
        Ordini
      </button>
      <span className="text-[var(--color-line-strong)]">/</span>
      <p className="font-medium">#{order.number}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">
        {formatDate(order.created)} · {formatTime(order.created)}
      </p>
    </div>
  );
}

// Colonna sinistra: chi ha ordinato e da dove.
function IdentityColumn({ order, onStatusChange }: Props) {
  return (
    <>
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
        {order.studentName && <InfoRow label="Studente" value={order.studentName} />}
        {order.studentClass && <InfoRow label="Classe" value={order.studentClass} />}
      </Section>

      <FiscalSection order={order} />

      <Section title="Portale">
        <InfoRow
          label="Scuola"
          value={<PortalLink name={order.portalName} url={order.portalUrl} />}
        />
        <InfoRow label="Agente" value={agentName(order.agent)} />
        <InfoRow label="Cod. mecc." value={order.codiceMeccanografico || "—"} />
      </Section>
    </>
  );
}

// Colonna destra: quanto ha pagato e come.
function MoneyColumn({
  order,
  onTeacherCardAcquired,
  onBankTransferPaid,
  onResidualPaid,
  onVatSaved,
  onPaymentTotalSaved,
  onVatReliefValidated,
}: Props) {
  return (
    <>
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

      {/* Parte C1: override IVA per l'export Danea (non tocca Saleor). */}
      <Section title="IVA (Danea)">
        <VatOverrideSection order={order} onSaved={onVatSaved} />
      </Section>
    </>
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
      {order.companyName && <InfoRow label="Azienda" value={order.companyName} />}
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
