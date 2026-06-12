import { enablePortalOnSaleor, GatewayError } from "@/lib/gateway";

interface Params {
  params: Promise<{ slug: string }>;
}

// Proxy verso studio-server: seed Saleor staging+prod (Fase B onboarding).
// Timeout Next default (no edge): l'enable dura ~30-90s, resta sotto i limiti.
export const maxDuration = 180;

export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    targets?: Array<"staging" | "prod">;
  };
  try {
    const result = await enablePortalOnSaleor(slug, body.targets);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
