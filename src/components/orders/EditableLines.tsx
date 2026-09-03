"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderRow } from "@/lib/gateway";
import {
  fetchOrderEditAction,
  editOrderLineAction,
  setLineColorAction,
  type OrderEditView,
} from "@/app/(authed)/orders/actions";
import { OrderLines } from "./OrderLines";
import { ColorChangeNote } from "./ColorChangeNote";
import { FeedbackNote } from "./drawer-primitives";
import { ProductThumbnail } from "@/components/catalogo/ProductThumbnail";
import { Button } from "@/components/shadcn/button";
import { ColorPicker } from "./ColorPicker";
import { SkeletonRows } from "@/components/ui";

type EditLine = OrderEditView["lines"][number];

// Parte C2 — editing righe ordine. Tre modalita' (decision-019):
// - "edit"     ordine UNCONFIRMED: modifica REALE qty/colore su Saleor (money-path)
// - "annotate" ordine confermato non spedito: cambio colore come ANNOTAZIONE (non
//              tocca Saleor) — mostrato in Studio, area ordini cliente ed export Danea
// - "locked" / caricamento fallito: righe in sola lettura (con eventuali annotazioni)
export function EditableLines({ order }: { order: OrderRow }) {
  const [view, setView] = useState<OrderEditView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchOrderEditAction(order.id)
      .then((v) => alive && setView(v))
      .catch(() => alive && setView(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [order.id]);

  // Righe sola lettura come skeleton: senza, si vedono per un istante le righe
  // non editabili e poi saltano nella versione con le azioni.
  if (loading) {
    return <SkeletonRows rows={3} rowClassName="h-[76px]" label="Carico le righe" />;
  }
  if (!view || view.mode === "locked") return <OrderLines order={order} />;
  if (view.mode === "annotate") {
    return <AnnotateLines order={order} view={view} onView={setView} />;
  }
  return <EditLines order={order} view={view} />;
}

// --- Modalita' EDIT (ordine bozza): modifica reale su Saleor -------------------
function EditLines({ order, view }: { order: OrderRow; view: OrderEditView }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [note, setNote] = useState("");

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

// --- Modalita' ANNOTATE (ordine confermato): cambio colore come annotazione ----
function AnnotateLines({
  order,
  view,
  onView,
}: {
  order: OrderRow;
  view: OrderEditView;
  onView: (v: OrderEditView) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // Salva/rimuove il colore richiesto (to="" torna all'originale). Aggiorna la vista
  // localmente e refresha per sincronizzare le righe in sola lettura + Danea.
  async function applyColor(line: EditLine, to: string) {
    if (saving) return;
    setSaving(line.id);
    setNote("");
    try {
      await setLineColorAction(order.id, {
        sku: line.sku,
        product: line.productName,
        from: line.colorName,
        to,
      });
      onView({
        ...view,
        lines: view.lines.map((l) =>
          l.id === line.id ? { ...l, requestedColor: to } : l,
        ),
      });
      setNote(to ? "Cambio colore registrato." : "Cambio colore annullato.");
      router.refresh();
    } catch {
      setNote("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {view.lines.map((l) => (
        <AnnotateRow
          key={l.id}
          line={l}
          saving={saving === l.id}
          onApply={applyColor}
        />
      ))}
      <FeedbackNote note={note} />
      <p className="text-xs text-[var(--color-ink-muted)]">
        Ordine gia&apos; confermato: il cambio colore e&apos; un&apos;annotazione interna e
        per il cliente, non modifica prezzo o pagamento.
      </p>
    </div>
  );
}

// Riga in modalita' annotazione: prodotto + icona colore (solo dove serve).
function AnnotateRow({
  line,
  saving,
  onApply,
}: {
  line: EditLine;
  saving: boolean;
  onApply: (line: EditLine, to: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] p-3">
      <LineHeading line={line}>
        {saving && <span className="text-xs text-[var(--color-ink-muted)]">Salvataggio…</span>}
        {line.colorOptions.length > 0 && (
          <ColorPicker
            bought={line.colorName}
            requested={line.requestedColor}
            options={line.colorOptions}
            disabled={saving}
            onPick={(v) => onApply(line, v)}
            valueOf={(o) => o.label}
          />
        )}
      </LineHeading>
      {line.requestedColor ? (
        <ColorChangeNote from={line.colorName} to={line.requestedColor} />
      ) : (
        line.colorName && (
          <span className="text-xs text-[var(--color-ink-muted)]">
            Colore: <span className="text-[var(--color-ink-soft)]">{line.colorName}</span>
          </span>
        )
      )}
    </div>
  );
}

// Intestazione riga: foto + SKU + nome prodotto, con slot azioni a destra.
function LineHeading({ line, children }: { line: EditLine; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <ProductThumbnail src={line.imageUrl} className="h-10 w-10 rounded-lg" />
      <span>
        {line.sku && (
          <span className="font-mono text-xs text-[var(--color-ink-muted)]">{line.sku} </span>
        )}
        <span className="font-medium">{line.productName}</span>
      </span>
      <span className="ml-auto flex items-center gap-2">{children}</span>
    </div>
  );
}

// Riga in modalita' edit reale: stepper quantita' + icona colore (cambia variante).
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
      <LineHeading line={line}>
        {saving && <span className="text-xs text-[var(--color-ink-muted)]">Salvataggio…</span>}
        {line.colorOptions.length > 0 && (
          <ColorPicker
            bought={line.colorName}
            requested=""
            options={line.colorOptions}
            disabled={saving}
            onPick={(v) => onApply(line.id, { variantId: v, quantity: line.quantity })}
            valueOf={(o) => o.variantId}
          />
        )}
      </LineHeading>
      <QtyStepper
        value={line.quantity}
        disabled={saving}
        onChange={(q) => onApply(line.id, { quantity: q })}
      />
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
        <Button type="button" size="xs" className="ml-1" disabled={disabled} onClick={() => onChange(q)}>
          Applica
        </Button>
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
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="rounded-full"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
