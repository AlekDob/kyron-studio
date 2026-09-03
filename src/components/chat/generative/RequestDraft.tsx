"use client";

import { useState, type ReactElement } from "react";
import { Card, Pill } from "@/components/ui";
import { GROUP_LABELS } from "@/components/requests/requests-filter";
import { LABEL_TONES } from "@/components/requests/requests-filter-ui";

// La bozza del ticket, prima che parta. Ivo propone, il collega conferma: senza
// questo click create_request non scrive niente su Linear.

interface Props {
  title: string;
  description: string;
  label: string;
  state: "todo" | "backlog";
  /** Urgenza gia' in italiano: la traduce il server, unica fonte. */
  urgencyLabel: string;
  urgency: string;
  requestedBy: string;
  readOnly?: boolean;
  disabled?: boolean;
  onSubmit?: (data: { confirmRequest: boolean }) => void;
}

const STATE_LABEL: Record<Props["state"], string> = {
  todo: GROUP_LABELS.todo,
  backlog: "Quando si puo'",
};

export function RequestDraft({
  title,
  description,
  label,
  state,
  urgencyLabel,
  urgency,
  requestedBy,
  readOnly,
  disabled,
  onSubmit,
}: Props): ReactElement {
  const [choice, setChoice] = useState<boolean | null>(null);
  const locked = readOnly || disabled || choice !== null;

  function pick(confirmRequest: boolean): void {
    if (locked) return;
    setChoice(confirmRequest);
    onSubmit?.({ confirmRequest });
  }

  return (
    <Card padding="md">
      <Card.Header>
        <h3 className="text-sm font-medium">Bozza della richiesta</h3>
      </Card.Header>

      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-ink-soft)]">{description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Pill size="sm" variant={LABEL_TONES[label] ?? "neutral"}>
          {label}
        </Pill>
        <Pill size="sm" variant="neutral">
          {STATE_LABEL[state]}
        </Pill>
        <Pill size="sm" variant={urgency === "bloccante" ? "critical" : "neutral"}>
          {urgencyLabel}
        </Pill>
        <span className="text-xs text-[var(--color-ink-muted)]">per {requestedBy}</span>
      </div>

      {choice === null ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={locked}
            onClick={() => pick(true)}
            className="rounded-[var(--radius-pill)] bg-[var(--color-ink)] px-3 py-1.5 text-sm font-medium text-[var(--color-paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Conferma e apri
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => pick(false)}
            className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-paper-soft)] disabled:opacity-50"
          >
            Modifica
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[var(--color-ink-muted)]">
          {choice ? "Confermata." : "Dimmi cosa cambiare."}
        </p>
      )}
    </Card>
  );
}
