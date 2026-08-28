import crypto from "node:crypto";
import { headers } from "next/headers";

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

export async function proxyProducts(
  pathAndQuery: string,
  init: { method: string; body?: BodyInit; isForm?: boolean },
): Promise<Response> {
  const cookie = (await headers()).get("cookie") ?? "";
  const headersOut: Record<string, string> = {
    "X-Tenant": "kyron",
    Cookie: buildCookie(cookie),
  };
  if (init.body && !init.isForm) headersOut["Content-Type"] = "application/json";
  const upstream = await fetch(`${STUDIO_SERVER_URL}/api/v1/products${pathAndQuery}`, {
    method: init.method,
    headers: headersOut,
    body: init.body,
  });
  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
