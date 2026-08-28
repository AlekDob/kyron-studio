"use client";
import { useEffect, useRef, useState } from "react";
import type { OrderRow } from "@/lib/gateway";
import { cn } from "@/lib/cn";
import {
  updateOrderStatusAction,
  markTeacherCardAcquiredAction,
  markBankTransferPaidAction,
  markTeacherCardResidualPaidAction,
  updateOrderNoteAction,
  updateOrderVatAction,
  updateOrderPaymentTotalAction,
  validateVatReliefAction,
} from "@/app/(authed)/orders/actions";
import { formatEur, WORKFLOW_STATUSES } from "./format";
import { InfoRow, ActionButton, FeedbackNote } from "./drawer-primitives";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

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
      // La mail "spedito" parte una volta sola: se era gia' partita, dillo
      // invece di lasciar credere che sia stata rimandata.
      setNote(
        res.emailed
          ? "Email di spedizione inviata al cliente."
          : res.alreadyNotified
            ? "Stato aggiornato. Email di spedizione gia' inviata in precedenza."
            : "Stato aggiornato.",
      );
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
            <Button
              key={s.value}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              disabled={!!saving}
              onClick={() => pick(s.value)}
            >
              {saving === s.value ? "…" : s.label}
            </Button>
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
  // Dopo l'acquisizione del buono, se l'ordine NON e' saldato e il residuo non e'
  // su carta (quello va gia' su Stripe), serve incassare il saldo a mano (di norma
  // bonifico). NON gatiamo su residualMethod==="bank-transfer": molti ordini misti
  // reali non hanno quel metadata impostato, ma il saldo va comunque chiuso.
  const residualOnCard = order.residualMethod === "card";
  const settled = order.residualPaid || order.paymentStatus === "FULLY_CHARGED";
  const needsResidual = acquired && !settled && !residualOnCard;

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
          label={residualOnCard ? "Residuo (carta)" : "Residuo (bonifico)"}
          value={<span className="tabular-nums">{formatEur(order.residualAmount)}</span>}
        />
      )}
      {acquired ? (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Buono acquisito sul portale del Ministero.
          {!needsResidual && " Ordine confermato."}
        </p>
      ) : (
        <ActionButton label="Carta del docente acquisita" saving={saving} onClick={acquire} />
      )}
      {/* Pagamento misto: tranche 2. Saldo (di norma bonifico) incassato dopo il buono. */}
      {needsResidual && (
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
  const saved = order.note ?? "";
  const [value, setValue] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const dirty = value.trim() !== saved.trim();

  // La nota puo' cambiare sotto di noi: la scrive anche Nico dalla chat. Riallinea
  // il campo solo quando il valore salvato cambia davvero, cosi' non cancella
  // quello che l'operatore sta scrivendo a ogni refresh della pagina.
  const seen = useRef(saved);
  useEffect(() => {
    if (seen.current === saved) return;
    seen.current = saved;
    setValue(saved);
  }, [saved]);

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
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Annotazioni sull'ordine (es. cambio colore concordato, IVA 4%)…"
        className="resize-y"
      />
      <div className="flex items-center gap-3">
        <ActionButton label="Salva nota" saving={saving} onClick={save} />
        <FeedbackNote note={note} />
      </div>
    </div>
  );
}

const DEFAULT_VAT = "default";

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
        {/* Radix rifiuta un item con value="": la voce "Predefinita" viaggia
            come sentinella DEFAULT_VAT e torna "" prima del salvataggio. */}
        <Select
          value={value || DEFAULT_VAT}
          onValueChange={(v) => setValue(v === DEFAULT_VAT ? "" : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VAT_OPTIONS.map((o) => (
              <SelectItem key={o.value || DEFAULT_VAT} value={o.value || DEFAULT_VAT}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ActionButton label="Salva IVA" saving={saving} onClick={save} />
      </div>
      <FeedbackNote note={note} />
    </div>
  );
}

// Allinea il totale dell'ordine a Danea (es. cliente ordina a IVA 22% e poi
// l'ordine viene rifatto a 4%, importo minore). Ibrido: su ordine bozza cambia il
// totale REALE su Saleor, su ordine confermato salva un'annotazione (il totale
// reale resta bloccato). onSaved propaga il valore annotato a OrdersView; il
// totale reale cambiato si vedra' al prossimo caricamento della lista.
export function PaymentTotalSection({
  order,
  onSaved,
}: {
  order: OrderRow;
  onSaved: (id: string, override: number | null) => void;
}) {
  // Valore effettivo mostrato: annotazione se presente, altrimenti totale reale.
  const effective = order.paymentAmountOverride ?? order.totalGross;
  const [value, setValue] = useState(String(effective));
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const parsed = Number(value.replace(",", "."));
  const valid = Number.isFinite(parsed) && parsed >= 0;
  const dirty = valid && Math.abs(parsed - effective) >= 0.01;

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setNote("");
    try {
      const res = await updateOrderPaymentTotalAction(order.id, parsed);
      onSaved(order.id, res.override);
      setNote(
        res.mode === "edit"
          ? `Totale ordine aggiornato a ${formatEur(res.total)}.`
          : `Importo allineato a ${formatEur(parsed)} (annotazione, totale ordine invariato).`,
      );
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Importo €"
          className="w-32 tabular-nums"
        />
        <ActionButton label="Allinea importo" saving={saving} onClick={save} />
      </div>
      {order.paymentAmountOverride != null && (
        <p className="text-xs text-[var(--color-ink-muted)]">
          Totale reale ordine: <span className="tabular-nums">{formatEur(order.totalGross)}</span> — importo annotato per allineamento.
        </p>
      )}
      <FeedbackNote note={note} />
    </div>
  );
}

// Feature 002 — validazione richiesta IVA agevolata 4% (dal checkout). Se lo stato
// e' "requested" mostra Approva/Rifiuta. All'approvazione propone l'importo a 4%
// (totale/1,22*1,04, scorporo 22% e riapplica 4% sull'imponibile): l'operatore lo
// CONFERMA o MODIFICA prima di allineare il totale (nessun ricalcolo silenzioso sul
// money-path). onValidated propaga il nuovo stato; onAmountSaved l'importo allineato.
export function VatReliefSection({
  order,
  onValidated,
  onAmountSaved,
}: {
  order: OrderRow;
  onValidated: (id: string, status: string) => void;
  onAmountSaved: (id: string, override: number | null) => void;
}) {
  // Proposta 4% dal totale attuale (assunto a 22%, vero per gli ordini da checkout).
  const proposed = Math.round((order.totalGross / 1.22) * 1.04 * 100) / 100;
  const [amount, setAmount] = useState(String(proposed));
  const [approving, setApproving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const status = order.vatReliefStatus;

  async function approve() {
    if (approving) return;
    setApproving(true);
    setNote("");
    try {
      await validateVatReliefAction(order.id, "approve");
      onValidated(order.id, "approved");
      setNote("Agevolazione approvata. Conferma o modifica l'importo a IVA 4%.");
    } catch {
      setNote("Errore nell'approvazione. Riprova.");
    } finally {
      setApproving(false);
    }
  }

  async function reject() {
    if (approving) return;
    setApproving(true);
    setNote("");
    try {
      await validateVatReliefAction(order.id, "reject");
      onValidated(order.id, "rejected");
      setNote("Agevolazione rifiutata. Ordine tornato a IVA 22%.");
    } catch {
      setNote("Errore nel rifiuto. Riprova.");
    } finally {
      setApproving(false);
    }
  }

  // Conferma/modifica l'importo proposto a 4% -> allinea il totale (Fase 1).
  async function confirmAmount() {
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0 || saving) return;
    setSaving(true);
    setNote("");
    try {
      const res = await updateOrderPaymentTotalAction(order.id, parsed);
      onAmountSaved(order.id, res.override);
      setNote(
        `Importo IVA 4% allineato a ${formatEur(parsed)}.` +
          (res.emailed ? " Mail col nuovo importo inviata al cliente." : ""),
      );
    } catch {
      setNote("Errore nel salvataggio importo. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--color-ink-soft)]">Stato richiesta</span>
        <VatReliefBadge status={status} />
      </div>
      <p className="text-xs text-[var(--color-ink-muted)]">
        Documenti giustificativi inviati via email al team al checkout.
      </p>
      {/* Modulo Agevolazioni: carica i documenti ricevuti e falli controllare
          dall'agente prima di decidere qui. */}
      <a
        href={`/vat-relief?case=${order.number}`}
        className="text-xs font-medium text-[var(--color-action)] underline-offset-2 hover:underline"
      >
        Valuta documenti con l&apos;agente
      </a>

      {status === "requested" && (
        <div className="flex gap-2">
          <ActionButton label="Approva agevolazione" saving={approving} onClick={approve} />
          <Button type="button" variant="outline" onClick={reject} disabled={approving}>
            Rifiuta
          </Button>
        </div>
      )}

      {/* Dopo l'approvazione: importo 4% proposto, confermabile o modificabile. */}
      {status === "approved" && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--color-ink-muted)]">
            Importo proposto a IVA 4% (da 22%): modificalo se serve, poi conferma.
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-32 tabular-nums"
            />
            <ActionButton label="Conferma importo" saving={saving} onClick={confirmAmount} />
          </div>
        </div>
      )}

      <FeedbackNote note={note} />
    </div>
  );
}

// Badge stato agevolazione IVA: da validare / approvata / rifiutata.
function VatReliefBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    requested: { label: "Da validare", cls: "border-[var(--color-line-strong)] text-[var(--color-ink)]" },
    approved: { label: "Approvata", cls: "border-[var(--color-line)] text-[var(--color-ink-soft)]" },
    rejected: { label: "Rifiutata", cls: "border-[var(--color-line)] text-[var(--color-ink-muted)]" },
  };
  const m = map[status] ?? map.requested;
  return (
    <span className={cn("rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-medium", m.cls)}>
      {m.label}
    </span>
  );
}
