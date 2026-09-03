"use client";
// La testata dei Portali e' una frase: "Ecco i portali di <citta'> in stato
// <stato>, ordinati per <ordinamento>". Le parti dinamiche sono chip che aprono
// un popover per cambiarle a mano.
//
// La frase e' lo specchio del filtro corrente: quando Livia filtra dalla chat
// scrive lo stesso `filter` (via URL), quindi i chip si aggiornano da soli.
import { Popover } from "@/components/ui";
import { Chip, Options } from "@/components/orders/sentence-chips";
import { SearchChip } from "@/components/orders/search-chip";
import { ORDER_LABELS, STATUS_LABELS, type PortalsFilter } from "./portals-filter";

interface Props {
  filter: PortalsFilter;
  cities: string[];
  onChange: (patch: Partial<PortalsFilter>) => void;
}

export function PortalsSentence({ filter, cities, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-[var(--color-ink-soft)]">
      <span>Ecco i portali di</span>

      <Popover
        label="Citta'"
        trigger={
          <Chip tone="amber">{filter.city === "all" ? "tutte le citta'" : filter.city}</Chip>
        }
      >
        {(close) => (
          <Options
            value={filter.city}
            onPick={(v) => {
              onChange({ city: v, source: "browse" });
              close();
            }}
            options={[
              { value: "all", label: "Tutte le citta'" },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
        )}
      </Popover>

      <span>in stato</span>

      <Popover
        label="Stato"
        trigger={
          <Chip tone="sky">
            {filter.status === "all" ? "qualsiasi" : STATUS_LABELS[filter.status]}
          </Chip>
        }
      >
        {(close) => (
          <Options
            value={filter.status}
            onPick={(v) => {
              onChange({ status: v as PortalsFilter["status"], source: "browse" });
              close();
            }}
            options={[
              { value: "all", label: "Qualsiasi stato" },
              { value: "live", label: STATUS_LABELS.live },
              { value: "bozze", label: STATUS_LABELS.bozze },
            ]}
          />
        )}
      </Popover>

      {/* Ricerca libera: a mano dal chip, o scritta da Livia dalla chat. In
          entrambi i casi finisce in `filter.query`, quindi il chip e' uno. */}
      <SearchChip query={filter.query} onChange={onChange} hint="nome, citta' o codice" />

      <span>, ordinati per</span>

      <Popover
        label="Ordinamento"
        trigger={<Chip tone="violet">{ORDER_LABELS[filter.order]}</Chip>}
      >
        {(close) => (
          <Options
            value={filter.order}
            onPick={(v) => {
              onChange({ order: v as PortalsFilter["order"], source: "browse" });
              close();
            }}
            options={[
              { value: "nome", label: "Nome" },
              { value: "prodotti", label: "Piu' prodotti" },
              { value: "recenti", label: "Piu' recenti" },
            ]}
          />
        )}
      </Popover>

    </div>
  );
}
