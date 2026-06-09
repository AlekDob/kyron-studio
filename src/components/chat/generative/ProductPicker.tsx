"use client";

import { useMemo, useState, type ReactElement } from "react";
import {
  ProductRow,
  parseValue,
  rowId,
  type DiscountDraft,
  type ProductDiscount,
  type ProductPickerProduct,
} from "./ProductPickerRow";

export type { ProductPickerProduct, ProductDiscount } from "./ProductPickerRow";

// Riga selezionata: prodotto intero (solo slug) o taglio (slug + capacitySlug).
export interface PickerSelectionRow {
  slug: string;
  capacitySlug?: string;
}

export interface ProductPickerProps {
  products: ProductPickerProduct[];
  multi: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  // Chiavi-riga (rowId) preselezionate, per il replay readonly post-submit.
  initialSelection?: string[];
  initialDiscounts?: ProductDiscount[];
  onSubmit?: (data: {
    selections: PickerSelectionRow[];
    productDiscounts: ProductDiscount[];
  }) => void;
}

function initialDraftMap(
  discounts: ProductDiscount[],
): Record<string, DiscountDraft> {
  const map: Record<string, DiscountDraft> = {};
  for (const d of discounts)
    map[rowId(d.slug, d.capacitySlug)] = { kind: d.kind, value: String(d.value) };
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
  // Mappa chiave-riga (id) → prodotto, per risalire a slug/capacitySlug al submit.
  const byId = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggle(id: string): void {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(multi ? prev : []);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(): void {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filtered) {
        if (allFilteredSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  function setDraft(id: string, patch: Partial<DiscountDraft>): void {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        kind: prev[id]?.kind ?? "percent",
        value: prev[id]?.value ?? "",
        ...patch,
      },
    }));
  }

  function handleConfirm(): void {
    if (locked || selected.size === 0) return;
    setSubmittedLocal(true);
    const selections: PickerSelectionRow[] = [];
    const productDiscounts: ProductDiscount[] = [];
    for (const id of selected) {
      const p = byId.get(id);
      if (!p) continue;
      selections.push(
        p.capacitySlug ? { slug: p.slug, capacitySlug: p.capacitySlug } : { slug: p.slug },
      );
      const d = drafts[id];
      const value = d ? parseValue(d.value) : 0;
      if (value > 0) {
        productDiscounts.push({
          slug: p.slug,
          ...(p.capacitySlug ? { capacitySlug: p.capacitySlug } : {}),
          kind: d.kind,
          value,
        });
      }
    }
    onSubmit?.({ selections, productDiscounts });
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

      {multi && !locked ? (
        <p className="mb-3 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          Sconto per prodotto (opzionale): seleziona un prodotto, scrivi un valore
          e usa il tasto unita&apos; per scegliere{" "}
          <span className="font-medium text-[var(--color-ink)]">%</span> = sconto
          percentuale oppure{" "}
          <span className="font-medium text-[var(--color-ink)]">&euro;</span> =
          prezzo finale. Il prezzo netto appare accanto all&apos;originale.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <li className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-line)] px-3 py-4 text-center text-xs text-[var(--color-ink-muted)]">
            Nessun prodotto corrisponde a &ldquo;{query}&rdquo;
          </li>
        ) : null}
        {filtered.map((p) => (
          <li key={p.id}>
            <ProductRow
              product={p}
              selected={selected.has(p.id)}
              multi={multi}
              locked={locked}
              readOnly={readOnly}
              draft={drafts[p.id]}
              onToggle={() => toggle(p.id)}
              onDraft={(patch) => setDraft(p.id, patch)}
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
