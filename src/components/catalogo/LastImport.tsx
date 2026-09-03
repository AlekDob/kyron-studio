"use client";

import { useState, type ReactElement } from "react";
import { Pill } from "@/components/ui";
import { Section, InfoRow } from "@/components/orders/drawer-primitives";
import { eur } from "@/components/catalogo/catalog-view";
import type { DaneaImportLog, DaneaImportRow } from "@/lib/products";

// Riepilogo dell'ultimo listino Danea caricato: cosa, quando, con che esito.
// Sta in testa al wizard di import perche' e' la prima domanda che ci si fa
// prima di ricaricare un file ("l'ho gia' fatto?").
//
// Il dato arriva dalla pagina (server component), non da un fetch: cambia solo
// quando qualcuno importa, e dopo l'import il workspace fa gia' router.refresh().

const STATUS: Record<DaneaImportRow["status"], { label: string; variant: "accent" | "warning" | "neutral" }> = {
  new: { label: "Nuovo", variant: "accent" },
  changed: { label: "Prezzo diverso", variant: "warning" },
  unchanged: { label: "Invariato", variant: "neutral" },
};

/** "28 ago 2026, 17:15" — data e ora, perche' due import nello stesso giorno sono normali. */
export function importDate(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RowLine({ row }: { row: DaneaImportRow }): ReactElement {
  const status = STATUS[row.status];
  return (
    <li className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] py-2 text-sm last:border-0">
      <div className="min-w-0">
        <p className="truncate font-medium">{row.sku}</p>
        <p className="truncate text-xs text-[var(--color-ink-muted)]">{row.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* Sul cambio prezzo si vede da dove a dove: e' il numero che interessa. */}
        {row.status === "changed" && (
          <span className="text-xs text-[var(--color-ink-muted)] line-through">
            {eur(row.currentPriceEur)}
          </span>
        )}
        {row.priceEur !== null && <span className="text-xs font-medium">{eur(row.priceEur)}</span>}
        <Pill size="sm" variant={status.variant}>
          {status.label}
        </Pill>
      </div>
    </li>
  );
}

export function LastImport({ log }: { log: DaneaImportLog | null }): ReactElement | null {
  const [open, setOpen] = useState(false);
  if (!log) return null;

  const rows = log.rows ?? [];
  const totals = log.totals;

  return (
    <div className="mb-4 rounded-xl border border-[var(--color-line)] p-4">
      <Section title="Ultimo import">
        <InfoRow label="File" value={log.filename} />
        <InfoRow label="Caricato" value={importDate(log.uploadedAt)} />
        <InfoRow
          label="Applicato"
          value={log.appliedAt ? importDate(log.appliedAt) : "no, solo letto"}
        />
        <InfoRow label="Righe nel file" value={log.recordCount ?? rows.length} />
        {totals && (
          <>
            <InfoRow label="Prodotti creati" value={totals.newProducts} />
            <InfoRow label="Codici nuovi" value={totals.newVariants} />
            {/* I prezzi diversi si mostrano ma non si applicano qui: passano dal
                piano prezzi, che sa dei voucher dei kit. */}
            <InfoRow label="Prezzi diversi (non applicati)" value={totals.priceChanges} />
            <InfoRow label="Invariati" value={totals.unchanged} />
          </>
        )}
      </Section>

      {rows.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 text-xs text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-ink)]"
          >
            {open ? "Nascondi le righe" : `Vedi le ${rows.length} righe`}
          </button>
          {open && (
            <ul className="mt-2 max-h-72 overflow-y-auto">
              {rows.map((row) => (
                <RowLine key={row.sku} row={row} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
