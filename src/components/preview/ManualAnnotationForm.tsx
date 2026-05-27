"use client";

import { useState, type ReactElement } from "react";
import type { AnnotationKind } from "@/lib/review/types";
import type { PendingTarget } from "./PreviewWorkspace";

interface Props {
  target: PendingTarget;
  onSave: (data: {
    kind: AnnotationKind;
    proposalText?: string;
    note?: string;
    newAssetHint?: string;
  }) => void;
  onCancel: () => void;
}

function defaultKind(t: PendingTarget): AnnotationKind {
  if (t.nodeKind === "image") return "replace-image";
  if (t.nodeKind === "section" || t.nodeKind === "gap") return "add-section";
  if (t.nodeKind === "page") return "comment";
  return "edit-text";
}

const KIND_OPTIONS: Array<{ value: AnnotationKind; label: string }> = [
  { value: "edit-text", label: "Modifica testo" },
  { value: "replace-image", label: "Sostituisci immagine" },
  { value: "comment", label: "Commento" },
  { value: "add-section", label: "Aggiungi sezione" },
  { value: "restructure", label: "Ristruttura" },
];

export function ManualAnnotationForm({
  target,
  onSave,
  onCancel,
}: Props): ReactElement {
  const [kind, setKind] = useState<AnnotationKind>(defaultKind(target));
  const [proposalText, setProposalText] = useState("");
  const [note, setNote] = useState("");
  const [newAssetHint, setNewAssetHint] = useState("");

  const showTextField = kind === "edit-text" || kind === "add-section";
  const showImageHint =
    kind === "replace-image" || target.nodeKind === "image";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hasContent =
      proposalText.trim() || note.trim() || newAssetHint.trim();
    if (!hasContent) return;
    onSave({
      kind,
      proposalText: proposalText.trim() || undefined,
      note: note.trim() || undefined,
      newAssetHint: newAssetHint.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-4 mb-2 rounded-2xl border border-[var(--color-action)]/30 bg-[var(--color-paper)] p-3 text-xs space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <p className="eyebrow text-[var(--color-action)]">Annotazione manuale</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          Annulla
        </button>
      </div>

      <label className="block">
        <span className="block text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] mb-1">
          Tipo
        </span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AnnotationKind)}
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-xs focus:border-[var(--color-ink)] outline-none"
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {showTextField && (
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] mb-1">
            Testo proposto
          </span>
          <textarea
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
            rows={3}
            placeholder="Nuovo testo da proporre…"
            className="w-full resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-xs focus:border-[var(--color-ink)] outline-none"
          />
        </label>
      )}

      {showImageHint && (
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] mb-1">
            Hint nuova immagine
          </span>
          <input
            type="text"
            value={newAssetHint}
            onChange={(e) => setNewAssetHint(e.target.value)}
            placeholder="Es. foto del laboratorio in alta risoluzione"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-xs focus:border-[var(--color-ink)] outline-none"
          />
        </label>
      )}

      <label className="block">
        <span className="block text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)] mb-1">
          Nota
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Razionale o commento libero…"
          className="w-full resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-xs focus:border-[var(--color-ink)] outline-none"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-full bg-[var(--color-action)] py-1.5 text-xs font-medium text-[var(--color-paper)] hover:bg-[var(--color-action-hover)] disabled:opacity-30"
        disabled={
          !proposalText.trim() && !note.trim() && !newAssetHint.trim()
        }
      >
        Aggiungi al bundle
      </button>
    </form>
  );
}
