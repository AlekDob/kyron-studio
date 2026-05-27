"use client";

import { useEffect, useState, type ReactElement } from "react";
import type { Annotation, AnnotationKind } from "@/lib/review/types";

interface Props {
  annotation: Annotation | null;
  onClose: () => void;
  onRemove: (id: string) => void;
}

const KIND_LABELS: Record<AnnotationKind, string> = {
  "edit-text": "Modifica testo",
  "replace-image": "Sostituisci immagine",
  comment: "Commento",
  "add-section": "Nuova sezione",
  restructure: "Ristruttura layout",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AnnotationDetail({
  annotation,
  onClose,
  onRemove,
}: Props): ReactElement | null {
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState<Annotation | null>(null);

  useEffect(() => {
    if (annotation) {
      setSnapshot(annotation);
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [annotation]);

  if (!mounted || !snapshot) return null;
  const open = annotation !== null;
  const a = snapshot;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-black/20 transition-opacity duration-200 ease-out"
        style={{ opacity: open ? 1 : 0 }}
      />

      <aside
        role="dialog"
        aria-label="Dettaglio annotazione"
        data-detail-root
        className="absolute bg-[var(--color-paper)] shadow-2xl flex flex-col
                   inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl
                   lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto
                   lg:w-[420px] lg:max-h-none lg:rounded-none lg:rounded-l-2xl"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            [data-detail-root] {
              transform: ${open ? "translateX(0)" : "translateX(100%)"} !important;
            }
          }
        `}</style>

        <header className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] active:scale-[0.97] transition-transform duration-150"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Indietro
          </button>
          <p className="eyebrow">Dettaglio</p>
          <button
            type="button"
            onClick={() => onRemove(a.id)}
            className="text-xs text-red-600 hover:text-red-700 hover:underline active:scale-[0.97] transition-transform duration-150"
          >
            Elimina
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-1">
            <p className="eyebrow text-[var(--color-ink-muted)]">Tipo</p>
            <p className="text-sm font-medium">{KIND_LABELS[a.kind]}</p>
          </div>

          <div className="space-y-1">
            <p className="eyebrow text-[var(--color-ink-muted)]">Pagina</p>
            <p className="font-mono text-xs">{a.page}</p>
          </div>

          {a.source.kind === "dom" && a.source.selector !== "body" && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Selector</p>
              <p className="font-mono text-[11px] break-all text-[var(--color-ink-muted)]">
                {a.source.selector}
              </p>
            </div>
          )}

          {a.original.text && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Originale</p>
              <p className="text-sm text-[var(--color-ink-muted)] line-through decoration-[var(--color-ink-muted)]/40">
                {a.original.text}
              </p>
            </div>
          )}

          {a.original.assetSrc && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">
                Immagine originale
              </p>
              <p className="font-mono text-[11px] break-all text-[var(--color-ink-muted)]">
                {a.original.assetSrc}
              </p>
            </div>
          )}

          {a.proposal.text && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Proposto</p>
              <p className="text-sm text-[var(--color-ink)] font-medium">
                {a.proposal.text}
              </p>
            </div>
          )}

          {a.proposal.newAssetHint && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">
                Nuova immagine
              </p>
              <p className="text-sm">{a.proposal.newAssetHint}</p>
            </div>
          )}

          {a.proposal.note && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Nota</p>
              <p className="text-sm italic text-[var(--color-ink-muted)]">
                {a.proposal.note}
              </p>
            </div>
          )}

          {a.proposal.position && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Posizione</p>
              <p className="font-mono text-[11px]">{a.proposal.position}</p>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--color-line)] space-y-1">
            <p className="eyebrow text-[var(--color-ink-muted)]">Meta</p>
            <p className="text-[11px] font-mono text-[var(--color-ink-muted)]">
              {a.reviewer} · {formatDate(a.createdAt)}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
