"use client";
import { useEffect, useState } from "react";
import { Building2, ChevronDown, User } from "lucide-react";
import {
  fetchCommBodyAction,
  fetchOrderCommsAction,
  type OrderComm,
} from "@/app/(authed)/orders/actions";
import { Pill, SkeletonRows } from "@/components/ui";
import { formatDate, formatTime } from "./format";

// Storico delle mail di questo ordine: quelle al cliente e quelle interne.
// Sola lettura: da qui non si manda niente, l'invio passa da Nico in chat.
// Lo stato arriva da Resend (`last_event`) ed e' il motivo per cui questa
// sezione esiste: quando un cliente dice "non mi e' arrivato niente", qui si
// vede se la mail e' stata consegnata, aperta o rimbalzata.
const DELIVERY: Record<string, { label: string; variant: "tertiary" | "warning" | "critical" | "neutral" }> = {
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

interface Props {
  orderNumber: string;
  /** Email del cliente: aggancia anche le mail che nell'oggetto non citano l'ordine. */
  customerEmail?: string;
}

export function OrderComms({ orderNumber, customerEmail }: Props) {
  const [comms, setComms] = useState<OrderComm[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  // Corpi scaricati da Resend a richiesta, tenuti per id finche' la scheda e' aperta.
  const [bodies, setBodies] = useState<Record<string, string>>({});

  function toggle(i: number, c: OrderComm) {
    setOpen(open === i ? null : i);
    if (open === i || c.body || !c.id || bodies[c.id] !== undefined) return;
    setBodies((b) => ({ ...b, [c.id!]: "" }));
    fetchCommBodyAction(c.id)
      .then((body) => setBodies((b) => ({ ...b, [c.id!]: body })))
      .catch(() => setBodies((b) => ({ ...b, [c.id!]: "" })));
  }

  useEffect(() => {
    let alive = true;
    setComms(null);
    setOpen(null);
    setBodies({});
    // Se il gateway non risponde, la scheda ordine resta viva.
    fetchOrderCommsAction(orderNumber, customerEmail)
      .then((rows) => alive && setComms(rows))
      .catch(() => alive && setComms([]));
    return () => {
      alive = false;
    };
  }, [orderNumber, customerEmail]);

  if (comms === null) {
    return <SkeletonRows rows={3} rowClassName="h-[38px]" label="Carico le comunicazioni" />;
  }
  if (comms.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Nessuna comunicazione inviata.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {comms.map((c, i) => {
        const state = c.delivery ? DELIVERY[c.delivery] : undefined;
        // Mail al cliente vs notifica interna: si distinguono a colpo d'occhio
        // dall'icona, senza aggiungere una seconda pastiglia alla riga.
        const internal = c.audience === "interna";
        const Who = internal ? Building2 : User;
        return (
          <div key={`${c.subject}-${c.sentAt}-${i}`} className="rounded-[var(--radius-card)] border border-[var(--color-line)]">
            <button
              type="button"
              onClick={() => toggle(i, c)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
            >
              <Who
                className={`h-3.5 w-3.5 shrink-0 ${
                  internal ? "text-[var(--color-ink-muted)]" : "text-[var(--color-accent)]"
                }`}
                aria-label={internal ? "Mail interna al team" : "Mail al cliente"}
              />
              <span
                className={`min-w-0 flex-1 truncate ${
                  internal ? "text-[var(--color-ink-soft)]" : ""
                }`}
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
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" aria-hidden="true" />
            </button>
            {open === i && (
              <div className="border-t border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                <p className="mb-1 text-[var(--color-ink-muted)]">
                  {internal ? "Interna — a: " : "Al cliente — a: "}
                  {c.to || "—"}
                </p>
                <p className="whitespace-pre-wrap">
                  {c.body || (c.id ? bodies[c.id] : "") || "(testo non disponibile)"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
