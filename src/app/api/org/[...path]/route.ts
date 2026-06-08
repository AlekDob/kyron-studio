import { NextRequest } from "next/server";

// Brain: feature-008-organization-users — proxy same-origin verso studio-server
// /api/v1/studio-users (gestione utenti + ruoli, admin-only). Inoltra X-Tenant
// e il cookie kyron-rev (auth + ruolo verificati lato server).
const STUDIO_SERVER_URL =
  process.env.STUDIO_SERVER_URL ?? "http://localhost:8790";

async function forward(
  req: NextRequest,
  path: string[],
  method: "GET" | "POST" | "PATCH" | "DELETE",
) {
  const url = `${STUDIO_SERVER_URL}/api/v1/${path.map(encodeURIComponent).join("/")}`;
  const init: RequestInit = {
    method,
    headers: {
      "X-Tenant": "kyron",
      Cookie: req.headers.get("cookie") ?? "",
    },
  };
  if (method !== "GET" && method !== "DELETE") {
    const body = await req.text();
    (init.headers as Record<string, string>)["Content-Type"] =
      req.headers.get("content-type") ?? "application/json";
    init.body = body || undefined;
  }
  const upstream = await fetch(url, init);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path, "GET");
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path, "POST");
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path, "PATCH");
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path, "DELETE");
}
