"use client";
// Selettore di periodo delle tile del cruscotto, condiviso da ordini, fatturato
// e visite (i portali attivi sono un conteggio di adesso: nessun periodo).
// Popover e non fila di pastiglie: la fila andava a capo e faceva la tile piu'
// alta delle altre tre del mosaico.
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover } from "@/components/ui";

export interface RangeOption<K extends string> {
  key: K;
  label: string;
}

/**
 * Periodo scelto, ricordato per tile. Letto dopo il mount e non
 * nell'initializer: il server non vede la localStorage e leggerla prima
 * romperebbe l'hydration.
 */
export function useStoredRange<K extends string>(
  storageKey: string,
  options: Array<RangeOption<K>>,
  initial: K,
): [K, (key: K) => void] {
  const [range, setRange] = useState<K>(initial);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (options.some((o) => o.key === saved)) setRange(saved as K);
  }, [storageKey, options]);

  return [
    range,
    (key: K) => {
      setRange(key);
      localStorage.setItem(storageKey, key);
    },
  ];
}

export function RangePicker<K extends string>({
  options,
  value,
  onPick,
  label,
}: {
  options: Array<RangeOption<K>>;
  value: K;
  onPick: (key: K) => void;
  /** aria-label del bottone: il trigger e' solo la pastiglia col periodo. */
  label: string;
}) {
  return (
    <Popover
      label={label}
      trigger={
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ink)] px-2.5 py-1 text-[11px] font-medium text-white">
          {options.find((o) => o.key === value)?.label}
          <ChevronDown size={12} />
        </span>
      }
    >
      {(close) => (
        <div className="flex flex-col">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onPick(o.key);
                close();
              }}
              aria-pressed={o.key === value}
              className={`rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--studio-hover-surface)] ${
                o.key === value ? "font-medium" : "text-[var(--color-ink-soft)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
