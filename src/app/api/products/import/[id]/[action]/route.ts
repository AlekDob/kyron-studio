import { NextRequest } from "next/server";
import { proxyProducts } from "../../../_proxy";

const JSON_ACTIONS = new Set(["mappings", "apply", "publish", "portals"]);
const FORM_ACTIONS = new Set(["images"]);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await ctx.params;
  if (action !== "plan") return Response.json({ error: "not found" }, { status: 404 });
  const q = req.nextUrl.searchParams.toString();
  return proxyProducts(`/import/${id}/plan${q ? `?${q}` : ""}`, { method: "GET" });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await ctx.params;
  if (action !== "mappings") return Response.json({ error: "not found" }, { status: 404 });
  return proxyProducts(`/import/${id}/mappings`, { method: "PUT", body: await req.text() });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await ctx.params;
  if (FORM_ACTIONS.has(action)) {
    return proxyProducts(`/import/${id}/${action}`, {
      method: "POST",
      body: await req.formData(),
      isForm: true,
    });
  }
  if (action === "apple") {
    return proxyProducts(`/import/${id}/apple`, { method: "POST", body: "{}" });
  }
  if (!JSON_ACTIONS.has(action)) return Response.json({ error: "not found" }, { status: 404 });
  return proxyProducts(`/import/${id}/${action}`, { method: "POST", body: await req.text() });
}
