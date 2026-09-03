"use client";

import { useState, type ReactElement } from "react";
import { Button, Card } from "@/components/ui";
import { sendDdtTestMailAction } from "@/app/(authed)/agenti/actions";

const KYRON_LOGO_URL = "https://kyronedu.it/kyron-logo.png";

function previewHtml(html: string): string {
  return html.replaceAll("cid:kyron-logo", KYRON_LOGO_URL);
}

// Piano di invio di una comunicazione ai clienti. La usano sia Nico (destinatari
// dai DDT caricati) sia Bea (destinatari dalla lista clienti filtrata): non manda
// niente, mostra chi riceve, cosa riceve e cosa e' gia' partito. L'invio vero lo
// chiede l'operatore in chat.

interface Recipient {
  key: string;
  email: string;
  name: string;
  orderNumber?: string;
  group?: string;
  matched?: boolean;
}

export interface DdtMailPlanProps {
  /** Indirizzo dell'operatore loggato: precompila il campo della prova. */
  testTo?: string;
  /** Serve al server per ri-renderizzare la mail di prova. */
  importId?: string;
  plan: {
    /** Da dove arrivano i destinatari: file DDT, o descrizione del filtro clienti. */
    source: string;
    campaignId: string;
    campaign: { subject: string; heading: string; paragraphs: string[] };
    total: number;
    eligible: number;
    alreadySent: number;
    matched: number;
    excluded: number;
    blockedByAllowlist: number;
    allowlistActive: boolean;
    recipients: Recipient[];
    previews: { email: string; subject: string; html: string }[];
  };
}

export function DdtMailPlan({ plan, testTo, importId }: DdtMailPlanProps): ReactElement {
  const [preview, setPreview] = useState(0);
  const [to, setTo] = useState(testTo ?? "");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const shown = plan.previews[preview];

  // Manda il documento della scheda selezionata: la prova e' esattamente la
  // mail che l'operatore sta guardando.
  async function sendTest(): Promise<void> {
    if (!importId || sending) return;
    setSending(true);
    setNote(null);
    const res = await sendDdtTestMailAction({
      importId,
      campaignId: plan.campaignId,
      subject: plan.campaign.subject,
      heading: plan.campaign.heading,
      paragraphs: plan.campaign.paragraphs,
      previewIndex: preview,
      to,
    });
    setNote(res.ok ? `Prova inviata a ${res.to}.` : (res.error ?? "Invio fallito."));
    setSending(false);
  }

  return (
    <Card padding="md">
      <Card.Header>
        <h3 className="text-sm font-medium">Comunicazione — {plan.campaignId}</h3>
      </Card.Header>

      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        {plan.source} · {plan.eligible} da inviare · {plan.alreadySent} gia' inviate ·{" "}
        {plan.matched} agganciate a un ordine
      </p>

      {(plan.excluded > 0 || plan.blockedByAllowlist > 0) && (
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Esclusi: {plan.excluded} senza email o di test
          {plan.allowlistActive && ` · ${plan.blockedByAllowlist} fuori allowlist`}
        </p>
      )}

      {plan.allowlistActive && (
        <p className="mt-2 rounded-[var(--radius-card)] bg-[var(--color-paper-muted)] px-3 py-2 text-xs text-[var(--color-ink)]">
          Allowlist attiva: le mail partono solo verso gli indirizzi di prova.
        </p>
      )}

      {importId && shown && (
        <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="w-16 shrink-0 text-xs font-medium text-[var(--color-ink-muted)]">
              A:
            </span>
            <input
              type="email"
              aria-label="Destinatario della prova"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="tu@kyronedu.it"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none"
            />
            <Button type="button" onClick={() => void sendTest()} disabled={!to || sending}>
              {sending ? "Invio..." : "Invia prova"}
            </Button>
          </div>
          <div className="flex items-start gap-2 border-t border-[var(--color-line)] px-3 py-2">
            <span className="w-16 shrink-0 text-xs font-medium text-[var(--color-ink-muted)]">
              Oggetto:
            </span>
            <span className="text-sm text-[var(--color-ink)]">{plan.campaign.subject}</span>
          </div>
          <p className="border-t border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-xs text-[var(--color-ink-soft)]">
            {note ?? `La prova verra' inviata solo a ${to || "questo indirizzo"}. Nessun cliente dell'anteprima ricevera' la mail.`}
          </p>
        </div>
      )}

      <div className="mt-3 border-t border-[var(--color-line)] pt-2">
        {plan.campaign.paragraphs.map((p, i) => (
          <p key={i} className="mt-1 text-xs text-[var(--color-ink-soft)]">
            {p}
          </p>
        ))}
      </div>

      {shown && (
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--color-ink)]">
            Dati cliente nell'anteprima
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            Questi indirizzi cambiano solo i dati mostrati sotto. Non ricevono la prova.
          </p>
          <div className="flex items-center gap-2">
            {plan.previews.map((p, i) => (
              <button
                key={p.email}
                type="button"
                onClick={() => setPreview(i)}
                className={`truncate rounded-[var(--radius-pill)] px-2 py-1 text-xs ${
                  i === preview
                    ? "bg-[var(--color-action)] text-[var(--color-paper)]"
                    : "bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)]"
                }`}
              >
                {p.email}
              </button>
            ))}
          </div>
          {/* iframe: l'HTML della mail non entra nel DOM di Studio. */}
          <iframe
            title={`Anteprima per ${shown.email}`}
            srcDoc={previewHtml(shown.html)}
            sandbox=""
            className="mt-2 h-64 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white"
          />
        </div>
      )}

      {plan.recipients.length > 0 && (
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          <p className="text-xs font-medium text-[var(--color-ink)]">
            {plan.recipients.length} destinatari · {plan.matched} agganciati a un ordine
          </p>
          <div className="mt-2 max-h-56 overflow-auto rounded-[var(--radius-card)] border border-[var(--color-line)]">
            {plan.recipients.map((r) => (
              <div
                key={r.key}
                className="flex items-center gap-3 border-b border-[var(--color-line)] px-3 py-1.5 text-xs last:border-b-0"
              >
                <span className="w-40 shrink-0 truncate text-[var(--color-ink)]">
                  {r.name || "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[var(--color-ink-soft)]">
                  {r.email}
                </span>
                <span className="w-24 shrink-0 truncate text-[var(--color-ink-muted)]">
                  {r.orderNumber ? `Ordine ${r.orderNumber}` : "nessun ordine"}
                </span>
                <span className="w-24 shrink-0 truncate text-[var(--color-ink-muted)]">
                  {r.group}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
