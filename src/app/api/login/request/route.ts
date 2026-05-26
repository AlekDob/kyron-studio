// Source: cms/app/api/studio/login/request/route.ts (adapted for studio standalone)
import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  OTP_COOKIE,
  OTP_TTL_S,
  generateCode,
  isAuthEnabled,
  isEmailAllowed,
  signOtpCookie,
} from "@/lib/otp";

const KYRON_DOMAIN = "kyronedu.it";
const FROM = `Studio Kyron <noreply@${KYRON_DOMAIN}>`;
const REPLY_TO = `info@${KYRON_DOMAIN}`;

function normalizeEmail(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

function loginUrl(req: Request, params: Record<string, string>): URL {
  const url = new URL("/login", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

function buildEmail(code: string): { html: string; text: string; subject: string } {
  const subject = `Codice di accesso allo studio Kyron — ${code}`;
  const text = [
    `Il tuo codice di accesso allo studio Kyron e':`,
    ``,
    `   ${code}`,
    ``,
    `Valido per 10 minuti. Se non hai richiesto tu l'accesso ignora questa email.`,
  ].join("\n");
  const html = `
<div style="font-family:Inter,system-ui,sans-serif;color:#0E4F4E;max-width:480px;margin:0 auto;padding:32px 24px">
  <p style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5C8682;margin:0 0 24px">Studio Kyron</p>
  <h1 style="font-family:'Instrument Serif',Georgia,serif;font-size:32px;font-weight:400;margin:0 0 16px;line-height:1.1">Codice di accesso</h1>
  <p style="margin:0 0 24px;color:#0E4F4E">Inserisci questo codice nella pagina di accesso allo studio.</p>
  <div style="background:#E8F1EF;border-radius:12px;padding:20px 24px;text-align:center;margin:0 0 24px">
    <span style="font-family:'JetBrains Mono',monospace;font-size:32px;letter-spacing:.24em;color:#0E4F4E">${code}</span>
  </div>
  <p style="margin:0;color:#5C8682;font-size:14px">Valido per 10 minuti. Se non hai richiesto tu l'accesso, ignora questa email.</p>
</div>`.trim();
  return { html, text, subject };
}

export async function POST(req: Request) {
  const form = await req.formData();
  const email = normalizeEmail(form.get("email"));

  if (!isAuthEnabled()) {
    return NextResponse.redirect(loginUrl(req, { error: "disabled" }), 303);
  }
  if (!email || !email.includes("@")) {
    return NextResponse.redirect(loginUrl(req, { error: "email" }), 303);
  }
  if (!isEmailAllowed(email)) {
    return NextResponse.redirect(
      loginUrl(req, { error: "unauthorized", email }),
      303,
    );
  }

  const code = generateCode();
  const { html, text, subject } = buildEmail(code);

  let sent: "ok" | "err" | "nokey" = "nokey";
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const r = await resend.emails.send({
        from: FROM,
        to: [email],
        replyTo: REPLY_TO,
        subject,
        text,
        html,
      });
      sent = r.error ? "err" : "ok";
      if (r.error) console.error("[login/request] Resend error:", r.error);
    } catch (err) {
      console.error("[login/request] threw:", (err as Error).message);
      sent = "err";
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[login/request] (dev) OTP per ${email}: ${code}`);
  }

  const res = NextResponse.redirect(
    loginUrl(req, { step: "otp", email, sent }),
    303,
  );
  res.cookies.set(OTP_COOKIE, signOtpCookie(email, code), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(req.url).protocol === "https:",
    path: "/",
    maxAge: OTP_TTL_S,
  });
  return res;
}
