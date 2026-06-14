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

// Ora locale (Europe/Rome) HH:MM per il dettaglio ordine.
const TIME = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

export function formatTime(iso: string): string {
  if (!iso) return "";
  return TIME.format(new Date(iso));
}

// Chiave giorno YYYY-MM-DD in fuso Europe/Rome (raggruppamento per giorno).
const DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Rome",
});

const DAY_LABEL = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Rome",
});

export function dayKey(iso: string): string {
  return iso ? DAY_KEY.format(new Date(iso)) : "";
}

// Etichetta giorno: "Oggi" / "Ieri" / "martedì 10 giugno" (maiuscola iniziale).
export function dayLabel(iso: string): string {
  if (!iso) return "—";
  const key = dayKey(iso);
  const today = DAY_KEY.format(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === today) return "Oggi";
  if (key === DAY_KEY.format(y)) return "Ieri";
  const s = DAY_LABEL.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
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

// Stato lavorazione interno Kyron (workflow commerciali). Ordine = ciclo ordine.
export const WORKFLOW_STATUSES: Array<{ value: string; label: string; variant: PillVariant }> = [
  { value: "nuovo", label: "Nuovo", variant: "neutral" },
  { value: "in_preparazione", label: "In preparazione", variant: "warning" },
  { value: "spedito", label: "Spedito", variant: "accent" },
  { value: "consegnato", label: "Consegnato", variant: "tertiary" },
  { value: "annullato", label: "Annullato", variant: "critical" },
];

export function workflowBadge(status: string): StatusBadge {
  const found = WORKFLOW_STATUSES.find((s) => s.value === status);
  return found ?? { label: prettify(status), variant: "neutral" };
}

// "PARTIALLY_FULFILLED" -> "Partially fulfilled" per stati non mappati.
function prettify(raw: string): string {
  if (!raw) return "—";
  const s = raw.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
