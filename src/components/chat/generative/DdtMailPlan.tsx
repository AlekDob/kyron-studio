"use client";

import { useState, type ReactElement } from "react";
import { Card } from "@/components/ui";

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

export function DdtMailPlan({ plan }: DdtMailPlanProps): ReactElement {
  const [preview, setPreview] = useState(0);
  const shown = plan.previews[preview];

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

      {plan.recipients.length > 0 && (
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
          Primi destinatari: {plan.recipients.slice(0, 5).map((r) => r.customerName || r.email).join(", ")}
          {plan.recipients.length > 5 && ` e altri ${plan.recipients.length - 5}`}
        </p>
      )}
    </Card>
  );
}
