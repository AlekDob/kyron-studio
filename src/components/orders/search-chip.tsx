"use client";
// Ricerca libera come chip della frase-filtro: vuoto dice "Oppure fai una
// ricerca", con una query attiva mostra la query e il × per azzerarla. Lo usa
// anche l'agente senza saperlo: scrive lo stesso `filter.query`, quindi il chip
// e' uno solo per la ricerca a mano e per quella della chat.
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input, Popover } from "@/components/ui";
import { Chip } from "./sentence-chips";

interface Props {
  query: string;
  onChange: (patch: { query: string; source: "browse" }) => void;
  /** Cosa si cerca, per il placeholder: "n° ordine, cliente o Stripe". */
  hint?: string;
}

export function SearchChip({ query, onChange, hint }: Props) {
  return (
    <>
      {query && <span>che contengono</span>}
      <Popover
        label="Cerca"
        trigger={
          <Chip tone="indigo" icon={<Search size={13} aria-hidden="true" />}>
            {query ? `“${query}”` : "Oppure fai una ricerca"}
          </Chip>
        }
      >
        <SearchField query={query} onChange={onChange} hint={hint} />
      </Popover>

      {/* Il × sta fuori dal chip: dentro sarebbe un bottone in un bottone
          (il trigger del popover), che gli screen reader leggono male. */}
      {query && (
        <button
          type="button"
          aria-label="Azzera la ricerca"
          onClick={() => onChange({ query: "", source: "browse" })}
          className="rounded-full px-1 text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          ×
        </button>
      )}
    </>
  );
}

/** Campo con debounce: la lista si aggiorna dopo 300ms di pausa, non a ogni tasto. */
function SearchField({ query, onChange, hint }: Props) {
  const [q, setQ] = useState(query);

  useEffect(() => {
    if (q === query) return;
    const t = setTimeout(() => onChange({ query: q, source: "browse" }), 300);
    return () => clearTimeout(t);
  }, [q, query, onChange]);

  return (
    <Input
      size="sm"
      autoFocus
      aria-label="Cerca"
      placeholder={hint ? `Cerca per ${hint}…` : "Cerca…"}
      value={q}
      onChange={(e) => setQ(e.target.value)}
      iconLeft={<Search size={15} aria-hidden="true" />}
    />
  );
}
