"use client";
// Note interne sul cliente: si leggono e si accodano. Nessuna modifica del
// testo gia' scritto — la nota e' condivisa tra colleghi (e con Bea), e
// sovrascriverla perderebbe quello che ha annotato un altro.
import { useState } from "react";
import { appendCustomerNoteAction } from "@/app/(authed)/clienti/actions";
import { ActionButton, FeedbackNote } from "@/components/orders/drawer-primitives";
import { formatDate } from "@/components/orders/format";
import { Textarea } from "@/components/ui";
import type { CustomerNote } from "@/lib/customers";

export function CustomerNotes({ email, note }: { email: string; note: CustomerNote | null }) {
  const [saved, setSaved] = useState(note);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setFeedback("");
    try {
      setSaved(await appendCustomerNoteAction(email, trimmed));
      setValue("");
      setFeedback("Nota aggiunta.");
    } catch {
      setFeedback("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {saved?.note ? (
        <div className="flex flex-col gap-1">
          {saved.note.split("\n").map((line, i) => (
            <p key={i} className="text-sm whitespace-pre-wrap text-[var(--color-ink)]">
              {line}
            </p>
          ))}
          <p className="text-xs text-[var(--color-ink-muted)]">
            Ultimo aggiornamento {formatDate(saved.updatedAt)}
            {saved.updatedBy ? ` — ${saved.updatedBy}` : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">Nessuna nota su questo cliente.</p>
      )}

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Aggiungi una riga (es. richiamare a settembre per il secondo iPad)…"
        className="resize-y"
      />
      <div className="flex items-center gap-3">
        <ActionButton label="Aggiungi nota" saving={saving} onClick={save} />
        <FeedbackNote note={feedback} />
      </div>
    </div>
  );
}
