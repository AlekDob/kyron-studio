"use client";

// Fase B pipeline onboarding: bottone "Abilita su Saleor" nel dettaglio
// portale. Chiama il seed server-side (staging+prod, idempotente) e mostra il
// report. Sostituisce il giro manuale "mail con prompt -> Claude Code locale".
import { useCallback, useState } from "react";
import { Rocket, Loader2, Check, AlertTriangle } from "lucide-react";

interface TargetReport {
  target: "staging" | "prod";
  channelId: string;
  productsPublished: number;
  promotionsApplied: number;
  vouchers: Record<string, string>;
  promotionsOnSale: boolean | null;
}

interface EnableResult {
  slug: string;
  targets: TargetReport[];
  emailSent: boolean;
  error?: string;
}

interface Props {
  slug: string;
  status: string;
  onDone?: () => void;
}

export function EnablePortalButton({ slug, status, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EnableResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/portals/${slug}/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = (await res.json()) as EnableResult;
      if (!res.ok || json.error) {
        setError(json.error ?? `Errore ${res.status}`);
      } else {
        setResult(json);
        onDone?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete");
    } finally {
      setBusy(false);
    }
  }, [slug, onDone]);

  const alreadyLive = status === "onboarded";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 self-start rounded-[var(--radius-control)] bg-[var(--color-ink)] px-3.5 py-2 text-xs font-semibold text-[var(--color-paper)] transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Rocket className="h-3.5 w-3.5" />
        )}
        {busy
          ? "Abilitazione in corso (1-2 min)..."
          : alreadyLive
            ? "Ri-esegui seed Saleor"
            : "Abilita su Saleor (staging + prod)"}
      </button>

      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-red-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-1 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] p-3 text-xs text-[var(--color-ink)]">
          {result.targets.map((t) => (
            <p key={t.target} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold uppercase">{t.target}</span>
              <span className="text-[var(--color-ink-muted)]">
                channel {t.channelId} - {t.productsPublished} prodotti -{" "}
                {Object.keys(t.vouchers).length} voucher
                {t.promotionsOnSale === false ? " - sconti in coda (recalc)" : ""}
              </span>
            </p>
          ))}
          <p className="text-[var(--color-ink-muted)]">
            {result.emailSent
              ? "Email di notifica inviata."
              : "Email di notifica NON inviata (Resend non configurato?)."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
