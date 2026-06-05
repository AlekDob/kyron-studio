import { uploadPortalLogo, GatewayError } from "@/lib/gateway";

interface Params {
  params: Promise<{ slug: string }>;
}

// Proxy same-origin per l'upload logo: inoltra il multipart a studio-server con
// l'auth del gateway. Il client (LogoUploader) NON deve chiamare studio-server
// direttamente (in prod l'URL non e' raggiungibile dal browser).
export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const form = await req.formData();
  try {
    const result = await uploadPortalLogo(slug, form);
    return Response.json(result);
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
