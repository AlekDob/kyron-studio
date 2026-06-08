import crypto from "node:crypto";
import { cookies } from "next/headers";

const REVIEW_COOKIE = "kyron-rev";

function secret(): string {
  return (
    process.env.KYRON_REVIEW_SECRET ||
    process.env.PAYLOAD_SECRET ||
    "kyron-review-insecure-dev"
  );
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export type StudioRole = "admin" | "editor";

function verifyReviewCookie(
  raw: string | undefined,
): { email: string; role: StudioRole } | null {
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
    const { email, role, exp } = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as { email?: string; role?: string; exp?: number };
    if (!email || typeof exp !== "number" || exp < Date.now()) return null;
    // Brain: feature-008 — cookie legacy senza role → editor (meno privilegi).
    return { email, role: role === "admin" ? "admin" : "editor" };
  } catch {
    return null;
  }
}

export interface StudioUser {
  email: string;
  role: StudioRole;
}

export async function getCurrentUser(): Promise<StudioUser | null> {
  // Dev bypass: in locale il cookie kyron-rev non e' cross-subdomain
  // (host-only su localhost:3000). Setta STUDIO_DEV_USER=tuo@email per
  // bypassare la verifica e iterare sull'UI senza dover loggare ogni volta.
  // In dev l'utente bypass e' admin (vede tutte le sezioni). In produzione
  // questa env NON va settata.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.STUDIO_DEV_USER
  ) {
    return { email: process.env.STUDIO_DEV_USER, role: "admin" };
  }
  const cookieStore = await cookies();
  const raw = cookieStore.get(REVIEW_COOKIE)?.value;
  return verifyReviewCookie(raw);
}

export function isAdmin(user: StudioUser | null): boolean {
  return user?.role === "admin";
}

export function loginUrl(next?: string): string {
  const base = "/login";
  if (next && next.startsWith("/")) {
    return `${base}?next=${encodeURIComponent(next)}`;
  }
  return base;
}
