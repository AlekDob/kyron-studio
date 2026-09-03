"use client";
// Mail ricevute da questo indirizzo. Sola lettura: da qui non parte niente,
// l'invio passa da Bea in chat. Lo stato di consegna arriva da Resend ed e' il
// motivo per cui la sezione esiste: quando un cliente dice "non mi e' arrivato
// niente", qui si vede se e' stata consegnata, aperta o rimbalzata.
import { useState } from "react";
import { Building2, ChevronDown, User } from "lucide-react";
import { Pill } from "@/components/ui";
import { formatDate, formatTime } from "@/components/orders/format";
import type { CustomerComm } from "@/lib/customers";

const DELIVERY: Record<
  string,
  { label: string; variant: "tertiary" | "warning" | "critical" | "neutral" }
> = {
  delivered: { label: "Consegnata", variant: "tertiary" },
  opened: { label: "Aperta", variant: "tertiary" },
  clicked: { label: "Cliccata", variant: "tertiary" },
  bounced: { label: "Non consegnata", variant: "critical" },
  complained: { label: "Segnalata spam", variant: "critical" },
  failed: { label: "Fallita", variant: "critical" },
  delivery_delayed: { label: "In ritardo", variant: "warning" },
  queued: { label: "In coda", variant: "neutral" },
  sent: { label: "Inviata", variant: "neutral" },
};

export function CustomerComms({ comms }: { comms: CustomerComm[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (comms.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Nessuna comunicazione inviata.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {comms.map((c, i) => {
        const state = c.delivery ? DELIVERY[c.delivery] : undefined;
        const internal = c.audience === "interna";
        const Who = internal ? Building2 : User;
        return (
          <div
            key={`${c.subject}-${c.sentAt}-${i}`}
            className="rounded-[var(--radius-card)] border border-[var(--color-line)]"
          >
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
            >
              <Who
                className={`h-3.5 w-3.5 shrink-0 ${
                  internal ? "text-[var(--color-ink-muted)]" : "text-[var(--color-accent)]"
                }`}
                aria-label={internal ? "Mail interna al team" : "Mail al cliente"}
              />
              <span
                className={`min-w-0 flex-1 truncate ${internal ? "text-[var(--color-ink-soft)]" : ""}`}
              >
                {c.subject || c.campaign}
              </span>
              {state && (
                <Pill size="sm" variant={state.variant}>
                  {state.label}
                </Pill>
              )}
              <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
                {c.sentAt ? `${formatDate(c.sentAt)} ${formatTime(c.sentAt)}` : ""}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]"
                aria-hidden="true"
              />
            </button>
            {open === i && (
              <div className="border-t border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-ink-soft)] whitespace-pre-wrap">
                {c.body || "(testo non disponibile)"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
