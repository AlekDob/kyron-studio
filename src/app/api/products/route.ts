import { NextRequest } from "next/server";
import { listProducts } from "@/lib/products";

export async function GET(req: NextRequest) {
  try {
    const products = await listProducts(
      req.nextUrl.searchParams.get("search") ?? undefined,
    );
    return Response.json({ products });
  } catch {
    // Il pannello resta in piedi con la lista vuota, come /orders.
    return Response.json({ products: [] });
  }
}
