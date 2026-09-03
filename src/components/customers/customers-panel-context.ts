"use client";

// Il pannello Clienti si offre alla chat: una ricevuta puo' rimetterlo com'era
// (stesso filtro, stessa scheda) anche a distanza di messaggi. Fuori dal
// workspace il contesto e' null e la ricevuta resta una riga di sola lettura.
import { createContext, useContext } from "react";
import type { CustomersReceiptProps } from "./customers-filter";

export type CustomersPanelApply = (receipt: CustomersReceiptProps) => void;

export const CustomersPanelContext = createContext<CustomersPanelApply | null>(null);

export function useCustomersPanel(): CustomersPanelApply | null {
  return useContext(CustomersPanelContext);
}
