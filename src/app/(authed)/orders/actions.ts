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
