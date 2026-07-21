"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderRow } from "@/lib/gateway";
import {
  fetchOrderEditAction,
  editOrderLineAction,
  type OrderEditView,
} from "@/app/(authed)/orders/actions";
import { OrderLines } from "./OrderLines";
import { FeedbackNote } from "./drawer-primitives";

// Parte C2 — editing reale righe per ordini UNCONFIRMED (money-path). Carica la
// vista editing dal BFF (opzioni colore + quantita'); ogni modifica chiama Saleor
// e poi router.refresh() per rileggere totale/righe aggiornati dal server.
// Se l'ordine non e' editabile ricade sulla lista read-only (le modifiche vanno
// annotate per Danea via IVA/Note).
export function EditableLines({ order }: { order: OrderRow }) {
  const router = useRouter();
  const [view, setView] = useState<OrderEditView | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // lineId in salvataggio
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    fetchOrderEditAction(order.id)
      .then((v) => alive && setView(v))
      .catch(() => alive && setView(null));
    return () => {
      alive = false;
    };
  }, [order.id]);

  // Non editabile (o caricamento fallito): mostra le righe read-only.
  if (!view || !view.editable) return <OrderLines order={order} />;

  async function apply(lineId: string, change: { quantity?: number; variantId?: string }) {
    if (saving) return;
    setSaving(lineId);
    setNote("");
    try {
      await editOrderLineAction(order.id, lineId, change);
      setNote("Riga aggiornata.");
      router.refresh(); // rilegge righe + totale dal server
    } catch {
      setNote("Errore nella modifica. Riprova.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {view.lines.map((l) => (
        <EditRow key={l.id} line={l} saving={saving === l.id} onApply={apply} />
      ))}
      <FeedbackNote note={note} />
      <p className="text-xs text-[var(--color-ink-muted)]">
        Modifiche applicate all&apos;ordine (stato bozza). Cambi fiscali (IVA) e note
        vanno nelle sezioni dedicate.
      </p>
    </div>
  );
}

type EditLine = OrderEditView["lines"][number];

// Singola riga editabile: descrizione + stepper quantita' + select colore.
function EditRow({
  line,
  saving,
  onApply,
}: {
  line: EditLine;
  saving: boolean;
  onApply: (lineId: string, change: { quantity?: number; variantId?: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] p-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>
          {line.sku && (
            <span className="font-mono text-xs text-[var(--color-ink-muted)]">{line.sku} </span>
          )}
          {line.productName}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <QtyStepper
          value={line.quantity}
          disabled={saving}
          onChange={(q) => onApply(line.id, { quantity: q })}
        />
        {line.colorOptions.length > 0 && (
          <select
            disabled={saving}
            defaultValue=""
            onChange={(e) =>
              e.target.value &&
              onApply(line.id, { variantId: e.target.value, quantity: line.quantity })
            }
            className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-line-strong)] disabled:opacity-50"
          >
            <option value="">Cambia colore…</option>
            {line.colorOptions.map((o) => (
              <option key={o.variantId} value={o.variantId}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {saving && <span className="text-xs text-[var(--color-ink-muted)]">Salvataggio…</span>}
      </div>
    </div>
  );
}

// Stepper quantita' (min 1). Applica al rilascio (onChange), non a ogni tick.
function QtyStepper({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (q: number) => void;
}) {
  const [q, setQ] = useState(value);
  useEffect(() => setQ(value), [value]);
  const step = (delta: number) => setQ((prev) => Math.max(1, prev + delta));
  return (
    <span className="inline-flex items-center gap-1">
      <StepBtn label="−" disabled={disabled || q <= 1} onClick={() => step(-1)} />
      <span className="min-w-6 text-center text-sm tabular-nums">{q}</span>
      <StepBtn label="+" disabled={disabled} onClick={() => step(1)} />
      {q !== value && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(q)}
          className="ml-1 rounded-[var(--radius-pill)] border border-[var(--color-ink)] bg-[var(--color-ink)] px-2 py-1 text-xs font-medium text-[var(--color-paper)] disabled:opacity-50"
        >
          Applica
        </button>
      )}
    </span>
  );
}

function StepBtn({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 rounded-full border border-[var(--color-line)] text-sm leading-none disabled:opacity-40 hover:border-[var(--color-line-strong)]"
    >
      {label}
    </button>
  );
}
