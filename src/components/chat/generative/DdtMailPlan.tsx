"use client";

import { useState, type ReactElement } from "react";
import { Button, Card, Input } from "@/components/ui";
import { sendDdtTestMailAction } from "@/app/(authed)/agenti/actions";

// Piano di invio della comunicazione ai clienti dei DDT caricati. Non manda
// niente: mostra chi riceve, cosa riceve e cosa e' gia' partito. L'invio vero
// lo chiede l'operatore in chat.

interface Recipient {
  docKey: string;
  email: string;
  customerName: string;
  portalSlug: string;
  orderNumber: string;
  matched: boolean;
}

export interface DdtMailPlanProps {
  /** Indirizzo dell'operatore loggato: precompila il campo della prova. */
  testTo?: string;
  /** Serve al server per ri-renderizzare la mail di prova. */
  importId?: string;
  plan: {
    filename: string;
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
        {plan.filename} · {plan.total} DDT · {plan.eligible} da inviare ·{" "}
        {plan.alreadySent} gia' inviate · {plan.matched} agganciate a un ordine
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

      <div className="mt-3 border-t border-[var(--color-line)] pt-2">
        <p className="text-xs font-medium text-[var(--color-ink)]">
          {plan.campaign.subject}
        </p>
        {plan.campaign.paragraphs.map((p, i) => (
          <p key={i} className="mt-1 text-xs text-[var(--color-ink-soft)]">
            {p}
          </p>
        ))}
      </div>

      {shown && (
        <div className="mt-3">
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
            srcDoc={shown.html}
            sandbox=""
            className="mt-2 h-64 w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white"
          />
        </div>
      )}

      {importId && shown && (
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          <p className="text-xs font-medium text-[var(--color-ink)]">Invia una prova</p>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="tu@kyronedu.it"
              className="flex-1"
            />
            <Button type="button" onClick={() => void sendTest()} disabled={!to || sending}>
              {sending ? "Invio..." : "Invia una prova"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            {note ?? `Una mail sola, con i dati di ${shown.email}. Non intacca l'invio vero.`}
          </p>
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
                key={r.docKey}
                className="flex items-center gap-3 border-b border-[var(--color-line)] px-3 py-1.5 text-xs last:border-b-0"
              >
                <span className="w-40 shrink-0 truncate text-[var(--color-ink)]">
                  {r.customerName || "—"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[var(--color-ink-soft)]">
                  {r.email}
                </span>
                <span className="w-24 shrink-0 truncate text-[var(--color-ink-muted)]">
                  {r.orderNumber ? `Ordine ${r.orderNumber}` : "nessun ordine"}
                </span>
                <span className="w-24 shrink-0 truncate text-[var(--color-ink-muted)]">
                  {r.portalSlug}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
