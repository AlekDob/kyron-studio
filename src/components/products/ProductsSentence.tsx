"use client";
// La testata dei Prodotti e' una frase: "Ecco i prodotti di <categoria> su
// <portale>, ordinati per <ordinamento>". Le parti dinamiche sono chip che
// aprono un popover per cambiarle a mano.
//
// La frase e' lo specchio del filtro corrente: quando Teo filtra dalla chat
// scrive lo stesso `filter` (via URL), quindi i chip si aggiornano da soli e si
// legge a parole cosa sta guardando l'agente.
import { Plus, Sparkles } from "lucide-react";
import { Popover } from "@/components/ui";
import { agentNameOf } from "@/components/shell/modules";
import { focusAgentChat } from "@/lib/focus-agent-chat";
import { Chip, Options } from "@/components/orders/sentence-chips";
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
  const agent = agentNameOf("products");
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

      {/* Cercato da Teo: si vede nella frase, altrimenti la lista sarebbe
          filtrata e non si capirebbe da cosa. Cliccandolo si azzera. */}
      {filter.query && (
        <>
          <span>che contengono</span>
          <button type="button" onClick={() => onChange({ query: "", source: "browse" })}>
            <Chip tone="indigo">{`“${filter.query}” ×`}</Chip>
          </button>
        </>
      )}

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

      <span>·</span>

      {/* La ricerca libera non e' un campo: la fa l'agente, che sa cercare per
          nome, SKU o categoria. Il link porta il cursore nella sua chat. */}
      <button
        type="button"
        onClick={focusAgentChat}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-ink)]"
      >
        <Sparkles size={13} aria-hidden="true" />
        oppure chiedi una ricerca a {agent}
      </button>

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
