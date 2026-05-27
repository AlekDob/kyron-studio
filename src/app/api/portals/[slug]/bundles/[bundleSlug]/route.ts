import { updateBundle, removeBundle, GatewayError } from "@/lib/gateway";

interface Params {
  params: Promise<{ slug: string; bundleSlug: string }>;
}

export async function PUT(req: Request, { params }: Params) {
  const { slug, bundleSlug } = await params;
  const patch = await req.json();
  try {
    const result = await updateBundle(slug, bundleSlug, patch);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { slug, bundleSlug } = await params;
  try {
    const result = await removeBundle(slug, bundleSlug);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
