"use client";
import {
  Building2,
  ExternalLink,
  CreditCard,
  Landmark,
  Percent,
  Receipt,
  School,
  User,
  Wallet,
} from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { PortalLink } from "./StatusBadges";
import { InfoRow } from "./drawer-primitives";
import { Section } from "./detail-section";
import {
  TeacherCardBlock,
  BankTransferBlock,
  VatOverrideSection,
  PaymentTotalSection,
  VatReliefSection,
} from "./OrderBlocks";
import type { OrderDetailHandlers } from "./OrderDetail";
import { agentName, formatEur } from "./format";

type Props = { order: OrderRow } & OrderDetailHandlers;

// Tab "Cliente": chi ha ordinato e da dove.
export function IdentityTab({ order }: { order: OrderRow }) {
  return (
    <>
      <Section title="Cliente" icon={User} tone="indigo">
        <InfoRow label="Nome" value={order.customerName || "—"} />
        <InfoRow label="Email" value={order.userEmail || "—"} />
        {order.customerPhone && <InfoRow label="Telefono" value={order.customerPhone} />}
        {order.customerAddress && (
          <InfoRow label="Indirizzo" value={order.customerAddress} />
        )}
        {/* Dati studente (portali scuola, feature 028). Mostrati se presenti. */}
        {order.studentName && <InfoRow label="Studente" value={order.studentName} />}
        {order.studentClass && <InfoRow label="Classe" value={order.studentClass} />}
      </Section>

      <FiscalSection order={order} />

      <Section title="Portale" icon={School} tone="indigo">
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

// Tab "Pagamento": quanto ha pagato e come.
export function MoneyTab({
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
      <Section title="Pagamento" icon={Wallet} tone="emerald">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--color-ink-muted)]">Totale</span>
          <span className="text-lg font-semibold tabular-nums">
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
        <Section title="IVA agevolata 4%" icon={Percent} tone="emerald">
          <VatReliefSection
            order={order}
            onValidated={onVatReliefValidated}
            onAmountSaved={onPaymentTotalSaved}
          />
        </Section>
      )}

      {order.paymentMethod === "teacher-card" && (
        <Section title="Carta del Docente" icon={CreditCard} tone="emerald">
          <TeacherCardBlock
            order={order}
            onAcquired={onTeacherCardAcquired}
            onResidualPaid={onResidualPaid}
          />
        </Section>
      )}

      {order.paymentMethod === "bank-transfer" && (
        <Section title="Bonifico" icon={Landmark} tone="emerald">
          <BankTransferBlock order={order} onPaid={onBankTransferPaid} />
        </Section>
      )}

      {/* Parte C1: override IVA per l'export Danea (non tocca Saleor). */}
      <Section title="IVA (Danea)" icon={Receipt} tone="emerald">
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
    <Section title="Dati fiscali" icon={Building2} tone="indigo">
      {order.companyName && <InfoRow label="Azienda" value={order.companyName} />}
      {order.fiscalCode && <InfoRow label="Cod. fiscale" value={mono(order.fiscalCode)} />}
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
