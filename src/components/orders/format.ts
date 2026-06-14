import type { PillProps } from "@/components/ui";

// Punto unico di verita' per formattazione e label degli ordini (DRY).
// Usato da OrdersTable (desktop) e OrderCard (mobile).

type PillVariant = NonNullable<PillProps["variant"]>;

const EUR = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

const DATE = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatEur(amount: number): string {
  return EUR.format(amount);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return DATE.format(new Date(iso));
}

// Local-part dell'email agente come nome breve; "—" se assente.
export function agentName(email: string): string {
  if (!email) return "—";
  return email.split("@")[0];
}

export interface StatusBadge {
  label: string;
  variant: PillVariant;
}

// Stato pagamento Saleor -> badge IT. Fallback neutro sul valore grezzo.
export function paymentBadge(status: string): StatusBadge {
  switch (status) {
    case "FULLY_CHARGED":
      return { label: "Pagato", variant: "tertiary" };
    case "PARTIALLY_CHARGED":
      return { label: "Acconto", variant: "warning" };
    case "NOT_CHARGED":
    case "PENDING":
      return { label: "Da pagare", variant: "warning" };
    case "FULLY_REFUNDED":
    case "PARTIALLY_REFUNDED":
      return { label: "Rimborsato", variant: "neutral" };
    case "REFUSED":
    case "CANCELLED":
      return { label: "Rifiutato", variant: "critical" };
    default:
      return { label: prettify(status), variant: "neutral" };
  }
}

// Stato evasione (order status) Saleor -> badge IT. Fallback neutro.
export function fulfillmentBadge(status: string): StatusBadge {
  switch (status) {
    case "FULFILLED":
      return { label: "Evaso", variant: "tertiary" };
    case "PARTIALLY_FULFILLED":
      return { label: "Parziale", variant: "warning" };
    case "UNFULFILLED":
      return { label: "Da evadere", variant: "warning" };
    case "CANCELED":
      return { label: "Annullato", variant: "critical" };
    case "RETURNED":
    case "PARTIALLY_RETURNED":
      return { label: "Reso", variant: "neutral" };
    case "DRAFT":
    case "UNCONFIRMED":
      return { label: "Bozza", variant: "neutral" };
    default:
      return { label: prettify(status), variant: "neutral" };
  }
}

// "PARTIALLY_FULFILLED" -> "Partially fulfilled" per stati non mappati.
function prettify(raw: string): string {
  if (!raw) return "—";
  const s = raw.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
