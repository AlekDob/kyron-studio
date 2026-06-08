import { NextResponse } from "next/server";
import { REVIEW_COOKIE, OTP_COOKIE } from "@/lib/otp";

// Brain: feature-008 — logout: cancella il cookie di sessione kyron-rev (stesso
// domain cross-subdomain con cui e' stato settato) e rimanda al login. Serve
// anche per "rinfrescare" il ruolo dopo un cambio (re-login → cookie con role
// aggiornato).
function redirectBase(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "")?.trim();
  return env || new URL(req.url).origin;
}

function clearAndRedirect(req: Request): NextResponse {
  const res = NextResponse.redirect(new URL("/login", redirectBase(req)), 303);
  const base = {
    path: "/",
    maxAge: 0,
    domain: process.env.KYRON_COOKIE_DOMAIN || undefined,
  };
  res.cookies.set(REVIEW_COOKIE, "", base);
  res.cookies.set(OTP_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  return clearAndRedirect(req);
}

// GET permette il logout via semplice link <a href="/api/logout"> senza JS.
export async function GET(req: Request) {
  return clearAndRedirect(req);
}
