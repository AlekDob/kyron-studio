"use client";

// Il pannello Ordini si offre alla chat: una ricevuta puo' rimetterlo com'era
// (stesso filtro, stessa scheda) anche a distanza di messaggi. Fuori dal
// workspace il contesto e' null e la ricevuta resta una riga di sola lettura.
import { createContext, useContext } from "react";
import type { OrdersReceiptProps } from "./orders-filter";

export type OrdersPanelApply = (receipt: OrdersReceiptProps) => void;

export const OrdersPanelContext = createContext<OrdersPanelApply | null>(null);

export function useOrdersPanel(): OrdersPanelApply | null {
  return useContext(OrdersPanelContext);
}
