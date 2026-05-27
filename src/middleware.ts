import { NextResponse, type NextRequest } from "next/server";

const REVIEW_COOKIE = "kyron-rev";
const MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): string {
  return (
    process.env.KYRON_REVIEW_SECRET ||
    process.env.PAYLOAD_SECRET ||
    "kyron-review-insecure-dev"
  );
}

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

async function signCookie(email: string): Promise<string> {
  const payload = JSON.stringify({
    email,
    exp: Date.now() + MAX_AGE * 1000,
  });
  const data = btoa(payload)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const sig = await hmac(data);
  return `${data}.${sig}`;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.next();
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.STUDIO_DEV_USER &&
    !req.cookies.get(REVIEW_COOKIE)
  ) {
    const value = await signCookie(process.env.STUDIO_DEV_USER);
    res.cookies.set(REVIEW_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: MAX_AGE,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|login|favicon.ico).*)"],
};
