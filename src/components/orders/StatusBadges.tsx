import type { OrderRow } from "@/lib/gateway";
import { Pill } from "@/components/ui";
import { paymentBadge, fulfillmentBadge } from "./format";

// Coppia di badge stato (pagamento + evasione) — condivisa table/card (DRY).
// Brain: decision-019 — per gli ordini Carta del Docente aggiunge un badge che
// attenziona il buono da riscuotere (warning) o gia' acquisito (tertiary).
export function StatusBadges({ order }: { order: OrderRow }) {
  const pay = paymentBadge(order.paymentStatus);
  const ful = fulfillmentBadge(order.status);
  const isTeacherCard = order.paymentMethod === "teacher-card";
  // Bonifico ancora da incassare: attenziona finche' non e' segnato pagato.
  const bankTransferToCollect =
    order.paymentMethod === "bank-transfer" &&
    !order.bankTransferPaid &&
    order.paymentStatus !== "FULLY_CHARGED";
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <Pill size="sm" variant={pay.variant}>
        {pay.label}
      </Pill>
      <Pill size="sm" variant={ful.variant}>
        {ful.label}
      </Pill>
      {isTeacherCard && (
        <Pill size="sm" variant={order.teacherCardAcquired ? "tertiary" : "warning"}>
          {order.teacherCardAcquired
            ? "Carta docente acquisita"
            : "Carta docente da riscuotere"}
        </Pill>
      )}
      {bankTransferToCollect && (
        <Pill size="sm" variant="warning">
          Bonifico da incassare
        </Pill>
      )}
    </span>
  );
}

// Link al portale pubblico (nuova scheda). Niente link se url vuoto.
export function PortalLink({ name, url }: { name: string; url: string }) {
  if (!url) return <span>{name}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-accent)] hover:underline"
    >
      {name}
    </a>
  );
}
