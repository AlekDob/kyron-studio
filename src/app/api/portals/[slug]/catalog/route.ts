import { updatePortalCatalog, updatePortalDiscounts, GatewayError } from "@/lib/gateway";
import type { PortalDetail } from "@/lib/gateway";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const { slug } = await params;
  const body = (await req.json()) as {
    visibleSlugs?: string[];
    productDiscounts?: PortalDetail["catalog"]["productDiscounts"];
  };
  if (!Array.isArray(body.visibleSlugs) && !Array.isArray(body.productDiscounts)) {
    return Response.json(
      { error: "visibleSlugs or productDiscounts must be an array" },
      { status: 400 },
    );
  }
  try {
    const result = body.productDiscounts
      ? await updatePortalDiscounts(slug, body.productDiscounts)
      : await updatePortalCatalog(slug, body.visibleSlugs ?? []);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
