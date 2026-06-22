"use client";

import { useState } from "react";
import { X } from "lucide-react";

// Slugify: minuscole, non-alfanumerici -> trattino, collassa e taglia i bordi.
// Stesso vincolo del backend (SLUG_RE kebab-case). Vedi feature 007.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mappa l'errore tecnico del gateway in un messaggio leggibile (IT).
function friendlyError(msg: string): string {
  if (msg.includes("already exists")) return "Esiste gia' un portale con questo slug.";
  if (msg.includes("invalid slug")) return "Slug non valido: usa solo minuscole e trattini.";
  if (msg.includes("not found")) return "Portale sorgente non trovato.";
  return "Duplicazione fallita. Riprova.";
}

interface Props {
  sourceSlug: string;
  sourceNome: string;
  onClose: () => void;
  onConfirm: (body: { newSlug: string; newNome: string }) => Promise<void>;
}

// Popup per duplicare un portale: chiede nuovo nome + slug. Lo slug si deriva
// dal nome finche' non viene toccato a mano. Su errore resta aperto mostrando
// il messaggio (es. slug gia' esistente).
export function DuplicatePortalModal({
  sourceSlug,
  sourceNome,
  onClose,
  onConfirm,
}: Props) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNome(value: string): void {
    setNome(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSlug(value: string): void {
    setSlugTouched(true);
    setSlug(slugify(value));
  }

  async function handleConfirm(): Promise<void> {
    if (!nome.trim() || !slug) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm({ newSlug: slug, newNome: nome.trim() });
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ""));
      setBusy(false);
    }
  }

  const canConfirm = Boolean(nome.trim() && slug) && !busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="eyebrow">Duplica portale</p>
            <p className="mt-1 truncate text-xs text-[var(--color-ink-muted)]">
              Da <span className="font-mono">{sourceSlug}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-[var(--radius-control)] border border-[var(--color-line)] p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[var(--color-ink-soft)]">
          Crea una Bozza con catalogo, prodotti, sconti e kit identici a{" "}
          <span className="font-medium text-[var(--color-ink)]">{sourceNome}</span>.
          Indirizzo, codice meccanografico e logo vanno reinseriti dopo.
        </p>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--color-ink-soft)]">
            Nome scuola
          </span>
          <input
            type="text"
            value={nome}
            autoFocus
            onChange={(e) => handleNome(e.target.value)}
            placeholder="Es. Liceo Galilei"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] focus:border-[var(--color-line-strong)] focus:outline-none"
          />
        </label>

        <label className="mb-1 block">
          <span className="mb-1 block text-[11px] font-medium text-[var(--color-ink-soft)]">
            Slug (URL portale)
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlug(e.target.value)}
            placeholder="liceo-galilei"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-ink)] focus:border-[var(--color-line-strong)] focus:outline-none"
          />
        </label>
        <p className="mb-3 text-[10px] text-[var(--color-ink-muted)]">
          Minuscole e trattini. Diventa /shop/{slug || "..."}
        </p>

        {error ? (
          <p className="mb-3 rounded-[var(--radius-control)] border border-red-300 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-[var(--radius-control)] border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
            className="rounded-[var(--radius-control)] border border-[var(--color-line-strong)] bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-[var(--color-paper)] disabled:opacity-50"
          >
            {busy ? "Duplico..." : "Duplica"}
          </button>
        </div>
      </div>
    </div>
  );
}
