"use server";
import { gatewayFetch } from "@/lib/gateway";

// Mail di prova della comunicazione DDT: una sola, all'indirizzo scritto nella
// card. Il BFF ri-renderizza l'HTML lato server, da qui parte solo il testo.
// L'errore torna come dato: la card lo mostra inline invece di rompersi.
export async function sendDdtTestMailAction(body: {
  importId: string;
  campaignId: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  previewIndex: number;
  to: string;
}): Promise<{ ok: boolean; to?: string; error?: string }> {
  try {
    return await gatewayFetch("/api/v1/orders/ddt-test-mail", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const detail = /"detail":"([^"]+)"/.exec(raw)?.[1];
    return { ok: false, error: detail ?? "Invio della prova fallito." };
  }
}
