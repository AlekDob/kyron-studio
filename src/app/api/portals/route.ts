import { listPortals } from "@/lib/gateway";

export async function GET() {
  const portals = await listPortals();
  return Response.json(portals);
}
