"use client";

import { useState, type ReactElement } from "react";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { Annotation, AnnotationKind } from "@/lib/review/types";
import { AnnotationDetail } from "./AnnotationDetail";

interface Props {
  open: boolean;
  annotations: Annotation[];
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

function kindAccent(kind: AnnotationKind): string {
  if (kind === "edit-text") return "bg-blue-50 text-blue-700";
  if (kind === "replace-image") return "bg-violet-50 text-violet-700";
  if (kind === "add-section") return "bg-emerald-50 text-emerald-700";
  if (kind === "restructure") return "bg-amber-50 text-amber-700";
  return "bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]";
}

function annotationPreview(a: Annotation): string {
  return (
    a.proposal.text ||
    a.proposal.note ||
    a.proposal.newAssetHint ||
    a.original.text ||
    "—"
  );
}

// Bundle annotazioni: bottom sheet su mobile, da destra su desktop. Il drawer
// dettaglio e' un secondo Drawer: aperto dopo, il suo nodo e' l'ultimo del body
// e sta sopra questo (portal su body, stesso z-index).
export function AnnotationsDrawer({
  open,
  annotations,
  onClose,
  onRemove,
}: Props): ReactElement {
  const [selected, setSelected] = useState<Annotation | null>(null);
  const isMobile = useIsMobile();

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        side={isMobile ? "bottom" : "right"}
        width={540}
      >
        <DrawerHeader
          eyebrow="Annotazioni"
          title={`${annotations.length} ${annotations.length === 1 ? "voce" : "voci"}`}
          meta="nel bundle"
          onClose={onClose}
          closeLabel="Chiudi"
        />

        <ul className="min-h-0 flex-1 divide-y divide-[var(--color-line)] overflow-y-auto overscroll-contain">
          {annotations.length === 0 && (
            <li className="px-5 py-8 text-center text-xs italic text-[var(--color-ink-muted)]">
              Bundle vuoto.
            </li>
          )}
          {annotations.map((a, i) => (
            <li
              key={a.id}
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
              className="studio-row-in"
            >
              <button
                type="button"
                onClick={() => setSelected(a)}
                className="w-full origin-left px-6 py-4 text-left transition-transform duration-150 hover:bg-[var(--color-ink)]/[0.03] active:scale-[0.995]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${kindAccent(a.kind)}`}
                  >
                    {KIND_LABELS[a.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[10px] text-[var(--color-ink-muted)]">
                      {a.page}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[var(--color-ink)]">
                      {annotationPreview(a)}
                    </p>
                  </div>
                  <svg
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--color-ink-muted)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Drawer>

      <AnnotationDetail
        annotation={selected}
        onClose={() => setSelected(null)}
        onRemove={(id) => {
          onRemove(id);
          setSelected(null);
        }}
      />
    </>
  );
}
