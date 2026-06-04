"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  ProductRow,
  parseValue,
  type DiscountDraft,
  type ProductDiscount,
  type ProductPickerProduct,
} from "./ProductPickerRow";

export type { ProductPickerProduct, ProductDiscount } from "./ProductPickerRow";

export interface ProductPickerProps {
  products: ProductPickerProduct[];
  multi: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  initialSelection?: string[];
  initialDiscounts?: ProductDiscount[];
  onSubmit?: (data: {
    selectedSlugs: string[];
    productDiscounts: ProductDiscount[];
  }) => void;
}

function initialDraftMap(
  discounts: ProductDiscount[],
): Record<string, DiscountDraft> {
  const map: Record<string, DiscountDraft> = {};
  for (const d of discounts) map[d.slug] = { kind: d.kind, value: String(d.value) };
  return map;
}

export function ProductPicker(props: ProductPickerProps): ReactElement {
  const {
    products,
    multi,
    readOnly = false,
    disabled = false,
    initialSelection = [],
    initialDiscounts = [],
    onSubmit,
  } = props;

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelection),
  );
  const [drafts, setDrafts] = useState<Record<string, DiscountDraft>>(() =>
    initialDraftMap(initialDiscounts),
  );
  const [submittedLocal, setSubmittedLocal] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterProducts(products, query), [products, query]);
  const locked = submittedLocal || readOnly || disabled;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.slug));

  function toggle(slug: string): void {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(multi ? prev : []);
      if (prev.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function toggleAll(): void {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filtered) {
        if (allFilteredSelected) next.delete(p.slug);
        else next.add(p.slug);
      }
      return next;
    });
  }

  function setDraft(slug: string, patch: Partial<DiscountDraft>): void {
    setDrafts((prev) => ({
      ...prev,
      [slug]: {
        kind: prev[slug]?.kind ?? "percent",
        value: prev[slug]?.value ?? "",
        ...patch,
      },
    }));
  }

  function handleConfirm(): void {
    if (locked || selected.size === 0) return;
    setSubmittedLocal(true);
    const productDiscounts: ProductDiscount[] = [];
    for (const slug of selected) {
      const d = drafts[slug];
      const value = d ? parseValue(d.value) : 0;
      if (value > 0) productDiscounts.push({ slug, kind: d.kind, value });
    }
    onSubmit?.({ selectedSlugs: Array.from(selected), productDiscounts });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-[var(--color-ink)]">
          Seleziona i prodotti per il portale
        </h4>
        <span className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)]">
          {multi && !locked ? (
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-[var(--radius-control)] border border-[var(--color-line)] px-2 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-line-strong)]"
            >
              {allFilteredSelected ? "Deseleziona tutti" : "Seleziona tutti"}
            </button>
          ) : null}
          <span>
            {selected.size} su {products.length}
            {multi ? "" : " (singola)"}
          </span>
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
        {filtered.map((p) => (
          <li key={p.slug}>
            <ProductRow
              product={p}
              selected={selected.has(p.slug)}
              multi={multi}
              locked={locked}
              readOnly={readOnly}
              draft={drafts[p.slug]}
              onToggle={() => toggle(p.slug)}
              onDraft={(patch) => setDraft(p.slug, patch)}
            />
          </li>
        ))}
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
// case-insensitive) almeno uno tra name/slug/category.
function filterProducts(
  products: ProductPickerProduct[],
  query: string,
): ProductPickerProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  const tokens = q.split(/\s+/);
  return products.filter((p) => {
    const haystack = `${p.name} ${p.slug} ${p.category}`.toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  });
}
