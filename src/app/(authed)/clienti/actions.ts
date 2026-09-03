"use server";
import { getCustomer, type CustomerDetailResponse, type CustomerNote } from "@/lib/customers";
import { gatewayFetch } from "@/lib/gateway";

// La scheda cliente si carica quando si apre, non insieme alla lista: gli
// ordini e le mail di una persona sono dati suoi, e caricarli per tutta la
// lista sarebbe uno spreco.
export async function fetchCustomerAction(
  email: string,
  range: { from?: string; to?: string } = {},
): Promise<CustomerDetailResponse> {
  return getCustomer(email, range);
}

// Accoda una riga alla nota interna del cliente. L'append lo fa il server: due
// colleghi che scrivono insieme non si cancellano a vicenda.
export async function appendCustomerNoteAction(email: string, note: string): Promise<CustomerNote> {
  const res = await gatewayFetch<{ note: CustomerNote }>("/api/v1/customers/note", {
    method: "PATCH",
    body: JSON.stringify({ email, note }),
  });
  return res.note;
}
