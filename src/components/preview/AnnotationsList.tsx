"use client";

import { useState, type ReactElement } from "react";
import type { Annotation } from "@/lib/review/types";
import { buildBundle } from "@/lib/review/exportMarkdown";
import { AnnotationsDrawer } from "./AnnotationsDrawer";

interface Props {
  annotations: Annotation[];
  site: string;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const PREVIEW_COUNT = 3;

function annotationPreview(a: Annotation): string {
  return (
    a.proposal.text ||
    a.proposal.note ||
    a.proposal.newAssetHint ||
    a.original.text ||
    "—"
  );
}

export function AnnotationsList({
  annotations,
  site,
  onRemove,
  onClear,
}: Props): ReactElement {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function sendBundle(): Promise<void> {
    if (annotations.length === 0 || sending) return;
    if (!confirm(`Invio ${annotations.length} annotazioni via email. Confermi?`)) {
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const bundle = buildBundle(annotations, "studio.kyronedu.it", site);
      const res = await fetch("/api/review/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setStatus("Inviato.");
        onClear();
      } else {
        setStatus(data.error || "Invio fallito");
      }
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const preview = annotations.slice(0, PREVIEW_COUNT);
  const overflow = Math.max(0, annotations.length - PREVIEW_COUNT);

  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-paper)] relative">
      <header className="flex items-center justify-between px-5 py-2 border-b border-[var(--color-line)]">
        <p className="eyebrow">Bundle · {annotations.length}</p>
        <button
          type="button"
          onClick={() => void sendBundle()}
          disabled={annotations.length === 0 || sending}
          className="rounded-full bg-[var(--color-action)] text-[var(--color-paper)] px-3 py-1 text-xs font-medium hover:bg-[var(--color-action-hover)] active:scale-[0.97] disabled:opacity-30 transition-[transform,background-color] duration-150"
        >
          {sending ? "Invio…" : "Invia via email"}
        </button>
      </header>

      {status && (
        <p className="px-5 py-2 text-xs text-[var(--color-ink-muted)] italic border-b border-[var(--color-line)]">
          {status}
        </p>
      )}

      {annotations.length === 0 ? (
        <p className="px-5 py-3 text-xs text-[var(--color-ink-muted)] italic">
          Nessuna annotazione. Chiedi all'agente di proporne.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-line)]">
          {preview.map((a) => (
            <li key={a.id} className="px-5 py-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex-1 min-w-0 text-left active:scale-[0.995] origin-left transition-transform duration-150"
                >
                  <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                    {a.kind} · {a.page}
                  </p>
                  <p className="truncate">{annotationPreview(a)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  aria-label="Rimuovi"
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] active:scale-[0.9] transition-transform duration-150 shrink-0"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
          {overflow > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-full px-5 py-2 text-xs text-[var(--color-action)] hover:bg-[var(--color-action)]/5 active:scale-[0.995] transition-[transform,background-color] duration-150 text-left font-medium"
              >
                Vedi tutte ({annotations.length})
              </button>
            </li>
          )}
          {overflow === 0 && annotations.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-full px-5 py-2 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-ink)]/[0.02] transition-colors text-left"
              >
                Apri dettagli
              </button>
            </li>
          )}
        </ul>
      )}

      <AnnotationsDrawer
        open={drawerOpen}
        annotations={annotations}
        onClose={() => setDrawerOpen(false)}
        onRemove={onRemove}
      />
    </section>
  );
}
