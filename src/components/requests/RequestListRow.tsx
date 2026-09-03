"use client";
import { ChevronRight, CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import { Pill } from "@/components/ui";
import { SectionIcon, type Tone } from "@/components/orders/detail-section";
import { formatDate } from "@/components/orders/format";
import type { RequestRow } from "@/lib/requests";
import { LABEL_TONES } from "./requests-filter-ui";

// L'icona dice subito a che punto e' la richiesta: da fare, in corso, fatta.
const LOOK: Record<RequestRow["group"], { icon: typeof CircleDot; tone: Tone }> = {
  todo: { icon: CircleDashed, tone: "slate" },
  doing: { icon: CircleDot, tone: "indigo" },
  done: { icon: CircleCheck, tone: "emerald" },
};

export function RequestListRow({
  request,
  onSelect,
}: {
  request: RequestRow;
  onSelect: (request: RequestRow) => void;
}) {
  const { icon, tone } = LOOK[request.group];

  return (
    <button
      type="button"
      onClick={() => onSelect(request)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-paper-soft)]"
    >
      <SectionIcon icon={icon} tone={tone} size={32} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs tabular-nums text-[var(--color-ink-muted)]">
            {request.identifier}
          </span>
          <span className="min-w-0 truncate font-medium">{request.title}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-[var(--color-ink-soft)]">
          {request.requestedBy || "richiesta interna"}
          <span className="text-[var(--color-ink-muted)]"> · {formatDate(request.createdAt)}</span>
        </p>
      </div>

      <span className="hidden shrink-0 flex-wrap justify-end gap-1.5 sm:inline-flex">
        {/* L'urgenza si mostra SOLO quando blocca: se la vedessi su ogni riga
            smetteresti di notarla. */}
        {request.urgency === "bloccante" && (
          <Pill size="sm" variant="critical">
            Blocca
          </Pill>
        )}
        {request.labels.map((l) => (
          <Pill key={l} size="sm" variant={LABEL_TONES[l] ?? "tertiary"}>
            {l}
          </Pill>
        ))}
      </span>

      {/* Il pallino ha il colore vero dello stato su Linear: quello che vede
          Alek nella board e' quello che vedono qui i colleghi. */}
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          aria-hidden
          style={{ background: request.stateColor }}
          className="size-2 rounded-full"
        />
        <span className="text-xs text-[var(--color-ink-muted)]">{request.state}</span>
      </span>

      <ChevronRight size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
    </button>
  );
}
