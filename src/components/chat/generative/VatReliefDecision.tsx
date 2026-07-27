"use client";

// Approva / Rifiuta la richiesta di IVA agevolata proposta dall'agente.
// La decisione e' SEMPRE della persona (money-path): l'agente suggerisce, qui
// si clicca. Riusa le stesse server action del drawer Ordini.
import { useState, type ReactElement } from "react";
import {
  validateVatReliefAction,
  updateOrderPaymentTotalAction,
} from "@/app/(authed)/orders/actions";

interface Props {
  orderId: string;
  orderNumber: string;
  totalGross: number;
  currentStatus?: string;
  suggerimento: "approve" | "reject";
  motivo: string;
  readOnly?: boolean;
  disabled?: boolean;
}

// Stessa formula del drawer Ordini: scorporo 22% e riapplico 4%.
function proposedTotal(totalGross: number): number {
  return Math.round((totalGross / 1.22) * 1.04 * 100) / 100;
}

export function VatReliefDecision({
  orderId,
  orderNumber,
  totalGross,
  currentStatus,
  suggerimento,
  motivo,
  disabled,
}: Props): ReactElement {
  const [status, setStatus] = useState(currentStatus ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(proposedTotal(totalGross).toFixed(2)));
  const [amountSaved, setAmountSaved] = useState(false);

  const decided = status === "approved" || status === "rejected";

  async function decide(action: "approve" | "reject"): Promise<void> {
    if (busy || disabled) return;
    setBusy(true);
    setError(null);
    try {
      const res = await validateVatReliefAction(orderId, action);
      setStatus(res.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione fallita");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAmount(): Promise<void> {
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Importo non valido");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateOrderPaymentTotalAction(orderId, parsed);
      setAmountSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvataggio fallito");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <p className="text-sm font-medium text-[var(--color-ink)]">
        Decisione richiesta — ordine #{orderNumber}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        L&apos;agente suggerisce di{" "}
        <strong className="text-[var(--color-ink)]">
          {suggerimento === "approve" ? "approvare" : "rifiutare"}
        </strong>
        : {motivo}
      </p>

      {!decided ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void decide("approve")}
            disabled={busy || disabled}
            className="flex-1 rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-action-hover)] disabled:opacity-40"
          >
            Approva IVA 4%
          </button>
          <button
            type="button"
            onClick={() => void decide("reject")}
            disabled={busy || disabled}
            className="flex-1 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-muted)] disabled:opacity-40"
          >
            Rifiuta
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-ink)]">
          {status === "approved" ? "Approvata: IVA 4% attiva per Danea." : "Rifiutata: torna al 22%."}
        </p>
      )}

      {status === "approved" && !amountSaved && (
        <div className="mt-3 rounded-[var(--radius-card)] bg-[var(--color-paper-muted)] p-3">
          <p className="text-xs text-[var(--color-ink-muted)]">
            Importo stimato con IVA 4% (modificalo se Danea calcola diverso):
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Importo con IVA 4%"
              className="w-32 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => void confirmAmount()}
              disabled={busy}
              className="rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-1.5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-action-hover)] disabled:opacity-40"
            >
              Conferma importo
            </button>
          </div>
        </div>
      )}

      {amountSaved && (
        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Importo allineato.</p>
      )}
      {error && <p className="mt-2 text-xs text-[var(--color-critical)]">{error}</p>}
    </div>
  );
}
