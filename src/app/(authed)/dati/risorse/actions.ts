"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecord,
  deleteRecord,
  updateRecord,
  GatewayError,
} from "@/lib/gateway";
import { TIPI_CON_FILE } from "@/lib/risorse";

export interface SaveState {
  error?: string;
}

const SLUG = "risorse";

function localized(form: FormData, name: string): { it: string; en: string } {
  return {
    it: String(form.get(`${name}__it`) ?? ""),
    en: String(form.get(`${name}__en`) ?? ""),
  };
}

function buildPayload(form: FormData): Record<string, unknown> {
  const tipoFile = String(form.get("tipoFile") ?? "pdf");
  const ordine = String(form.get("ordine") ?? "").trim();
  const data = String(form.get("dataAggiornamento") ?? "");
  const file = String(form.get("file") ?? "");
  return {
    titolo: localized(form, "titolo"),
    slug: String(form.get("slug") ?? "").trim(),
    descrizioneBreve: localized(form, "descrizioneBreve"),
    descrizioneEstesa: localized(form, "descrizioneEstesa"),
    meta: localized(form, "meta"),
    categoria: String(form.get("categoria") ?? ""),
    ambiti: form.getAll("ambiti").map(String),
    destinatari: form.getAll("destinatari").map(String),
    tipoFile,
    // Payload rifiuta l'id media come stringa (Postgres usa id numerici).
    file: TIPI_CON_FILE.includes(tipoFile) && file ? Number(file) : null,
    url: TIPI_CON_FILE.includes(tipoFile) ? "" : String(form.get("url") ?? ""),
    copertina: Number(form.get("copertina")),
    dataAggiornamento: data ? new Date(data).toISOString() : undefined,
    inEvidenza: form.get("inEvidenza") === "on",
    ordine: ordine ? Number(ordine) : 0,
    _status: form.get("pubblicata") === "on" ? "published" : "draft",
  };
}

function validate(form: FormData): string | null {
  if (!String(form.get("titolo__it") ?? "").trim()) return "Il titolo e' obbligatorio";
  if (!String(form.get("slug") ?? "").trim()) return "Lo slug e' obbligatorio";
  if (!String(form.get("descrizioneBreve__it") ?? "").trim())
    return "La descrizione breve e' obbligatoria";
  if (!String(form.get("dataAggiornamento") ?? ""))
    return "La data di aggiornamento e' obbligatoria";
  if (!String(form.get("copertina") ?? "")) return "Carica la copertina";
  const tipoFile = String(form.get("tipoFile") ?? "");
  if (TIPI_CON_FILE.includes(tipoFile) && !String(form.get("file") ?? ""))
    return "Carica il file della risorsa";
  if (!TIPI_CON_FILE.includes(tipoFile) && !String(form.get("url") ?? "").trim())
    return "Inserisci l'indirizzo del link";
  return null;
}

export async function saveRisorsa(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const error = validate(form);
  if (error) return { error };

  const id = String(form.get("__id") ?? "");
  let savedId = id;
  try {
    if (id) {
      await updateRecord(SLUG, id, buildPayload(form));
    } else {
      const doc = await createRecord(SLUG, buildPayload(form));
      savedId = String(doc.id);
    }
  } catch (err) {
    const msg = err instanceof GatewayError ? err.message : "Salvataggio fallito";
    return { error: msg };
  }

  revalidatePath("/dati/risorse");
  revalidatePath(`/dati/risorse/${savedId}`);
  redirect("/dati/risorse");
}

export async function destroyRisorsa(form: FormData): Promise<void> {
  await deleteRecord(SLUG, String(form.get("__id") ?? ""));
  revalidatePath("/dati/risorse");
  redirect("/dati/risorse");
}
