import { uploadMedia, GatewayError } from "@/lib/gateway";

// Proxy same-origin per l'upload media (PDF + copertine Risorse): inoltra il
// multipart a studio-server con l'auth del gateway. Il browser non raggiunge
// studio-server direttamente in prod.
export async function POST(req: Request) {
  const form = await req.formData();
  try {
    return Response.json(await uploadMedia(form));
  } catch (err) {
    if (err instanceof GatewayError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
