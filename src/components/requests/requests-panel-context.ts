"use client";

// Il pannello Richieste si offre alla chat: una ricevuta puo' rimetterlo
// com'era anche a distanza di messaggi. Fuori dal workspace il contesto e' null
// e la ricevuta resta una riga di sola lettura.
import { createContext, useContext } from "react";
import type { RequestsReceiptProps } from "./requests-filter";

export type RequestsPanelApply = (receipt: RequestsReceiptProps) => void;

export const RequestsPanelContext = createContext<RequestsPanelApply | null>(null);

export function useRequestsPanel(): RequestsPanelApply | null {
  return useContext(RequestsPanelContext);
}
