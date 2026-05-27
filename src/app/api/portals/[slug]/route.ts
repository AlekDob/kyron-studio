import { getPortal, GatewayError } from "@/lib/gateway";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const portal = await getPortal(slug);
    return Response.json(portal);
  } catch (err) {
    if (err instanceof GatewayError && err.status === 404) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    throw err;
  }
}
