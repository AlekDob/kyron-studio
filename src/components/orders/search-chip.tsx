"use client";
// Ricerca libera come chip della frase-filtro: vuoto dice "Oppure fai una
// ricerca", con una query attiva mostra la query e il × per azzerarla. Lo usa
// anche l'agente senza saperlo: scrive lo stesso `filter.query`, quindi il chip
// e' uno solo per la ricerca a mano e per quella della chat.
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useIsMobile } from "@/lib/use-is-mobile";
import { Input, Popover } from "@/components/ui";
import { Chip } from "./sentence-chips";

interface Props {
  query: string;
  onChange: (patch: { query: string; source: "browse" }) => void;
  /** Cosa si cerca, per il placeholder: "n° ordine, cliente o Stripe". */
  hint?: string;
}

export function SearchChip({ query, onChange, hint }: Props) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);

  // Da telefono niente popover: aprendo la tastiera la finestra cambia
  // dimensione, e il popover si chiude su `resize` — il campo spariva appena
  // lo toccavi. Qui il campo prende il posto del chip nella riga, cosi' la
  // lista sotto resta visibile mentre scrivi.
  const trigger = (
    <Chip tone="indigo" icon={<Search size={13} aria-hidden="true" />}>
      {query ? `“${query}”` : "Oppure fai una ricerca"}
    </Chip>
  );

  return (
    <>
      {query && !(isMobile && openMobile) && <span>che contengono</span>}

      {isMobile ? (
        openMobile ? (
          <div className="w-full">
            <SearchField
              query={query}
              onChange={onChange}
              hint={hint}
              onDone={() => setOpenMobile(false)}
            />
          </div>
        ) : (
          <button type="button" aria-label="Cerca" onClick={() => setOpenMobile(true)}>
            {trigger}
          </button>
        )
      ) : (
        <Popover label="Cerca" trigger={trigger}>
          <SearchField query={query} onChange={onChange} hint={hint} />
        </Popover>
      )}

      {/* Il × sta fuori dal chip: dentro sarebbe un bottone in un bottone
          (il trigger del popover), che gli screen reader leggono male. */}
      {query && !(isMobile && openMobile) && (
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
function SearchField({ query, onChange, hint, onDone }: Props & { onDone?: () => void }) {
  const [q, setQ] = useState(query);

  useEffect(() => {
    if (q === query) return;
    const t = setTimeout(() => onChange({ query: q, source: "browse" }), 300);
    return () => clearTimeout(t);
  }, [q, query, onChange]);

  // Se il campo sparisce prima dei 300ms (click fuori, chiusura) la cleanup
  // qui sopra annulla il timeout e quello che hai scritto si perde. Alla
  // chiusura lo rimandiamo a mano.
  const flush = useRef<() => void>(() => {});
  flush.current = () => {
    if (q !== query) onChange({ query: q, source: "browse" });
  };
  useEffect(() => () => flush.current(), []);

  return (
    <Input
      size="sm"
      autoFocus
      aria-label="Cerca"
      placeholder={hint ? `Cerca per ${hint}…` : "Cerca…"}
      value={q}
      onChange={(e) => setQ(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
      }}
      onBlur={onDone}
      iconLeft={<Search size={15} aria-hidden="true" />}
    />
  );
}
