"use client";

import { useMemo, useState, type ReactElement } from "react";

export interface ProductPickerProduct {
  slug: string;
  name: string;
  priceEur: number;
  category: string;
  imageUrl?: string;
}

export interface ProductPickerProps {
  products: ProductPickerProduct[];
  multi: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  initialSelection?: string[];
  onSubmit?: (data: { selectedSlugs: string[] }) => void;
}

const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function ProductPicker(props: ProductPickerProps): ReactElement {
  const {
    products,
    multi,
    readOnly = false,
    disabled = false,
    initialSelection = [],
    onSubmit,
  } = props;

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelection),
  );
  const [submittedLocal, setSubmittedLocal] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterProducts(products, query), [
    products,
    query,
  ]);
  // readOnly = freeze permanente (turn vecchio gia' confermato).
  // disabled = freeze temporaneo (es. streaming in corso, evita doppi click).
  // submittedLocal = l'utente ha appena cliccato Conferma in questo render.
  const locked = submittedLocal || readOnly || disabled;

  function toggle(slug: string): void {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(multi ? prev : []);
      if (prev.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleConfirm(): void {
    if (locked || selected.size === 0) return;
    setSubmittedLocal(true);
    onSubmit?.({ selectedSlugs: Array.from(selected) });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-[var(--color-ink)]">
          Seleziona i prodotti per il portale
        </h4>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {selected.size} su {products.length}
          {multi ? "" : " (singola)"}
        </span>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={locked}
          placeholder="Cerca per nome, slug o categoria…"
          aria-label="Cerca prodotti"
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-line-strong)] focus:outline-none disabled:opacity-50"
        />
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <li className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] px-3 py-4 text-center text-xs text-[var(--color-ink-muted)]">
            Nessun prodotto corrisponde a &ldquo;{query}&rdquo;
          </li>
        ) : null}
        {filtered.map((p) => {
          const isSelected = selected.has(p.slug);
          return (
            <li key={p.slug}>
              <button
                type="button"
                disabled={locked}
                onClick={() => toggle(p.slug)}
                aria-pressed={isSelected}
                className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-[var(--color-action)] bg-[var(--color-action-soft,var(--color-paper-muted))]"
                    : "border-[var(--color-line)] bg-transparent hover:border-[var(--color-line-strong)]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="flex items-center gap-3">
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
                    <span className="font-medium text-[var(--color-ink)]">
                      {p.name}
                    </span>
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {p.category} · {p.slug}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-[var(--color-ink)]">
                    {EURO.format(p.priceEur)}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${
                      isSelected
                        ? "border-[var(--color-action)] bg-[var(--color-action)] text-[var(--color-paper)]"
                        : "border-[var(--color-line-strong)]"
                    }`}
                  >
                    {isSelected ? (
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

      {!readOnly ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={locked || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] transition-opacity hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {submittedLocal ? "Inviato" : "Conferma selezione"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// Fuzzy semplice: tokenizza la query e ogni token deve matchare (substring,
// case-insensitive, accent-fold base) almeno uno tra name/slug/category.
function filterProducts(
  products: ProductPickerProduct[],
  query: string,
): ProductPickerProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  const tokens = q.split(/\s+/);
  return products.filter((p) => {
    const haystack =
      `${p.name} ${p.slug} ${p.category}`.toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  });
}
