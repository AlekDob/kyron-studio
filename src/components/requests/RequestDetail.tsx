"use client";
// Scheda della richiesta. Niente tab e nessuna chiamata in piu': quello che
// serve e' gia' nella riga della lista. Il posto dove si lavora davvero resta
// Linear, quindi in fondo c'e' il link per aprirla la'.
import { ChevronLeft, ExternalLink, FileText, Info } from "lucide-react";
import { Pill } from "@/components/ui";
import { Section } from "@/components/orders/detail-section";
import { InfoRow } from "@/components/orders/drawer-primitives";
import { formatDate } from "@/components/orders/format";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import type { RequestRow } from "@/lib/requests";
import { LABEL_TONES } from "./requests-filter-ui";

/**
 * La riga "Richiesto da:" e' gia' un campo qui sotto: nel testo sarebbe un
 * doppione. Si toglie solo QUELLA (e il filetto che la precede), non tutto
 * quello che sta dopo un "---": molti ticket usano il filetto nel corpo.
 */
function body(description: string): string {
  return description
    .replace(/\n*(?:---\n)?Richiesto da:.*$/s, "")
    .trim();
}

export function RequestDetail({
  request,
  onBack,
}: {
  request: RequestRow;
  onBack?: () => void;
}) {
  return (
    <Slide direction="right" offset={18} className="flex h-full min-h-0 flex-1 flex-col">
      {onBack && (
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-line)] px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
          >
            <ChevronLeft size={16} />
            Richieste
          </button>
          <span className="text-[var(--color-line-strong)]">/</span>
          <p className="text-base font-semibold">{request.identifier}</p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        <div className="flex flex-col gap-6">
          <Section title={request.title} icon={FileText} tone="indigo">
            <p className="whitespace-pre-wrap text-sm text-[var(--color-ink-soft)]">
              {body(request.description) || "Nessuna descrizione."}
            </p>
          </Section>

          <Section title="Dettagli" icon={Info} tone="slate">
            <InfoRow
              label="Stato"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    style={{ background: request.stateColor }}
                    className="size-2 rounded-full"
                  />
                  {request.state}
                </span>
              }
            />
            <InfoRow
              label="Tipo"
              value={
                request.labels.length ? (
                  <span className="inline-flex flex-wrap justify-end gap-1.5">
                    {request.labels.map((l) => (
                      <Pill key={l} size="sm" variant={LABEL_TONES[l] ?? "neutral"}>
                        {l}
                      </Pill>
                    ))}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow label="Richiesto da" value={request.requestedBy || "—"} />
            <InfoRow label="Aperta il" value={formatDate(request.createdAt)} />
            <InfoRow label="Ultimo movimento" value={formatDate(request.updatedAt)} />
          </Section>

          <a
            href={request.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper-soft)]"
          >
            <ExternalLink size={14} />
            Apri {request.identifier} su Linear
          </a>
        </div>
      </div>
    </Slide>
  );
}
