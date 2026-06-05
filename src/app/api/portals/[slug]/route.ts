import {
  getPortal,
  updatePortal,
  deletePortal,
  GatewayError,
} from "@/lib/gateway";

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

export async function PUT(req: Request, { params }: Params) {
  const { slug } = await params;
  const patch = await req.json();
  try {
    const result = await updatePortal(slug, patch);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const result = await deletePortal(slug);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
