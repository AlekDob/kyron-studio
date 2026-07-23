"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { EditableLines } from "./EditableLines";
import { StatusBadges, PortalLink } from "./StatusBadges";
import { Section, InfoRow } from "./drawer-primitives";
import {
  StatusSelector,
  TeacherCardBlock,
  BankTransferBlock,
  NoteSection,
  VatOverrideSection,
  PaymentTotalSection,
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
}

// Drawer dettaglio ordine. Desktop: scivola da DESTRA. Mobile: bottom sheet.
// Riusa il pattern animato di AnnotationsDrawer (transform inline + media query
// inietta il translateX per desktop, non esprimibile inline in Tailwind v4).
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
}: OrderDrawerProps) {
  // render = presenza nel DOM; show = posizione "aperto". Lo sfasamento di un
  // frame tra i due fa partire l'animazione di entrata (Mac e iPhone).
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState<OrderRow | null>(null);

  useEffect(() => {
    if (order) {
      setCurrent(order);
      setRender(true);
      return;
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 320); // attende l'uscita
    return () => clearTimeout(t);
  }, [order]);

  // Animazione di ENTRATA: monta a riposo (show=false), poi al frame successivo
  // (doppio rAF, affidabile su iOS Safari) passa ad aperto → il transform anima.
  useEffect(() => {
    if (!render) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShow(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [render]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (render) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [render, onClose]);

  if (!render || !current) return null;

  return (
    <div
      aria-hidden={!show}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: show ? "auto" : "none" }}
    >
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: show ? 1 : 0 }}
      />
      <aside
        role="dialog"
        aria-label={`Ordine ${current.number}`}
        className="absolute flex flex-col bg-[var(--color-paper)] shadow-2xl
                   inset-x-0 bottom-0 rounded-t-2xl
                   max-h-[calc(100dvh-env(safe-area-inset-top)-3rem)]
                   lg:inset-y-4 lg:right-4 lg:left-auto lg:inset-x-auto
                   lg:w-[440px] lg:max-h-none lg:rounded-2xl
                   lg:border lg:border-[var(--color-line)]"
        style={{
          transform: show ? "translateY(0)" : "translateY(100%)",
          transition: "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        data-order-drawer
      >
        <DrawerTransform open={show} />
        <DrawerHeader order={current} onClose={onClose} />
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-6">
          <Section title="Stato lavorazione">
            <StatusSelector order={current} onStatusChange={onStatusChange} />
          </Section>

          <Section title="Cliente">
            <InfoRow label="Nome" value={current.customerName || "—"} />
            <InfoRow label="Email" value={current.userEmail || "—"} />
            {current.customerPhone && (
              <InfoRow label="Telefono" value={current.customerPhone} />
            )}
            {current.customerAddress && (
              <InfoRow label="Indirizzo" value={current.customerAddress} />
            )}
            {/* Dati studente (portali scuola, feature 028). Mostrati se presenti. */}
            {current.studentName && (
              <InfoRow label="Studente" value={current.studentName} />
            )}
            {current.studentClass && (
              <InfoRow label="Classe" value={current.studentClass} />
            )}
          </Section>

          <FiscalSection order={current} />

          <Section title="Pagamento">
            <div className="flex items-center justify-between gap-3">
              <StatusBadges order={current} />
              <span className="font-medium tabular-nums">
                {/* Importo annotato prevale sul totale reale (allineamento Danea). */}
                {formatEur(current.paymentAmountOverride ?? current.totalGross)}
              </span>
            </div>
            {current.pspReference && <StripeLink order={current} />}
            {/* Allinea il totale (es. IVA 22% -> 4%): reale su bozza, annotazione su confermato. */}
            <PaymentTotalSection order={current} onSaved={onPaymentTotalSaved} />
          </Section>

          {current.paymentMethod === "teacher-card" && (
            <Section title="Carta del Docente">
              <TeacherCardBlock
                order={current}
                onAcquired={onTeacherCardAcquired}
                onResidualPaid={onResidualPaid}
              />
            </Section>
          )}

          {current.paymentMethod === "bank-transfer" && (
            <Section title="Bonifico">
              <BankTransferBlock order={current} onPaid={onBankTransferPaid} />
            </Section>
          )}

          <Section title="Portale">
            <InfoRow
              label="Scuola"
              value={
                <PortalLink name={current.portalName} url={current.portalUrl} />
              }
            />
            <InfoRow label="Agente" value={agentName(current.agent)} />
            <InfoRow
              label="Cod. mecc."
              value={current.codiceMeccanografico || "—"}
            />
          </Section>

          {/* Prodotti (Parte C2 + decision-019): EditableLines sceglie la modalita'
              — modifica reale (ordine bozza), cambio colore come annotazione (ordine
              confermato non spedito) o sola lettura (spedito/chiuso). */}
          <Section title="Prodotti">
            <EditableLines order={current} />
          </Section>

          {/* Parte C1: override IVA per l'export Danea (non tocca Saleor). */}
          <Section title="IVA (Danea)">
            <VatOverrideSection order={current} onSaved={onVatSaved} />
          </Section>

          {/* Parte B: nota libera interna + FootNotes Danea. */}
          <Section title="Note">
            <NoteSection order={current} onSaved={onNoteSaved} />
          </Section>
        </div>
      </aside>
    </div>
  );
}

function DrawerHeader({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  return (
    <header className="flex items-start justify-between border-b border-[var(--color-line)] px-6 py-5">
      <div>
        <p className="eyebrow">Ordine</p>
        <p className="mt-1 text-lg font-medium tabular-nums">#{order.number}</p>
        <p className="text-xs text-[var(--color-ink-muted)]">
          {formatDate(order.created)} · {formatTime(order.created)}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi"
        className="rounded-full p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
      >
        <X size={16} />
      </button>
    </header>
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

// Desktop: il drawer entra da DESTRA (translateX(100%) → 0);
// mobile resta translateY (bottom sheet, gestito inline).
function DrawerTransform({ open }: { open: boolean }) {
  return (
    <style>{`
      @media (min-width: 1024px) {
        [data-order-drawer] {
          transform: ${open ? "translateX(0)" : "translateX(100%)"} !important;
        }
      }
    `}</style>
  );
}
