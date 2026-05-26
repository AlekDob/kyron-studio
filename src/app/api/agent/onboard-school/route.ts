import { NextRequest } from "next/server";
import { headers } from "next/headers";

const STUDIO_SERVER_URL =
  process.env.STUDIO_SERVER_URL ?? "http://localhost:8790";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const cookieHeader = (await headers()).get("cookie") ?? "";

  const upstream = await fetch(
    `${STUDIO_SERVER_URL}/agents/onboard-school`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant": "kyron",
        Cookie: cookieHeader,
      },
      body,
    },
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
