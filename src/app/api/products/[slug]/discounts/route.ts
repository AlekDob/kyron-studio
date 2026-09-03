import { proxyProducts } from "../../_proxy";

// Sconti per portale: li chiede la sezione Sconti quando l'operatore apre il
// tab, non la pagina, perche' costa una query Saleor in piu' per prodotto.
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return proxyProducts(`/${slug}/discounts`, { method: "GET" });
}
