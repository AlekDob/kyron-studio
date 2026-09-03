"use client";
// La testata delle Richieste e' una frase: "Ecco le richieste <stato> di tipo
// <tipo>". Stessi chip di Ordini e Clienti (sentence-chips + Popover): si
// cambiano a mano, e quando li scrive Ivo dalla chat la frase si aggiorna da
// sola perche' legge lo stesso `filter`.
import { Chip, Options } from "@/components/orders/sentence-chips";
import { SearchChip } from "@/components/orders/search-chip";
import { Popover } from "@/components/ui";
import { GROUP_LABELS, REQUEST_LABELS, type RequestsFilter } from "./requests-filter";

interface Props {
  filter: RequestsFilter;
  onChange: (patch: Partial<RequestsFilter>) => void;
}

const GROUP_OPTIONS = [
  { value: "all", label: "in qualsiasi stato" },
  { value: "todo", label: GROUP_LABELS.todo },
  { value: "doing", label: GROUP_LABELS.doing },
  { value: "done", label: GROUP_LABELS.done },
];

const LABEL_OPTIONS = [
  { value: "all", label: "di qualsiasi tipo" },
  ...REQUEST_LABELS.map((l) => ({ value: l, label: l })),
];

export function RequestsSentence({ filter, onChange }: Props) {
  const groupText = filter.group === "all" ? "in qualsiasi stato" : GROUP_LABELS[filter.group];
  const labelText = filter.label === "all" ? "di qualsiasi tipo" : filter.label;

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-[var(--color-ink-soft)]">
      <span>Ecco le richieste</span>

      <Popover label="Stato" trigger={<Chip tone="sky">{groupText}</Chip>}>
        {(close) => (
          <Options
            options={GROUP_OPTIONS}
            value={filter.group}
            onPick={(v) => {
              onChange({ group: v as RequestsFilter["group"], source: "browse" });
              close();
            }}
          />
        )}
      </Popover>

      <Popover label="Tipo" trigger={<Chip tone="violet">{labelText}</Chip>}>
        {(close) => (
          <Options
            options={LABEL_OPTIONS}
            value={filter.label}
            onPick={(v) => {
              onChange({ label: v as RequestsFilter["label"], source: "browse" });
              close();
            }}
          />
        )}
      </Popover>

      <Popover
        label="Chi ha chiesto"
        trigger={<Chip tone="indigo">{filter.mine ? "aperte da me" : "di tutti"}</Chip>}
      >
        {(close) => (
          <Options
            options={[
              { value: "no", label: "di tutti" },
              { value: "yes", label: "aperte da me" },
            ]}
            value={filter.mine ? "yes" : "no"}
            onPick={(v) => {
              onChange({ mine: v === "yes", source: "browse" });
              close();
            }}
          />
        )}
      </Popover>

      {/* Ricerca libera: stesso chip delle altre sezioni, cosi' il campo non
          resta l'unico controllo diverso della frase. */}
      <SearchChip query={filter.query} onChange={onChange} hint="titolo o testo" />
    </div>
  );
}
