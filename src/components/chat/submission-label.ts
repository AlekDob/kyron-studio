// Cosa si legge nella chat quando si invia una card generativa.
// All'agente va il JSON della submission, all'utente questa frase: un blocco
// `{"kind":"generative_submission"...}` in chat non dice niente a nessuno.
import type { GenerativeSubmission } from "@/components/chat/generative/types";

interface SubmissionData {
  // Portali: selezione prodotti, kit, logo.
  selections?: unknown[];
  selectedSlugs?: unknown[];
  name?: string;
  priceEur?: number;
  uploaded?: boolean;
  // Agevolazioni: documenti 104 caricati.
  names?: string[];
  orderNumber?: string | null;
  // Commesso: file listino Danea caricato.
  filename?: string;
  recordCount?: number;
  groupCount?: number;
}

export function describeSubmission(sub: GenerativeSubmission): string {
  const d = (sub.data ?? {}) as SubmissionData;

  if (typeof d.filename === "string") {
    return `Ho caricato ${d.filename}: ${d.recordCount ?? 0} righe, ${d.groupCount ?? 0} gruppi`;
  }
  if (Array.isArray(d.names) && d.names.length > 0) {
    const order = d.orderNumber ? ` per l'ordine ${d.orderNumber}` : "";
    return `Ho caricato ${d.names.length} documento/i${order}: ${d.names.join(", ")}`;
  }
  const picked = d.selections ?? d.selectedSlugs;
  if (Array.isArray(picked)) return `Selezionati ${picked.length} prodotti`;
  if (d.name && d.priceEur != null) return `Kit "${d.name}" a ${d.priceEur} EUR`;
  if (typeof d.uploaded === "boolean") return d.uploaded ? "Logo caricato" : "Logo saltato";
  return "Dati inviati";
}
