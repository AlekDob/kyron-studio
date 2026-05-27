"use client";

import { useState, type ReactElement } from "react";
import type { AnnotationKind } from "@/lib/review/types";

export interface ProposeArgs {
  kind?: AnnotationKind;
  page?: string;
  selector?: string;
  original?: { text?: string; assetSrc?: string };
  proposal?: {
    text?: string;
    note?: string;
    newAssetHint?: string;
    position?: "before" | "after" | "replace";
  };
}

export interface ProposalEntry {
  id: string;
  args: ProposeArgs;
  state: "pending" | "confirmed" | "cancelled";
  editedText?: string;
}

function stateBadge(state: ProposalEntry["state"]): {
  label: string;
  tone: "ok" | "muted" | "pending";
} {
  if (state === "confirmed") {
    return { label: "Aggiunta al bundle", tone: "ok" };
  }
  if (state === "cancelled") {
    return { label: "Annullata", tone: "muted" };
  }
  return { label: "Da confermare", tone: "pending" };
}

function badgeClass(tone: "ok" | "muted" | "pending"): string {
  if (tone === "ok") return "bg-emerald-50 text-emerald-700";
  if (tone === "muted")
    return "bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]";
  return "bg-[var(--color-action)]/10 text-[var(--color-action)]";
}

export function ProposalCard({
  proposal,
  disabled,
  onConfirm,
  onCancel,
}: {
  proposal: ProposalEntry;
  disabled: boolean;
  onConfirm: (editedText?: string) => void;
  onCancel: () => void;
}): ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(proposal.args.proposal?.text ?? "");

  const original = proposal.args.original?.text;
  const proposed = proposal.editedText ?? proposal.args.proposal?.text;
  const note = proposal.args.proposal?.note;
  const kind = proposal.args.kind ?? "edit-text";
  const page = proposal.args.page ?? "/";
  const badge = stateBadge(proposal.state);

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 space-y-2 shadow-sm">
      <div className="flex items-center gap-2 text-[10px]">
        <span className="eyebrow text-[var(--color-action)]">Proposta</span>
        <span className="font-mono text-[var(--color-ink-muted)]">{kind}</span>
        <span className="font-mono text-[var(--color-ink-muted)]">·</span>
        <span className="font-mono text-[var(--color-ink-muted)] truncate">
          {page}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 ${badgeClass(badge.tone)}`}
        >
          {badge.label}
        </span>
      </div>

      {original && (
        <div className="text-xs">
          <p className="eyebrow text-[var(--color-ink-muted)] mb-1">
            Originale
          </p>
          <p className="text-[var(--color-ink-muted)] line-through decoration-[var(--color-ink-muted)]/40">
            {original}
          </p>
        </div>
      )}

      {(proposed || editing) && (
        <div className="text-xs">
          <p className="eyebrow text-[var(--color-ink-muted)] mb-1">Proposto</p>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-action)]"
            />
          ) : (
            <p className="text-[var(--color-ink)] font-medium">{proposed}</p>
          )}
        </div>
      )}

      {note && (
        <div className="text-xs">
          <p className="eyebrow text-[var(--color-ink-muted)] mb-1">Nota</p>
          <p className="text-[var(--color-ink-muted)] italic">{note}</p>
        </div>
      )}

      {proposal.state === "pending" && (
        <div className="flex items-center gap-2 pt-1">
          {editing ? (
            <>
              <button
                type="button"
                disabled={disabled || !draft.trim()}
                onClick={() => onConfirm(draft.trim())}
                className="rounded-full bg-[var(--color-action)] text-[var(--color-paper)] px-3 py-1 text-xs font-medium hover:bg-[var(--color-action-hover)] disabled:opacity-30"
              >
                Salva e conferma
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setEditing(false)}
                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-ink)]/5"
              >
                Indietro
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onConfirm()}
                className="rounded-full bg-[var(--color-action)] text-[var(--color-paper)] px-3 py-1 text-xs font-medium hover:bg-[var(--color-action-hover)] disabled:opacity-30"
              >
                Conferma
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setDraft(proposal.args.proposal?.text ?? "");
                  setEditing(true);
                }}
                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-ink)]/5"
              >
                Modifica
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={onCancel}
                className="ml-auto rounded-full px-3 py-1 text-xs text-[var(--color-ink-muted)] hover:bg-[var(--color-ink)]/5"
              >
                Annulla
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
