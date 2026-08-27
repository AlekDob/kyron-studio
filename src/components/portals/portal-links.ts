// Indirizzo pubblico del portale sullo shop Kyron. Un solo posto: lo slug del
// portale e' anche il segmento dell'URL (e lo slug del canale Saleor).
export const SHOP_BASE = "https://kyronedu.it/shop";

export function portalShopUrl(slug: string): string {
  return `${SHOP_BASE}/${slug}`;
}
