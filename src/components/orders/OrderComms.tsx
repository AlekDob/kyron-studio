"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { fetchOrderCommsAction, type OrderComm } from "@/app/(authed)/orders/actions";
import { formatDate, formatTime } from "./format";

// Comunicazioni gia' mandate al cliente di questo ordine (registro email-log).
// Sola lettura: da qui non si manda niente, l'invio passa da Nico in chat.
export function OrderComms({ orderNumber }: { orderNumber: string }) {
  const [comms, setComms] = useState<OrderComm[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setComms(null);
    setOpen(null);
    // Il registro sta su Payload: se non risponde, la scheda ordine resta viva.
    fetchOrderCommsAction(orderNumber)
      .then((rows) => alive && setComms(rows))
      .catch(() => alive && setComms([]));
    return () => {
      alive = false;
    };
  }, [orderNumber]);

  if (comms === null) return <p className="text-sm text-[var(--color-ink-muted)]">Carico…</p>;
  if (comms.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Nessuna comunicazione inviata.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {comms.map((c, i) => (
        <div key={`${c.campaign}-${i}`} className="rounded-[var(--radius-card)] border border-[var(--color-line)]">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm"
          >
            <span className="min-w-0 flex-1 truncate">{c.subject || c.campaign}</span>
            <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
              {c.sentAt ? `${formatDate(c.sentAt)} ${formatTime(c.sentAt)}` : ""}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" aria-hidden="true" />
          </button>
          {open === i && (
            <p className="whitespace-pre-wrap border-t border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
              {c.body || "(testo non registrato)"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
