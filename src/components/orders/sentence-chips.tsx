"use client";
// Pezzi della frase-filtro: il chip colorato e la lista di scelte del popover.
// Li usano la testata Ordini e la testata Prodotti: la frase e' lo stesso
// modo di dire "cosa stai guardando", quindi il chip e' uno solo (DRY).
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { TONES, type Tone } from "./detail-section";

// Chip colorato: stessa tinta delle pastiglie della scheda, cosi' la frase
// parla la lingua del resto del modulo.
export function Chip({
  tone,
  icon,
  children,
}: {
  tone: Tone;
  /** Icona prima del testo: la lente del chip ricerca. */
  icon?: ReactNode;
  children: ReactNode;
}) {
  const c = TONES[tone];
  return (
    <span
      style={{
        color: c,
        background: `color-mix(in srgb, ${c} 12%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 24%, transparent)`,
      }}
      className="inline-flex max-w-[220px] items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-sm font-medium transition-[filter] hover:brightness-95"
    >
      {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      <span className="truncate">{children}</span>
      <ChevronDown size={13} className="shrink-0 opacity-70" aria-hidden="true" />
    </span>
  );
}

/** Lista di scelte del popover: una riga per opzione, quella attiva in grassetto. */
export function Options({
  options,
  value,
  onPick,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="max-h-64 overflow-y-auto">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={`block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--color-paper-soft)] ${
            o.value === value ? "font-semibold" : "text-[var(--color-ink-soft)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
