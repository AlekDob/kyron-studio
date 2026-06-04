"use client";

import { type ReactElement } from "react";

export interface ProductPickerProduct {
  slug: string;
  name: string;
  priceEur: number;
  category: string;
  imageUrl?: string;
}

// Sconto per-prodotto. percent = % di sconto (0-100); eur = prezzo finale
// scontato in EUR. Registrato in DB + md, applicato su Saleor in onboarding.
export interface ProductDiscount {
  slug: string;
  kind: "percent" | "eur";
  value: number;
}

export interface DiscountDraft {
  kind: "percent" | "eur";
  value: string;
}

export const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function parseValue(text: string): number {
  const n = parseFloat(text.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function formatDiscount(d: ProductDiscount): string {
  return d.kind === "percent" ? `-${d.value}%` : `→ ${EURO.format(d.value)}`;
}

// Prezzo finale al netto dello sconto. percent = sconto %, eur = prezzo finale.
export function netPrice(priceEur: number, kind: "percent" | "eur", value: number): number {
  if (kind === "eur") return value;
  return Math.max(0, priceEur * (1 - value / 100));
}

interface ProductRowProps {
  product: ProductPickerProduct;
  selected: boolean;
  multi: boolean;
  locked: boolean;
  readOnly: boolean;
  draft?: DiscountDraft;
  onToggle: () => void;
  onDraft: (patch: Partial<DiscountDraft>) => void;
}

export function ProductRow(props: ProductRowProps): ReactElement {
  const { product: p, selected, multi, locked, draft, onToggle, onDraft } = props;
  const kind = draft?.kind ?? "percent";
  const showDiscountInput = selected && multi && !locked;
  // Sconto attivo sulla riga (live in edit, statico in readonly) → prezzo netto.
  const dv = draft ? parseValue(draft.value) : 0;
  const net = dv > 0 ? netPrice(p.priceEur, kind, dv) : null;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-sm transition-colors ${
        selected
          ? "border-[var(--color-action)] bg-[var(--color-action-soft,var(--color-paper-muted))]"
          : "border-[var(--color-line)]"
      }`}
    >
      <button
        type="button"
        disabled={locked}
        onClick={onToggle}
        aria-pressed={selected}
        className="flex flex-1 items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            className="h-10 w-10 shrink-0 rounded-[var(--radius-control)] bg-[var(--color-paper-muted)] object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-paper-muted)] text-xs text-[var(--color-ink-muted)]">
            ?
          </span>
        )}
        <span className="flex flex-col">
          <span className="font-medium text-[var(--color-ink)]">{p.name}</span>
          <span className="text-xs text-[var(--color-ink-muted)]">
            {p.category} · {p.slug}
          </span>
        </span>
      </button>

      <span className="flex items-center gap-3">
        {showDiscountInput ? (
          <span className="flex items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={draft?.value ?? ""}
              onChange={(e) => onDraft({ value: e.target.value })}
              placeholder={kind === "percent" ? "%" : "EUR"}
              aria-label={`Sconto ${p.name}`}
              className="w-16 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-2 py-1 text-right text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-line-strong)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onDraft({ kind: kind === "percent" ? "eur" : "percent" })}
              aria-label="Cambia unita' sconto"
              className="w-7 rounded-[var(--radius-control)] border border-[var(--color-line)] px-1 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-line-strong)]"
            >
              {kind === "percent" ? "%" : "€"}
            </button>
          </span>
        ) : null}
        <span className="flex items-center gap-2 text-sm tabular-nums">
          {net != null ? (
            <>
              <span className="text-[var(--color-ink-muted)] line-through">
                {EURO.format(p.priceEur)}
              </span>
              <span className="font-medium text-[var(--color-action)]">
                {EURO.format(net)}
              </span>
            </>
          ) : (
            <span className="text-[var(--color-ink)]">{EURO.format(p.priceEur)}</span>
          )}
        </span>
        <button
          type="button"
          disabled={locked}
          onClick={onToggle}
          aria-pressed={selected}
          aria-label={selected ? `Deseleziona ${p.name}` : `Seleziona ${p.name}`}
          className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border disabled:cursor-not-allowed ${
            selected
              ? "border-[var(--color-action)] bg-[var(--color-action)] text-[var(--color-paper)]"
              : "border-[var(--color-line-strong)]"
          }`}
        >
          {selected ? (
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : null}
        </button>
      </span>
    </div>
  );
}
