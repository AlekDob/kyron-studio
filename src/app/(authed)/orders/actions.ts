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
