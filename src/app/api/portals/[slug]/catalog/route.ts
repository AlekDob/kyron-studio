import { updatePortalCatalog, GatewayError } from "@/lib/gateway";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const { slug } = await params;
  const body = (await req.json()) as { visibleSlugs?: string[] };
  if (!Array.isArray(body.visibleSlugs)) {
    return Response.json(
      { error: "visibleSlugs must be an array" },
      { status: 400 },
    );
  }
  try {
    const result = await updatePortalCatalog(slug, body.visibleSlugs);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
