"use client";

// Esito del controllo documenti 104. Read-only: mostra cosa l'agente ha
// verificato, non solo il verdetto — serve a capire se fidarsi.
import type { ReactElement } from "react";
import { CheckCircle2, AlertTriangle, XCircle, FileText } from "lucide-react";

export interface DocCheckReportData {
  esito: "ok" | "incompleto" | "errato";
  sintesi: string;
  documentiRilevati: Array<{
    tipo: string;
    intestatario: string;
    ente: string | null;
    data: string | null;
    leggibile: boolean;
  }>;
  problemi: Array<{ cosa: string; gravita: "blocco" | "attenzione" }>;
  confrontoOrdine: {
    intestatarioCoincide: boolean;
    prodottiCoerenti: boolean;
    note: string;
  } | null;
}

interface Props {
  report: DocCheckReportData;
  files?: string[];
  orderNumber?: string | null;
}

const ESITO = {
  ok: {
    label: "Documentazione completa",
    Icon: CheckCircle2,
    tone: "bg-[var(--color-positive)]/10 text-[var(--color-positive)]",
  },
  incompleto: {
    label: "Documentazione incompleta",
    Icon: AlertTriangle,
    tone: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  },
  errato: {
    label: "Documentazione non valida",
    Icon: XCircle,
    tone: "bg-[var(--color-critical)]/10 text-[var(--color-critical)]",
  },
} as const;

export function DocCheckReport({ report, files, orderNumber }: Props): ReactElement {
  const esito = ESITO[report.esito] ?? ESITO.incompleto;
  const { Icon } = esito;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className={`flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 ${esito.tone}`}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium">{esito.label}</span>
        {orderNumber && <span className="ml-auto text-xs opacity-80">Ordine #{orderNumber}</span>}
      </div>

      <p className="mt-3 text-sm text-[var(--color-ink)]">{report.sintesi}</p>

      {report.problemi.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {report.problemi.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  p.gravita === "blocco"
                    ? "bg-[var(--color-critical)]"
                    : "bg-[var(--color-warning)]"
                }`}
                aria-hidden="true"
              />
              <span className="text-[var(--color-ink)]">
                {p.cosa}
                {p.gravita === "attenzione" && (
                  <span className="ml-1 text-xs text-[var(--color-ink-muted)]">(da verificare)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {report.documentiRilevati.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            Documenti letti
          </p>
          <ul className="space-y-2">
            {report.documentiRilevati.map((d, i) => (
              <li
                key={i}
                className="rounded-[var(--radius-card)] border border-[var(--color-line)] px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" aria-hidden="true" />
                  <span className="font-medium text-[var(--color-ink)]">{d.tipo}</span>
                  {!d.leggibile && (
                    <span className="rounded-[var(--radius-pill)] bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs text-[var(--color-warning)]">
                      poco leggibile
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  {[d.intestatario, d.ente, d.data].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.confrontoOrdine && (
        <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--color-paper-muted)] px-3 py-2.5">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            Confronto con l&apos;ordine
          </p>
          <p className="text-sm text-[var(--color-ink)]">
            Intestatario:{" "}
            {report.confrontoOrdine.intestatarioCoincide ? "coincide" : "NON coincide"} · Prodotti:{" "}
            {report.confrontoOrdine.prodottiCoerenti ? "coerenti" : "da verificare"}
          </p>
          {report.confrontoOrdine.note && (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{report.confrontoOrdine.note}</p>
          )}
        </div>
      )}

      {files && files.length > 0 && (
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">Analizzati: {files.join(", ")}</p>
      )}
    </div>
  );
}
