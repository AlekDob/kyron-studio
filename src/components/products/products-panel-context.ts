"use client";

// Il pannello Prodotti si offre alla chat: una ricevuta puo' rimetterlo com'era
// (stesso filtro, stessa scheda) anche a distanza di messaggi. Fuori dal
// workspace il contesto e' null e la ricevuta resta una riga di sola lettura.
import { createContext, useContext } from "react";
import type { ProductsReceiptProps } from "./products-filter";

export type ProductsPanelApply = (receipt: ProductsReceiptProps) => void;

export const ProductsPanelContext = createContext<ProductsPanelApply | null>(null);

export function useProductsPanel(): ProductsPanelApply | null {
  return useContext(ProductsPanelContext);
}
