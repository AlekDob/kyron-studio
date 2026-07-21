"use client";
import { useState } from "react";
import type { OrderRow } from "@/lib/gateway";
import { cn } from "@/lib/cn";
import {
  updateOrderStatusAction,
  markTeacherCardAcquiredAction,
  markBankTransferPaidAction,
  markTeacherCardResidualPaidAction,
  updateOrderNoteAction,
  updateOrderVatAction,
} from "@/app/(authed)/orders/actions";
import { formatEur, WORKFLOW_STATUSES } from "./format";
import { InfoRow, ActionButton, FeedbackNote } from "./drawer-primitives";

// Selettore stato lavorazione: bottoni segmentati. Al click salva via server
// action, aggiorna ottimisticamente (onStatusChange) e mostra feedback (incluso
// se e' partita la mail "spedito" al cliente).
export function StatusSelector({
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
      <FeedbackNote note={note} />
    </div>
  );
}

// Brain: decision-019 — blocco Carta del Docente: importo buono + azione
// "acquisita". Per i pagamenti misti mostra anche il residuo: se il residuo e' via
// bonifico (tranche 2), dopo l'acquisizione espone "Residuo bonifico incassato".
export function TeacherCardBlock({
  order,
  onAcquired,
  onResidualPaid,
}: {
  order: OrderRow;
  onAcquired: (id: string) => void;
  onResidualPaid: (id: string) => void;
}) {
  const [acquired, setAcquired] = useState(order.teacherCardAcquired);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const residualBank = order.residualMethod === "bank-transfer";

  async function acquire() {
    if (acquired || saving) return;
    setSaving(true);
    setNote("");
    try {
      const res = await markTeacherCardAcquiredAction(order.id);
      setAcquired(true);
      onAcquired(order.id);
      setNote(res.emailed ? "Buono acquisito. Email di conferma inviata al cliente." : "Buono acquisito.");
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
      {order.residualAmount != null && order.residualAmount > 0 && (
        <InfoRow
          label={residualBank ? "Residuo (bonifico)" : "Residuo (carta)"}
          value={<span className="tabular-nums">{formatEur(order.residualAmount)}</span>}
        />
      )}
      {acquired ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Buono acquisito sul portale del Ministero.
          {!residualBank && " Ordine confermato."}
        </p>
      ) : (
        <ActionButton label="Carta del docente acquisita" saving={saving} onClick={acquire} />
      )}
      {/* Pagamento misto: tranche 2. Il residuo bonifico si incassa dopo il buono. */}
      {acquired && residualBank && (
        <ResidualBankTransferAction order={order} onResidualPaid={onResidualPaid} />
      )}
      <FeedbackNote note={note} />
    </div>
  );
}

// Azione "Residuo bonifico incassato" (pagamento misto tranche 2): marca l'ordine
// pagato quando buono + residuo coprono il totale.
function ResidualBankTransferAction({
  order,
  onResidualPaid,
}: {
  order: OrderRow;
  onResidualPaid: (id: string) => void;
}) {
  const alreadyPaid = order.residualPaid || order.paymentStatus === "FULLY_CHARGED";
  const [paid, setPaid] = useState(alreadyPaid);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  async function confirm() {
    if (paid || saving) return;
    setSaving(true);
    setNote("");
    try {
      const res = await markTeacherCardResidualPaidAction(order.id);
      setPaid(true);
      onResidualPaid(order.id);
      setNote(res.emailed ? "Residuo incassato. Email di conferma inviata." : "Residuo incassato.");
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  if (paid) {
    return <p className="text-sm text-[var(--color-ink-soft)]">Residuo bonifico incassato. Ordine saldato.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <ActionButton label="Residuo bonifico incassato" saving={saving} onClick={confirm} />
      <FeedbackNote note={note} />
    </div>
  );
}

// Brain: decision-019 — blocco Bonifico puro: azione "Bonifico pagato". Marca
// l'ordine pagato in Saleor (FULLY_CHARGED) + mail "bonifico ricevuto".
export function BankTransferBlock({
  order,
  onPaid,
}: {
  order: OrderRow;
  onPaid: (id: string) => void;
}) {
  const alreadyPaid = order.bankTransferPaid || order.paymentStatus === "FULLY_CHARGED";
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
      setNote(res.emailed ? "Bonifico segnato pagato. Email di conferma inviata al cliente." : "Bonifico segnato pagato.");
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {paid ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Bonifico incassato. Ordine segnato come pagato.</p>
      ) : (
        <ActionButton label="Bonifico pagato" saving={saving} onClick={confirm} />
      )}
      <FeedbackNote note={note} />
    </div>
  );
}

// Nota libera dell'operatore (Parte B): interno Studio + FootNotes export Danea.
// onSaved propaga il valore a OrdersView cosi' resta visibile riaprendo il drawer
// (senza ricaricare la pagina).
export function NoteSection({
  order,
  onSaved,
}: {
  order: OrderRow;
  onSaved: (id: string, note: string) => void;
}) {
  const [value, setValue] = useState(order.note ?? "");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const dirty = value.trim() !== (order.note ?? "").trim();

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setNote("");
    try {
      const trimmed = value.trim();
      await updateOrderNoteAction(order.id, trimmed);
      onSaved(order.id, trimmed);
      setNote("Nota salvata.");
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Annotazioni sull'ordine (es. cambio colore concordato, IVA 4%)…"
        className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--color-line-strong)]"
      />
      <div className="flex items-center gap-3">
        <ActionButton label="Salva nota" saving={saving} onClick={save} />
        <FeedbackNote note={note} />
      </div>
    </div>
  );
}

// Aliquote IVA selezionabili per l'override Danea (Parte C1). "" = predefinita.
const VAT_OPTIONS = [
  { value: "", label: "Predefinita" },
  { value: "4", label: "4%" },
  { value: "10", label: "10%" },
  { value: "22", label: "22%" },
];

// Override aliquota IVA a livello ordine (Parte C1): annotazione letta dall'export
// Danea, non tocca Saleor. Utile per correzioni fiscali (es. IVA agevolata 4%).
// onSaved propaga il valore a OrdersView (persiste alla riapertura del drawer).
export function VatOverrideSection({
  order,
  onSaved,
}: {
  order: OrderRow;
  onSaved: (id: string, vat: string) => void;
}) {
  const [value, setValue] = useState(order.vatOverride ?? "");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const dirty = value !== (order.vatOverride ?? "");

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setNote("");
    try {
      await updateOrderVatAction(order.id, value);
      onSaved(order.id, value);
      setNote(value ? `IVA forzata al ${value}% per Danea.` : "Override IVA rimosso.");
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--color-line-strong)]"
        >
          {VAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ActionButton label="Salva IVA" saving={saving} onClick={save} />
      </div>
      <FeedbackNote note={note} />
    </div>
  );
}
