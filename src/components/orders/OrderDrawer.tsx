"use client";
import { useEffect, useState, type ReactNode } from "react";
import { X, ExternalLink } from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { cn } from "@/lib/cn";
import {
  updateOrderStatusAction,
  markTeacherCardAcquiredAction,
  markBankTransferPaidAction,
} from "@/app/(authed)/orders/actions";
import { OrderLines } from "./OrderLines";
import { StatusBadges, PortalLink } from "./StatusBadges";
import {
  agentName,
  formatDate,
  formatEur,
  formatTime,
  WORKFLOW_STATUSES,
} from "./format";

interface OrderDrawerProps {
  order: OrderRow | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onTeacherCardAcquired: (id: string) => void;
  onBankTransferPaid: (id: string) => void;
}

// Drawer dettaglio ordine. Desktop: scivola da SINISTRA. Mobile: bottom sheet.
// Riusa il pattern animato di AnnotationsDrawer (transform inline + media query
// inietta il translateX per desktop, non esprimibile inline in Tailwind v4).
export function OrderDrawer({
  order,
  onClose,
  onStatusChange,
  onTeacherCardAcquired,
  onBankTransferPaid,
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
                {formatEur(current.totalGross)}
              </span>
            </div>
            {current.pspReference && <StripeLink order={current} />}
          </Section>

          {current.paymentMethod === "teacher-card" && (
            <Section title="Carta del Docente">
              <TeacherCardBlock
                order={current}
                onAcquired={onTeacherCardAcquired}
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

          <Section title="Prodotti">
            <OrderLines lines={current.lines} />
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

// Selettore stato lavorazione: bottoni segmentati. Al click salva via server
// action, aggiorna ottimisticamente (onStatusChange) e mostra feedback (incluso
// se e' partita la mail "spedito" al cliente).
function StatusSelector({
  order,
  onStatusChange,
}: {
  order: OrderRow;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");

  async function pick(status: string) {
    if (status === order.workflowStatus || saving) return;
    setSaving(status);
    setNote("");
    onStatusChange(order.id, status); // ottimistico
    try {
      const res = await updateOrderStatusAction(order.id, status);
      setNote(res.emailed ? "Email di spedizione inviata al cliente." : "Stato aggiornato.");
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
      onStatusChange(order.id, order.workflowStatus); // rollback
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {WORKFLOW_STATUSES.map((s) => {
          const active = order.workflowStatus === s.value;
          return (
            <button
              key={s.value}
              type="button"
              disabled={!!saving}
              onClick={() => pick(s.value)}
              className={cn(
                "rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                active
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-line)] bg-[var(--color-paper-soft)] text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)]",
              )}
            >
              {saving === s.value ? "…" : s.label}
            </button>
          );
        })}
      </div>
      {note && <p className="text-xs text-[var(--color-ink-muted)]">{note}</p>}
    </div>
  );
}

// Brain: decision-019 — blocco Carta del Docente: importo buono + azione
// "acquisita". Al click registra l'acquisizione (metadata) e manda la mail di
// conferma al cliente; aggiorna ottimisticamente il badge in lista (onAcquired).
function TeacherCardBlock({
  order,
  onAcquired,
}: {
  order: OrderRow;
  onAcquired: (id: string) => void;
}) {
  const [acquired, setAcquired] = useState(order.teacherCardAcquired);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  async function acquire() {
    if (acquired || saving) return;
    setSaving(true);
    setNote("");
    try {
      const res = await markTeacherCardAcquiredAction(order.id);
      setAcquired(true);
      onAcquired(order.id);
      setNote(
        res.emailed
          ? "Buono acquisito. Email di conferma inviata al cliente."
          : "Buono acquisito.",
      );
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {order.teacherCardAmount != null && (
        <InfoRow
          label="Importo buono"
          value={<span className="tabular-nums">{formatEur(order.teacherCardAmount)}</span>}
        />
      )}
      {acquired ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Buono acquisito sul portale del Ministero. Ordine confermato.
        </p>
      ) : (
        <button
          type="button"
          disabled={saving}
          onClick={acquire}
          className="rounded-[var(--radius-pill)] border border-[var(--color-ink)] bg-[var(--color-ink)] px-3 py-2 text-sm font-medium text-[var(--color-paper)] transition-opacity disabled:opacity-50"
        >
          {saving ? "Salvataggio…" : "Carta del docente acquisita"}
        </button>
      )}
      {note && <p className="text-xs text-[var(--color-ink-muted)]">{note}</p>}
    </div>
  );
}

// Brain: decision-019 — blocco Bonifico: azione "Bonifico pagato". Al click marca
// l'ordine pagato in Saleor (paymentStatus FULLY_CHARGED), manda la mail "bonifico
// ricevuto" e aggiorna ottimisticamente il badge in lista (onPaid).
function BankTransferBlock({
  order,
  onPaid,
}: {
  order: OrderRow;
  onPaid: (id: string) => void;
}) {
  const alreadyPaid =
    order.bankTransferPaid || order.paymentStatus === "FULLY_CHARGED";
  const [paid, setPaid] = useState(alreadyPaid);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  async function confirm() {
    if (paid || saving) return;
    setSaving(true);
    setNote("");
    try {
      const res = await markBankTransferPaidAction(order.id);
      setPaid(true);
      onPaid(order.id);
      setNote(
        res.emailed
          ? "Bonifico segnato pagato. Email di conferma inviata al cliente."
          : "Bonifico segnato pagato.",
      );
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {paid ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Bonifico incassato. Ordine segnato come pagato.
        </p>
      ) : (
        <button
          type="button"
          disabled={saving}
          onClick={confirm}
          className="rounded-[var(--radius-pill)] border border-[var(--color-ink)] bg-[var(--color-ink)] px-3 py-2 text-sm font-medium text-[var(--color-paper)] transition-opacity disabled:opacity-50"
        >
          {saving ? "Salvataggio…" : "Bonifico pagato"}
        </button>
      )}
      {note && <p className="text-xs text-[var(--color-ink-muted)]">{note}</p>}
    </div>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="shrink-0 text-[var(--color-ink-muted)]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
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
