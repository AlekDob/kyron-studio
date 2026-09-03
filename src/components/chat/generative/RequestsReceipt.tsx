"use client";

import { type ReactElement } from "react";
import { ExternalLink } from "lucide-react";
import {
  filterChips,
  requestsReceiptSchema,
  type RequestsReceiptProps,
} from "@/components/requests/requests-filter";
import { useRequestsPanel } from "@/components/requests/requests-panel-context";
import { useCloseMobileChat } from "@/components/shell/MobileChatOverlay";

// Ricevuta di quello che Ivo ha fatto al pannello Richieste. In chat NON va mai
// la lista: e' gia' a fianco, qui basta una riga su cui tornare.
export function RequestsReceipt(props: Record<string, unknown>): ReactElement | null {
  const apply = useRequestsPanel();
  const closeSheet = useCloseMobileChat();
  const parsed = requestsReceiptSchema.safeParse(props);
  if (!parsed.success) return null;
  const data = parsed.data;

  // Il ticket appena aperto porta al posto dove si lavora davvero: Linear.
  if (data.kind === "created") {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-left transition-colors hover:border-[var(--color-line-strong)]"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium">{data.identifier} aperta</p>
          <p className="truncate text-xs text-[var(--color-ink-muted)]">{data.title}</p>
        </div>
        <ExternalLink size={14} className="shrink-0 text-[var(--color-ink-muted)]" />
      </a>
    );
  }

  // Su mobile la chat copre il pannello: prima riapplica, poi si toglie di mezzo.
  const onClick = apply
    ? (r: RequestsReceiptProps) => {
        apply(r);
        closeSheet?.();
      }
    : undefined;

  const chips = filterChips({ ...data.filter, source: "agent" });
  return (
    <button
      type="button"
      onClick={onClick && (() => onClick(data))}
      disabled={!onClick}
      className="flex w-full items-baseline justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-left transition-colors enabled:hover:border-[var(--color-line-strong)]"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {data.count} {data.count === 1 ? "richiesta" : "richieste"}
        </p>
        <p className="truncate text-xs text-[var(--color-ink-muted)]">
          {chips.length ? chips.join(" · ") : "tutte"}
        </p>
      </div>
    </button>
  );
}
