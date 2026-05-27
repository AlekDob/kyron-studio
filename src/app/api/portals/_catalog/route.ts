import { listSaleorCatalog, GatewayError } from "@/lib/gateway";

export async function GET() {
  try {
    const products = await listSaleorCatalog();
    return Response.json(products);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
