"use client";

import { useState, type ReactElement } from "react";
import type { Annotation } from "@/lib/review/types";
import { buildBundle } from "@/lib/review/exportMarkdown";

interface Props {
  annotations: Annotation[];
  site: string;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function AnnotationsList({
  annotations,
  site,
  onRemove,
  onClear,
}: Props): ReactElement {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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

  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-paper)]">
      <header className="flex items-center justify-between px-5 py-2 border-b border-[var(--color-line)]">
        <p className="eyebrow">Bundle · {annotations.length}</p>
        <button
          type="button"
          onClick={() => void sendBundle()}
          disabled={annotations.length === 0 || sending}
          className="rounded-full bg-[var(--color-action)] text-[var(--color-paper)] px-3 py-1 text-xs font-medium hover:bg-[var(--color-action-hover)] disabled:opacity-30 transition-colors"
        >
          {sending ? "Invio…" : "Invia via email"}
        </button>
      </header>

      {status && (
        <p className="px-5 py-2 text-xs text-[var(--color-ink-muted)] italic border-b border-[var(--color-line)]">
          {status}
        </p>
      )}

      <ul className="max-h-44 overflow-y-auto divide-y divide-[var(--color-line)]">
        {annotations.length === 0 ? (
          <li className="px-5 py-3 text-xs text-[var(--color-ink-muted)] italic">
            Nessuna annotazione. Chiedi all'agente di proporne.
          </li>
        ) : (
          annotations.map((a) => (
            <li key={a.id} className="px-5 py-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                    {a.kind} · {a.page}
                  </p>
                  <p className="truncate">
                    {a.proposal.text || a.proposal.note || a.original.text || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  aria-label="Rimuovi"
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] shrink-0"
                >
                  ×
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
