"use client";

import { useMemo, useState, type ReactElement } from "react";

export interface BundleBuilderProduct {
  // Chiave univoca di riga: slug (prodotto intero), `slug#capacitySlug` (taglio)
  // o `slug#variantSku` (riga-variante protezione, es. Kyron Shield 24/36).
  id: string;
  slug: string;
  name: string;
  priceEur: number;
  category: string;
  capacity?: string; // display, es. "128GB"
  capacitySlug?: string; // slug Saleor del valore, es. "128gb"
  // Valorizzati solo per le righe-variante protezione (Kyron Shield 24/36).
  variantSku?: string; // SKU Saleor della variante, es. "KSHIELD24"
  variantLabel?: string; // display, es. "24 mesi"
  isProtectionPlan?: boolean;
}

// Componente del kit: prodotto intero (solo slug), taglio (slug + capacitySlug)
// o variante protezione fissa (slug + variantSku).
export interface BundleComponentRow {
  slug: string;
  capacitySlug?: string;
  variantSku?: string;
}

export interface BundleBuilderProps {
  products: BundleBuilderProduct[];
  readOnly?: boolean;
  disabled?: boolean;
  initialName?: string;
  initialPriceEur?: number;
  // Chiavi-riga (rowId) preselezionate, per il replay readonly post-submit.
  initialComponents?: string[];
  onSubmit?: (data: {
    name: string;
    priceEur: number;
    components: BundleComponentRow[];
  }) => void;
}

const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function BundleBuilder(props: BundleBuilderProps): ReactElement {
  const {
    products,
    readOnly = false,
    disabled = false,
    initialName = "",
    initialPriceEur,
    initialComponents = [],
    onSubmit,
  } = props;

  const [name, setName] = useState(initialName);
  const [priceText, setPriceText] = useState(
    initialPriceEur != null ? String(initialPriceEur) : "",
  );
  const [components, setComponents] = useState<Set<string>>(
    () => new Set(initialComponents),
  );
  const [submittedLocal, setSubmittedLocal] = useState(false);

  const locked = submittedLocal || readOnly || disabled;

  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const fullPrice = useMemo(
    () =>
      products
        .filter((p) => components.has(p.id))
        .reduce((sum, p) => sum + p.priceEur, 0),
    [products, components],
  );

  const parsedPrice = parseFloat(priceText.replace(",", "."));
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const canSubmit =
    !locked && name.trim().length > 0 && components.size > 0 && priceValid;

  function toggleComponent(id: string): void {
    if (locked) return;
    setComponents((prev) => {
      const next = new Set(prev);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm(): void {
    if (!canSubmit) return;
    setSubmittedLocal(true);
    const comps: BundleComponentRow[] = Array.from(components).flatMap((id) => {
      const p = byId.get(id);
      if (!p) return [];
      if (p.variantSku) return [{ slug: p.slug, variantSku: p.variantSku }];
      if (p.capacitySlug) return [{ slug: p.slug, capacitySlug: p.capacitySlug }];
      return [{ slug: p.slug }];
    });
    onSubmit?.({
      name: name.trim(),
      priceEur: parsedPrice,
      components: comps,
    });
  }

  const savings =
    priceValid && fullPrice > 0 ? fullPrice - parsedPrice : 0;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-[var(--color-ink)]">
          Componi il kit
        </h4>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {components.size} su {products.length} prodotti
        </span>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
            Nome kit
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={locked}
            placeholder="es. Kit base prima media"
            className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-line-strong)] focus:outline-none disabled:opacity-50"
          />
        </label>

        <label className="flex w-full flex-col gap-1 sm:w-40">
          <span className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
            Prezzo kit
          </span>
          <div className="flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-sm focus-within:border-[var(--color-line-strong)]">
            <input
              type="text"
              inputMode="decimal"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              disabled={locked}
              placeholder="29.90"
              className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none disabled:opacity-50"
            />
            <span className="text-xs text-[var(--color-ink-muted)]">EUR</span>
          </div>
        </label>
      </div>

      <ul className="flex flex-col gap-2">
        {products.map((p) => {
          const isChecked = components.has(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => toggleComponent(p.id)}
                aria-pressed={isChecked}
                className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-left text-sm transition-colors ${
                  isChecked
                    ? "border-[var(--color-action)] bg-[var(--color-action-soft,var(--color-paper-muted))]"
                    : "border-[var(--color-line)] hover:border-[var(--color-line-strong)]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="flex flex-col">
                  <span className="font-medium text-[var(--color-ink)]">
                    {p.name}
                  </span>
                  <span className="text-xs text-[var(--color-ink-muted)]">
                    {p.category} ·{" "}
                    {p.variantLabel
                      ? `${p.slug} · ${p.variantLabel}`
                      : p.capacity
                        ? `${p.slug} · ${p.capacity}`
                        : p.slug}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-[var(--color-ink)]">
                    {EURO.format(p.priceEur)}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${
                      isChecked
                        ? "border-[var(--color-action)] bg-[var(--color-action)] text-[var(--color-paper)]"
                        : "border-[var(--color-line-strong)]"
                    }`}
                  >
                    {isChecked ? (
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
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--color-line)] pt-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-[var(--color-ink-muted)]">
            Somma componenti
          </span>
          <span className="tabular-nums text-[var(--color-ink)]">
            {EURO.format(fullPrice)}
          </span>
        </div>
        {savings > 0 ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[var(--color-ink-muted)]">
              Sconto kit
            </span>
            <span className="tabular-nums text-[var(--color-action)]">
              −{EURO.format(savings)}
            </span>
          </div>
        ) : null}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-[var(--color-ink-muted)]">
            Prezzo finale
          </span>
          <span className="tabular-nums font-medium text-[var(--color-ink)]">
            {priceValid ? EURO.format(parsedPrice) : "—"}
          </span>
        </div>
      </div>

      {!readOnly ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] transition-opacity hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {submittedLocal ? "Salvato" : "Salva kit"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
