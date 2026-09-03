"use client";
// La testata dei Prodotti e' una frase: "Ecco i prodotti di <categoria> su
// <portale>, ordinati per <ordinamento>". Le parti dinamiche sono chip che
// aprono un popover per cambiarle a mano.
//
// La frase e' lo specchio del filtro corrente: quando Teo filtra dalla chat
// scrive lo stesso `filter` (via URL), quindi i chip si aggiornano da soli e si
// legge a parole cosa sta guardando l'agente.
import { Plus } from "lucide-react";
import { Popover } from "@/components/ui";
import { Chip, Options } from "@/components/orders/sentence-chips";
import { SearchChip } from "@/components/orders/search-chip";
import { ORDER_LABELS, type ProductsFilter } from "./products-filter";
import type { DaneaImportLog } from "@/lib/products";

interface Props {
  filter: ProductsFilter;
  categories: string[];
  portals: Array<{ slug: string; name: string }>;
  onChange: (patch: Partial<ProductsFilter>) => void;
  /** Apre il wizard di import da Danea. */
  onImport: () => void;
  /** Ultimo listino caricato: la sua data e' l'etichetta del bottone import. */
  lastImport: DaneaImportLog | null;
}

/** "28 ago" — nel chip ci sta solo questo, l'ora si legge dentro il modale. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export function ProductsSentence({ filter, categories, portals, onChange, onImport, lastImport }: Props) {
  const portalLabel =
    filter.portal === "all"
      ? "tutti i portali"
      : (portals.find((p) => p.slug === filter.portal)?.name ?? filter.portal);

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-[var(--color-ink-soft)]">
      <span>Ecco i prodotti di</span>

      <Popover
        label="Categoria"
        trigger={
          <Chip tone="amber">
            {filter.category === "all" ? "tutte le categorie" : filter.category}
          </Chip>
        }
      >
        {(close) => (
          <Options
            value={filter.category}
            onPick={(v) => {
              onChange({ category: v, source: "browse" });
              close();
            }}
            options={[
              { value: "all", label: "Tutte le categorie" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
        )}
      </Popover>

      <span>su</span>

      <Popover label="Portale" trigger={<Chip tone="sky">{portalLabel}</Chip>}>
        {(close) => (
          <Options
            value={filter.portal}
            onPick={(v) => {
              onChange({ portal: v, source: "browse" });
              close();
            }}
            options={[
              { value: "all", label: "Tutti i portali" },
              ...portals.map((p) => ({ value: p.slug, label: p.name })),
            ]}
          />
        )}
      </Popover>

      {/* Ricerca libera: a mano dal chip, o scritta da Teo dalla chat. In
          entrambi i casi finisce in `filter.query`, quindi il chip e' uno. */}
      <SearchChip query={filter.query} onChange={onChange} hint="nome, SKU o categoria" />

      <span>, ordinati per</span>

      <Popover label="Ordinamento" trigger={<Chip tone="violet">{ORDER_LABELS[filter.order]}</Chip>}>
        {(close) => (
          <Options
            value={filter.order}
            onPick={(v) => {
              onChange({ order: v as ProductsFilter["order"], source: "browse" });
              close();
            }}
            options={[
              { value: "vendite", label: "Piu' venduti" },
              { value: "nome", label: "Nome" },
              { value: "prezzo", label: "Prezzo" },
            ]}
          />
        )}
      </Popover>

      {/* Import listino Danea: sta in coda alla frase perche' e' l'unica azione
          di scrittura della testata, non un filtro. La data dell'ultimo import
          sta qui e non dentro il modale: e' l'informazione che si cerca prima
          di aprirlo, non dopo. */}
      <button
        type="button"
        onClick={onImport}
        aria-label="Importa prodotti da Danea"
        className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2 text-xs text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      >
        <Plus size={14} aria-hidden="true" />
        {lastImport && <span>Ultimo import {shortDate(lastImport.uploadedAt)}</span>}
      </button>
    </div>
  );
}
