// Source: cms/lib/studio/otp.ts (port for standalone studio.kyronedu.it)
// OTP per /login. Codice 6 cifre, valido 10 minuti. Stato NON persistito
// su DB: il codice + email + scadenza viaggiano in un cookie httpOnly
// firmato HMAC (`kyron-otp`). Reuse del secret (KYRON_REVIEW_SECRET o
// PAYLOAD_SECRET) per condividere cookie review cross-subdomain col cms.
import crypto from "node:crypto";

export const OTP_COOKIE = "kyron-otp";
export const OTP_TTL_S = 60 * 10;
export const OTP_LENGTH = 6;

function secret(): string {
  return (
    process.env.KYRON_REVIEW_SECRET ||
    process.env.PAYLOAD_SECRET ||
    "kyron-review-insecure-dev"
  );
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function hmac(data: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(data).digest());
}

export function generateCode(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(OTP_LENGTH, "0");
}

export interface OtpPayload {
  email: string;
  code: string;
  exp: number;
}

export function signOtpCookie(email: string, code: string): string {
  const payload: OtpPayload = {
    email: email.trim().toLowerCase(),
    code,
    exp: Date.now() + OTP_TTL_S * 1000,
  };
  const data = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `${data}.${hmac(data)}`;
}

export function verifyOtpCookie(raw: string | undefined): OtpPayload | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const data = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = hmac(data);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as Partial<OtpPayload>;
    if (
      !parsed.email ||
      !parsed.code ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Date.now()
    ) {
      return null;
    }
    return { email: parsed.email, code: parsed.code, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function codeMatches(input: string, expected: string): boolean {
  const a = Buffer.from(input.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const REVIEW_MAX_AGE_S = 60 * 60 * 24 * 7;
export const REVIEW_COOKIE = "kyron-rev";
export const REVIEW_COOKIE_MAX_AGE = REVIEW_MAX_AGE_S;

// Brain: feature-008-organization-users — il cookie di sessione porta anche il
// role, usato per il gating UI (mostra/nasconde sezioni admin). NB: il role nel
// cookie e' solo per la UI; l'autorizzazione reale sulle azioni admin e'
// verificata lato studio-server con lookup fresco sul DB.
export function signReviewCookie(
  email: string,
  role: "admin" | "editor" = "editor",
): string {
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    role,
    exp: Date.now() + REVIEW_MAX_AGE_S * 1000,
  });
  const data = b64url(Buffer.from(payload, "utf8"));
  return `${data}.${hmac(data)}`;
}

export function isAuthEnabled(): boolean {
  return process.env.KYRON_REVIEW_ENABLED !== "false";
}
