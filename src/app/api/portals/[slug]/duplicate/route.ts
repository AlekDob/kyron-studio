import { duplicatePortal, GatewayError } from "@/lib/gateway";

interface Params {
  params: Promise<{ slug: string }>;
}

// Proxy BFF: duplica il portale :slug in una nuova Bozza. Inoltra a
// studio-server POST /api/v1/portals/:slug/duplicate. Vedi feature 007.
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const body = (await req.json()) as { newSlug?: string; newNome?: string };
  try {
    const result = await duplicatePortal(slug, {
      newSlug: body.newSlug ?? "",
      newNome: body.newNome ?? "",
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
