"use server";
import { gatewayFetch } from "@/lib/gateway";

// Cambia lo stato lavorazione di un ordine via BFF (PATCH /api/v1/orders/status).
// Ritorna { ok, status, emailed }: emailed=true se e' partita la mail "spedito".
export async function updateOrderStatusAction(
  id: string,
  status: string,
): Promise<{ ok: boolean; status: string; emailed: boolean }> {
  return gatewayFetch("/api/v1/orders/status", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });
}

// Brain: decision-019 — segna il buono Carta del Docente come acquisito e manda
// la mail di conferma al cliente (POST /api/v1/orders/teacher-card-acquired).
export async function markTeacherCardAcquiredAction(
  id: string,
): Promise<{ ok: boolean; acquiredAt: string; emailed: boolean }> {
  return gatewayFetch("/api/v1/orders/teacher-card-acquired", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

// Brain: decision-019 — segna il bonifico come incassato: marca l'ordine pagato
// in Saleor e manda la mail "bonifico ricevuto" (POST /api/v1/orders/bank-transfer-paid).
export async function markBankTransferPaidAction(
  id: string,
): Promise<{ ok: boolean; paidAt: string; emailed: boolean }> {
  return gatewayFetch("/api/v1/orders/bank-transfer-paid", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

// Brain: decision-019 — pagamento misto tranche 2: residuo bonifico incassato dopo
// il buono Carta del Docente (POST /api/v1/orders/teacher-card-residual-paid).
export async function markTeacherCardResidualPaidAction(
  id: string,
): Promise<{ ok: boolean; paidAt: string; emailed: boolean }> {
  return gatewayFetch("/api/v1/orders/teacher-card-residual-paid", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

// Nota libera dell'operatore sull'ordine (PATCH /api/v1/orders/note). Persiste su
// metadata kyron_note (interno Studio + FootNotes export Danea).
export async function updateOrderNoteAction(
  id: string,
  note: string,
): Promise<{ ok: boolean; note: string }> {
  return gatewayFetch("/api/v1/orders/note", {
    method: "PATCH",
    body: JSON.stringify({ id, note }),
  });
}

// Override aliquota IVA a livello ordine per l'export Danea (PATCH /orders/vat-override).
// Stringa vuota = rimuove l'override. Annotazione: non tocca Saleor.
export async function updateOrderVatAction(
  id: string,
  vat: string,
): Promise<{ ok: boolean; vat: string }> {
  return gatewayFetch("/api/v1/orders/vat-override", {
    method: "PATCH",
    body: JSON.stringify({ id, vat }),
  });
}

// Parte C2: vista editing riga (opzioni colore + editabilita'). editable=true solo
// per ordini UNCONFIRMED (GET /api/v1/orders/edit?id=).
export interface OrderEditView {
  editable: boolean;
  status: string;
  total: number;
  lines: Array<{
    id: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    variantId: string;
    colorSlug: string;
    colorOptions: Array<{ variantId: string; label: string }>;
  }>;
}

export async function fetchOrderEditAction(id: string): Promise<OrderEditView> {
  return gatewayFetch(`/api/v1/orders/edit?id=${encodeURIComponent(id)}`);
}

// Parte C2: editing reale riga su ordine UNCONFIRMED (money-path). Cambio quantita'
// o cambio colore/variante (POST /api/v1/orders/line). Ritorna il nuovo totale.
export async function editOrderLineAction(
  id: string,
  lineId: string,
  change: { quantity?: number; variantId?: string },
): Promise<{ ok: boolean; total: number }> {
  return gatewayFetch("/api/v1/orders/line", {
    method: "POST",
    body: JSON.stringify({ id, lineId, ...change }),
  });
}
