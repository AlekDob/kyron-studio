// Client del modulo Richieste verso il BFF (studio-server, feature 022).
// I ticket stanno su Linear: qui non c'e' nessuna copia locale, la lista e' un
// riflesso di quello che c'e' la'.
import { gatewayFetch } from "./gateway";

/** Come stanno i chip del pannello: da fare, in corso, fatti. */
export type RequestGroup = "todo" | "doing" | "done";

/**
 * Quanto e' urgente. E' la `priority` di Linear, detta in italiano.
 * Le etichette stanno in `components/requests/requests-filter-ui.ts`: questo
 * file importa `gatewayFetch`, che e' solo-server, e un componente client non
 * puo' tirarselo dietro per due parole.
 */
export type RequestUrgency = "bloccante" | "alta" | "media" | "bassa";

export interface RequestRow {
  id: string;
  /** Codice leggibile, es. FUT-83. */
  identifier: string;
  title: string;
  description: string;
  url: string;
  state: string;
  stateColor: string;
  group: RequestGroup;
  labels: string[];
  urgency: RequestUrgency;
  /** Email di chi ha chiesto (riga "Richiesto da:" in fondo alla descrizione). */
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestsResponse {
  count: number;
  requests: RequestRow[];
}

export async function listRequests(): Promise<RequestsResponse> {
  return gatewayFetch<RequestsResponse>("/api/v1/requests");
}
