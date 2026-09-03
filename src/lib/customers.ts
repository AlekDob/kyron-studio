// Client del modulo Clienti verso il BFF (studio-server, feature 021). Vive
// fuori da gateway.ts solo per non farlo crescere: stesso `gatewayFetch`.
//
// Un cliente non e' una collection: e' derivato dagli ordini del periodo. Tutti
// i filtri li applica il server, la pagina non filtra niente in memoria.
import { gatewayFetch, type OrderRow } from "./gateway";

export interface CustomerRow {
  email: string;
  name: string;
  phone: string;
  address: string;
  companyName: string;
  fiscalCode: string;
  vatNumber: string;
  studentName: string;
  portals: Array<{ slug: string; name: string }>;
  agents: string[];
  /** Ordini validi: gli annullati stanno in `canceled` e non fanno speso. */
  orders: number;
  canceled: number;
  totalSpent: number;
  currency: string;
  firstOrder: string;
  lastOrder: string;
  orderNumbers: string[];
  products: string;
  /** Primo ordine negli ultimi 30 giorni. */
  isNew: boolean;
  /** Piu' di un ordine valido. */
  isReturning: boolean;
}

export interface CustomersBucket {
  count: number;
  eur: number;
}

export interface CustomersResponse {
  from: string;
  to: string;
  count: number;
  /** KPI contati prima del filtro gruppo (li usano le tile). */
  buckets: Record<"all" | "nuovi" | "ricorrenti", CustomersBucket>;
  portals: Array<{ slug: string; name: string }>;
  agents: string[];
  customers: CustomerRow[];
}

/** Una comunicazione gia' partita: da Resend (consegna) o dal registro Payload. */
export interface CustomerComm {
  id: string;
  campaign: string;
  subject: string;
  body: string;
  sentAt: string;
  delivery: string;
  audience: "cliente" | "interna";
}

/** Nota interna sul cliente (Payload `customer-notes`). Si accoda, non si sovrascrive. */
export interface CustomerNote {
  email: string;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface CustomerDetailResponse {
  customer: CustomerRow;
  orders: OrderRow[];
  comms: CustomerComm[];
  note: CustomerNote | null;
}

export interface ListCustomersParams {
  from?: string;
  to?: string;
  portal?: string;
  agent?: string;
  group?: string;
  q?: string;
  /** Query strutturata composta da Bea, gia' serializzata in JSON. */
  spec?: string;
}

export async function listCustomers(params: ListCustomersParams = {}): Promise<CustomersResponse> {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== "all") search.set(k, v);
  }
  const qs = search.toString();
  return gatewayFetch<CustomersResponse>(`/api/v1/customers${qs ? `?${qs}` : ""}`);
}

export async function getCustomer(
  email: string,
  range: { from?: string; to?: string } = {},
): Promise<CustomerDetailResponse> {
  const search = new URLSearchParams();
  if (range.from) search.set("from", range.from);
  if (range.to) search.set("to", range.to);
  const qs = search.toString();
  return gatewayFetch<CustomerDetailResponse>(
    `/api/v1/customers/${encodeURIComponent(email)}${qs ? `?${qs}` : ""}`,
  );
}
