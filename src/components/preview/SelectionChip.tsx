"use client";

import type { ReactElement } from "react";
import type { PendingTarget } from "./PreviewWorkspace";

function truncateLabel(s: string, max = 80): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function targetLabel(t: PendingTarget): string {
  if (t.currentText) return `"${truncateLabel(t.currentText)}"`;
  if (t.assetSrc) return `Immagine ${t.assetSrc.split("/").pop()}`;
  if (t.nodeKind === "gap") return "Spazio fra sezioni";
  if (t.nodeKind === "page") return "Pagina intera";
  return t.urn ?? t.nodeKind;
}

export function SelectionChip({
  target,
  onDismiss,
  onManual,
}: {
  target: PendingTarget;
  onDismiss: () => void;
  onManual?: () => void;
}): ReactElement {
  return (
    <div className="mx-4 mb-2 flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-action)]/40 bg-[var(--color-action)]/5 px-3 py-1.5 text-xs">
      <span className="eyebrow shrink-0 text-[var(--color-action)]">
        Selezionato
      </span>
      <span className="font-mono text-[10px] text-[var(--color-ink-muted)] shrink-0">
        {target.page}
      </span>
      <span className="truncate text-[var(--color-ink)]">
        {targetLabel(target)}
      </span>
      {onManual && (
        <button
          type="button"
          onClick={onManual}
          className="ml-auto shrink-0 rounded-full border border-[var(--color-action)]/40 px-2 py-0.5 text-[10px] font-medium text-[var(--color-action)] hover:bg-[var(--color-action)]/10"
        >
          Aggiungi manualmente
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Deseleziona"
        className={`${onManual ? "" : "ml-auto "}shrink-0 rounded-full p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]`}
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
