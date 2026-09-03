"use client";
// La testata dei Portali e' una frase: "Ecco i portali di <citta'> in stato
// <stato>, ordinati per <ordinamento>". Le parti dinamiche sono chip che aprono
// un popover per cambiarle a mano.
//
// La frase e' lo specchio del filtro corrente: quando Livia filtra dalla chat
// scrive lo stesso `filter` (via URL), quindi i chip si aggiornano da soli.
import { Sparkles } from "lucide-react";
import { Popover } from "@/components/ui";
import { agentNameOf } from "@/components/shell/modules";
import { focusAgentChat } from "@/lib/focus-agent-chat";
import { Chip, Options } from "@/components/orders/sentence-chips";
import { ORDER_LABELS, STATUS_LABELS, type PortalsFilter } from "./portals-filter";

interface Props {
  filter: PortalsFilter;
  cities: string[];
  onChange: (patch: Partial<PortalsFilter>) => void;
}

export function PortalsSentence({ filter, cities, onChange }: Props) {
  const agent = agentNameOf("portals");

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

      {/* Cercato da Livia: si vede nella frase, altrimenti la lista sarebbe
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

      <span>·</span>

      {/* La ricerca libera non e' un campo: la fa Livia, che sa cercare per nome,
          citta' o codice. Il link porta il cursore nella sua chat. */}
      <button
        type="button"
        onClick={focusAgentChat}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-ink)]"
      >
        <Sparkles size={13} aria-hidden="true" />
        oppure chiedi una ricerca a {agent}
      </button>
    </div>
  );
}
