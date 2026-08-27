"use client";

import { type ReactElement } from "react";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import { useIsMobile } from "@/lib/use-is-mobile";
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

// Dettaglio annotazione: secondo Drawer sopra AnnotationsDrawer. La X torna al
// bundle (prima era un "Indietro" scritto a mano: fa la stessa cosa).
export function AnnotationDetail({
  annotation,
  onClose,
  onRemove,
}: Props): ReactElement {
  const isMobile = useIsMobile();

  return (
    <Drawer
      open={Boolean(annotation)}
      onClose={onClose}
      side={isMobile ? "bottom" : "right"}
      width={540}
    >
      {annotation && (
        <>
          <DrawerHeader
            eyebrow="Dettaglio"
            title={KIND_LABELS[annotation.kind]}
            meta={`${annotation.reviewer} · ${formatDate(annotation.createdAt)}`}
            actions={
              <button
                type="button"
                onClick={() => onRemove(annotation.id)}
                className="text-xs text-red-600 transition-transform duration-150 hover:text-red-700 hover:underline active:scale-[0.97]"
              >
                Elimina
              </button>
            }
            onClose={onClose}
            closeLabel="Chiudi"
          />

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Pagina</p>
              <p className="font-mono text-xs">{annotation.page}</p>
          </div>

          {annotation.source.kind === "dom" && annotation.source.selector !== "body" && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Selector</p>
              <p className="font-mono text-[11px] break-all text-[var(--color-ink-muted)]">
                {annotation.source.selector}
              </p>
            </div>
          )}

          {annotation.original.text && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Originale</p>
              <p className="text-sm text-[var(--color-ink-muted)] line-through decoration-[var(--color-ink-muted)]/40">
                {annotation.original.text}
              </p>
            </div>
          )}

          {annotation.original.assetSrc && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">
                Immagine originale
              </p>
              <p className="font-mono text-[11px] break-all text-[var(--color-ink-muted)]">
                {annotation.original.assetSrc}
              </p>
            </div>
          )}

          {annotation.proposal.text && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Proposto</p>
              <p className="text-sm text-[var(--color-ink)] font-medium">
                {annotation.proposal.text}
              </p>
            </div>
          )}

          {annotation.proposal.newAssetHint && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">
                Nuova immagine
              </p>
              <p className="text-sm">{annotation.proposal.newAssetHint}</p>
            </div>
          )}

          {annotation.proposal.note && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Nota</p>
              <p className="text-sm italic text-[var(--color-ink-muted)]">
                {annotation.proposal.note}
              </p>
            </div>
          )}

          {annotation.proposal.position && (
            <div className="space-y-1">
              <p className="eyebrow text-[var(--color-ink-muted)]">Posizione</p>
              <p className="font-mono text-[11px]">{annotation.proposal.position}</p>
            </div>
          )}
          </div>
        </>
      )}
    </Drawer>
  );
}
