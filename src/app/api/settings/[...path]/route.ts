import { NextRequest } from "next/server";

const STUDIO_SERVER_URL =
  process.env.STUDIO_SERVER_URL ?? "http://localhost:8790";

async function forward(
  req: NextRequest,
  path: string[],
  method: "GET" | "PUT" | "POST",
) {
  const url = `${STUDIO_SERVER_URL}/settings/${path.map(encodeURIComponent).join("/")}`;
  const init: RequestInit = {
    method,
    headers: { "X-Tenant": "kyron" },
  };
  if (method !== "GET") {
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

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return forward(req, path, "GET");
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return forward(req, path, "PUT");
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return forward(req, path, "POST");
}
