// Source: cms/app/api/studio/login/verify/route.ts (adapted, no Payload SSO)
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OTP_COOKIE,
  REVIEW_COOKIE,
  REVIEW_COOKIE_MAX_AGE,
  codeMatches,
  isAuthEnabled,
  isEmailAllowed,
  signReviewCookie,
  verifyOtpCookie,
} from "@/lib/otp";

function loginUrl(req: Request, params: Record<string, string>): URL {
  const url = new URL("/login", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

function safeNextPath(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === "string" ? value : null;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return null;
  }
  return raw;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const next = safeNextPath(form.get("next")) ?? "/";
  const code = String(form.get("code") ?? "").trim();
  const emailInput = String(form.get("email") ?? "").trim().toLowerCase();

  if (!isAuthEnabled()) {
    return NextResponse.redirect(loginUrl(req, { error: "disabled" }), 303);
  }

  const jar = await cookies();
  const otp = verifyOtpCookie(jar.get(OTP_COOKIE)?.value);
  if (!otp) {
    return NextResponse.redirect(
      loginUrl(req, {
        error: "expired",
        ...(emailInput ? { email: emailInput } : {}),
      }),
      303,
    );
  }
  if (!isEmailAllowed(otp.email)) {
    return NextResponse.redirect(loginUrl(req, { error: "unauthorized" }), 303);
  }
  if (!code || !codeMatches(code, otp.code)) {
    return NextResponse.redirect(
      loginUrl(req, { step: "otp", email: otp.email, error: "code" }),
      303,
    );
  }

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(REVIEW_COOKIE, signReviewCookie(otp.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(req.url).protocol === "https:",
    path: "/",
    maxAge: REVIEW_COOKIE_MAX_AGE,
    domain: process.env.KYRON_COOKIE_DOMAIN || undefined,
  });
  res.cookies.set(OTP_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
