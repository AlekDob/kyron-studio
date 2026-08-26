import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { headers } from "next/headers";

// Proxy SSE verso l'agente Catalogo (Nico) di studio-server.
// Stesso pattern del proxy data-editor: inoltra il cookie kyron-rev e, in dev,
// ne firma uno da STUDIO_DEV_USER per poter provare il modulo in locale.
const STUDIO_SERVER_URL =
  process.env.STUDIO_SERVER_URL ?? "http://localhost:8790";

function secret(): string {
  return (
    process.env.KYRON_REVIEW_SECRET ||
    process.env.PAYLOAD_SECRET ||
    "kyron-review-insecure-dev"
  );
}

function signDevCookie(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 60 * 60 * 1000 }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function buildCookie(existing: string): string {
  if (process.env.NODE_ENV !== "production" && process.env.STUDIO_DEV_USER) {
    const dev = `kyron-rev=${signDevCookie(process.env.STUDIO_DEV_USER)}`;
    const stripped = existing
      .split(";")
      .map((c) => c.trim())
      .filter((c) => c && !c.startsWith("kyron-rev="))
      .join("; ");
    return stripped ? `${stripped}; ${dev}` : dev;
  }
  return existing;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const cookie = (await headers()).get("cookie") ?? "";

  const upstream = await fetch(`${STUDIO_SERVER_URL}/agents/commesso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant": "kyron",
      Cookie: buildCookie(cookie),
    },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
