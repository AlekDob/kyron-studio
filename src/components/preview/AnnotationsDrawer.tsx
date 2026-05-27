"use client";

import { useEffect, useState, type ReactElement } from "react";
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

export function AnnotationsDrawer({
  open,
  annotations,
  onClose,
  onRemove,
}: Props): ReactElement | null {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Annotation | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => {
      setMounted(false);
      setSelected(null);
    }, 220);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else onClose();
    }
    if (mounted) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, selected, onClose]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ease-out"
        style={{ opacity: open ? 1 : 0 }}
      />

      <aside
        role="dialog"
        aria-label="Tutte le annotazioni"
        className="absolute bg-[var(--color-paper)] shadow-2xl flex flex-col
                   inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl
                   lg:inset-y-0 lg:right-0 lg:left-auto lg:bottom-auto
                   lg:w-[480px] lg:max-h-none lg:rounded-none lg:rounded-l-2xl"
        style={{
          transform: open
            ? "translateY(0) translateX(0)"
            : "translateY(100%)",
          transition:
            "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        data-drawer-root
      >
        <DrawerDesktopTransform open={open} />

        <header className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
          <div>
            <p className="eyebrow">Annotazioni</p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              {annotations.length}{" "}
              {annotations.length === 1 ? "voce" : "voci"} nel bundle
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-full p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)] active:scale-[0.97] transition-transform duration-150"
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--color-line)]">
          {annotations.length === 0 && (
            <li className="px-5 py-8 text-xs text-center text-[var(--color-ink-muted)] italic">
              Bundle vuoto.
            </li>
          )}
          {annotations.map((a, i) => (
            <li
              key={a.id}
              style={{
                animationDelay: `${Math.min(i, 8) * 30}ms`,
              }}
              className="animate-fade-up"
            >
              <button
                type="button"
                onClick={() => setSelected(a)}
                className="w-full text-left px-5 py-3 hover:bg-[var(--color-ink)]/[0.03] active:scale-[0.995] transition-transform duration-150 origin-left"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${kindAccent(a.kind)}`}
                  >
                    {KIND_LABELS[a.kind]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-[var(--color-ink-muted)] truncate">
                      {a.page}
                    </p>
                    <p className="text-sm text-[var(--color-ink)] mt-0.5 line-clamp-2">
                      {annotationPreview(a)}
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)] mt-1"
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
      </aside>

      <AnnotationDetail
        annotation={selected}
        onClose={() => setSelected(null)}
        onRemove={(id) => {
          onRemove(id);
          setSelected(null);
        }}
      />
    </div>
  );
}

// Workaround: il transform iniziale del drawer e' translateY(100%) per mobile
// e translateX(100%) per desktop. Iniettiamo regole responsive via style tag
// inline (Tailwind v4 non supporta breakpoint nei valori inline).
function DrawerDesktopTransform({ open }: { open: boolean }): ReactElement {
  return (
    <style>{`
      @media (min-width: 1024px) {
        [data-drawer-root] {
          transform: ${open ? "translateX(0)" : "translateX(100%)"} !important;
        }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-up {
        animation: fadeUp 280ms cubic-bezier(0.23, 1, 0.32, 1) backwards;
      }
    `}</style>
  );
}
