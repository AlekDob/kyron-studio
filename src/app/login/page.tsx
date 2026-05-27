import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OTP_COOKIE, verifyOtpCookie, isAuthEnabled } from "@/lib/otp";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Accedi — Studio Kyron",
  robots: { index: false, follow: false },
};

const T = {
  eyebrow: "Studio Kyron",
  title: "Accedi allo studio",
  intro:
    "Lo studio e' il centro di controllo di Kyron. Inserisci l'email autorizzata: ti mandiamo un codice per entrare.",
  emailLabel: "Email",
  emailSubmit: "Invia il codice",
  otpTitle: "Inserisci il codice",
  otpIntro: (email: string) =>
    `Abbiamo inviato un codice a 6 cifre a ${email}. E' valido per 10 minuti.`,
  otpLabel: "Codice",
  otpSubmit: "Entra nello studio",
  changeEmail: "Usa un'altra email",
  errors: {
    email: "Inserisci un'email valida.",
    code: "Codice non valido. Controlla l'email e riprova.",
    expired: "Codice scaduto. Richiedine uno nuovo.",
    unauthorized: "Email non autorizzata. Contatta il referente del progetto.",
    disabled: "Studio non disponibile in questo ambiente.",
  } as Record<string, string>,
};

interface Props {
  searchParams: Promise<{
    step?: string;
    email?: string;
    error?: string;
    sent?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: Props) {
  if (!isAuthEnabled()) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const user = await getCurrentUser();
  if (user) redirect("/");

  const { step, email = "", error, sent, next } = await searchParams;
  const t = T;
  const isOtpStep = step === "otp" && email;
  const errorMsg = error ? t.errors[error] : null;
  const nextPath = next && next.startsWith("/") ? next : "/";

  let devCode: string | null = null;
  let sentNotice: string | null = null;
  if (isOtpStep) {
    if (sent === "err") {
      sentNotice = "Invio email fallito. Controlla i log o usa il codice dev.";
    } else if (sent === "nokey") {
      sentNotice = "RESEND_API_KEY mancante — codice nei log dev.";
    }
    if (process.env.NODE_ENV !== "production" && sent !== "ok") {
      const jar = await cookies();
      const otp = verifyOtpCookie(jar.get(OTP_COOKIE)?.value);
      if (otp) devCode = otp.code;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--color-paper)]">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-3">{t.eyebrow}</p>
        <h1 className="text-3xl font-medium tracking-tight mb-3">
          {isOtpStep ? t.otpTitle : t.title}
        </h1>
        <p className="text-[var(--color-ink-muted)] text-sm mb-6 max-w-sm">
          {isOtpStep ? t.otpIntro(email) : t.intro}
        </p>
        {errorMsg && (
          <p className="text-sm text-[var(--color-critical,#b00020)] mb-4">{errorMsg}</p>
        )}
        {sentNotice && (
          <p className="text-sm text-[var(--color-ink-muted)] mb-4 italic">{sentNotice}</p>
        )}
        {devCode && (
          <p className="text-sm mb-4 font-mono bg-[var(--color-paper-soft)] border border-[var(--color-line)] rounded-lg px-3 py-2">
            DEV — codice: <strong>{devCode}</strong>
          </p>
        )}

        {isOtpStep ? (
          <form
            method="post"
            action="/api/login/verify"
            className="space-y-4"
          >
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label
                htmlFor="otp"
                className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2"
              >
                {t.otpLabel}
              </label>
              <input
                id="otp"
                name="code"
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3 text-base font-mono tracking-[0.3em] text-center focus:border-[var(--color-ink)] outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[var(--color-action)] text-[var(--color-paper)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors"
            >
              {t.otpSubmit}
            </button>
            <a
              href={`/login${next ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
              className="block text-center text-sm text-[var(--color-ink-muted)] underline-offset-4 hover:underline"
            >
              {t.changeEmail}
            </a>
          </form>
        ) : (
          <form
            method="post"
            action="/api/login/request"
            className="space-y-4"
          >
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2"
              >
                {t.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                required
                autoComplete="email"
                inputMode="email"
                autoFocus
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3 text-base focus:border-[var(--color-ink)] outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[var(--color-action)] text-[var(--color-paper)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-action-hover)] transition-colors"
            >
              {t.emailSubmit}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
