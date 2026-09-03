"use client";

// Il pannello Portali si offre alla chat: una ricevuta puo' rimetterlo com'era
// (stesso filtro, stessa scheda) anche a distanza di messaggi. Fuori dal
// workspace il contesto e' null e la ricevuta resta una riga di sola lettura.
import { createContext, useContext } from "react";
import type { PortalsReceiptProps } from "./portals-filter";

export type PortalsPanelApply = (receipt: PortalsReceiptProps) => void;

export const PortalsPanelContext = createContext<PortalsPanelApply | null>(null);

export function usePortalsPanel(): PortalsPanelApply | null {
  return useContext(PortalsPanelContext);
}
