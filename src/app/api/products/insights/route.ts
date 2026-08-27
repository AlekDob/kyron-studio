import { listCatalogInsights } from "@/lib/products";

export async function GET() {
  try {
    return Response.json(await listCatalogInsights());
  } catch {
    // Nomi portali e vendite sono contorno: se Saleor tossisce il pannello
    // resta in piedi con slug e nessun dato vendite.
    return Response.json({
      channels: [],
      sales: { updatedAt: "", orderCount: 0, bySku: {} },
    });
  }
}
