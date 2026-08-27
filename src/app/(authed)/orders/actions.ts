"use server";
import { gatewayFetch, type LineColorChange } from "@/lib/gateway";

// Cambia lo stato lavorazione di un ordine via BFF (PATCH /api/v1/orders/status).
// Ritorna { ok, status, emailed, alreadyNotified }: emailed=true se e' partita
// ora la mail "spedito"; alreadyNotified=true se era gia' partita in passato
// (la mail non si ripete a ogni click).
export async function updateOrderStatusAction(
  id: string,
  status: string,
): Promise<{ ok: boolean; status: string; emailed: boolean; alreadyNotified: boolean }> {
  return gatewayFetch("/api/v1/orders/status", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });
}

// Comunicazioni gia' inviate al cliente di un ordine (registro email-log).
export interface OrderComm {
  campaign?: string;
  subject?: string;
  body?: string;
  sentAt?: string;
  status?: string;
}

export async function fetchOrderCommsAction(number: string): Promise<OrderComm[]> {
  const res = await gatewayFetch<{ comms: OrderComm[] }>(
    `/api/v1/orders/comms?number=${encodeURIComponent(number)}`,
  );
  return res.comms ?? [];
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

// Allinea il totale dell'ordine (PATCH /api/v1/orders/payment-total). Ibrido:
// ordine UNCONFIRMED = cambio reale su Saleor, confermato = annotazione
// (kyron_payment_amount_override). amount=0 rimuove l'annotazione. Ritorna la
// modalita' applicata, il totale reale e l'eventuale override annotato.
export async function updateOrderPaymentTotalAction(
  id: string,
  amount: number,
): Promise<{ ok: boolean; mode: EditMode; total: number; override: number | null }> {
  return gatewayFetch("/api/v1/orders/payment-total", {
    method: "PATCH",
    body: JSON.stringify({ id, amount }),
  });
}

// Feature 002 — valida la richiesta di IVA agevolata 4% (PATCH /orders/vat-agevolata).
// approve = IVA 4% effettiva per Danea; reject = torna a 22% (rimuove l'override).
// Il riallineo importo lo fa a parte updateOrderPaymentTotalAction (proposta 4%).
export async function validateVatReliefAction(
  id: string,
  action: "approve" | "reject",
): Promise<{ ok: boolean; status: string }> {
  return gatewayFetch("/api/v1/orders/vat-agevolata", {
    method: "PATCH",
    body: JSON.stringify({ id, action }),
  });
}

// Parte C2: vista editing riga (opzioni colore + modalita'). mode:
// "edit" = modifica reale (ordine UNCONFIRMED), "annotate" = cambio colore come
// annotazione (ordine confermato non spedito), "locked" = sola lettura.
export type EditMode = "edit" | "annotate" | "locked";

export interface OrderEditView {
  mode: EditMode;
  editable: boolean; // retro-compat: mode === "edit"
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
    colorName: string; // colore acquistato (originale)
    colorOptions: Array<{ variantId: string; label: string }>;
    requestedColor: string; // colore richiesto via annotazione, o ""
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

// Cambio colore come ANNOTAZIONE su ordini confermati (decision-019). Non tocca
// Saleor: salva acquisto originale + colore richiesto (POST /orders/line-color).
// to="" rimuove l'annotazione. Ritorna la lista aggiornata dei cambi colore.
export async function setLineColorAction(
  id: string,
  change: { sku: string; product: string; from: string; to: string },
): Promise<{ ok: boolean; changes: LineColorChange[] }> {
  return gatewayFetch("/api/v1/orders/line-color", {
    method: "POST",
    body: JSON.stringify({ id, ...change }),
  });
}
