"use client";
import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";

// Pallini colore: i nomi arrivano da Saleor come testo ("Blu", "Galassia"),
// non come esadecimale. Mappa i piu' usati, gli altri restano grigi.
const SWATCH: Record<string, string> = {
  blu: "#3b6fd4", azzurro: "#6aaee0", rosa: "#e88aa8", rosso: "#d0453c",
  giallo: "#e8c33f", verde: "#4a9a63", argento: "#c9ccd1", grigio: "#8b8f96",
  nero: "#1c1c1e", bianco: "#f2f2f2", oro: "#d8b46a", viola: "#8b5cf6",
  galassia: "#5a5f6b", "mezzanotte": "#2b3245", "grigio siderale": "#5c5c60",
};

function swatch(label: string) {
  return SWATCH[label.trim().toLowerCase()] ?? "#b8bcc4";
}

interface Props {
  /** Colore realmente acquistato dal cliente. */
  bought: string;
  /** Colore richiesto in cambio, "" se nessuno. */
  requested: string;
  options: { variantId: string; label: string }[];
  disabled: boolean;
  /** value "" = torna all'originale. */
  onPick: (value: string) => void;
  /** Cosa passare a onPick per ogni opzione: l'annotazione usa il nome, l'edit la variante. */
  valueOf: (o: { variantId: string; label: string }) => string;
}

// Icona accanto al prodotto: si apre solo dove un cambio colore ha senso.
// Sostituisce la tendina "Cambia colore..." su ogni riga.
export function ColorPicker({ bought, requested, options, disabled, onPick, valueOf }: Props) {
  const [open, setOpen] = useState(false);
  const pick = (v: string) => {
    setOpen(false);
    onPick(v);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label="Cambia colore"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)] disabled:opacity-40"
      >
        <Palette size={16} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <p className="px-2 pt-1 pb-2 text-xs text-[var(--color-ink-muted)]">
          Acquistato: <span className="text-[var(--color-ink-soft)]">{bought || "—"}</span>
        </p>
        {options.map((o) => (
          <ColorItem
            key={o.variantId}
            label={o.label}
            active={requested === o.label}
            onClick={() => pick(valueOf(o))}
          />
        ))}
        {requested && (
          <ColorItem label={`Torna a ${bought}`} active={false} onClick={() => pick("")} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function ColorItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-[var(--color-paper-muted)]"
    >
      <span
        aria-hidden
        className="size-3.5 rounded-full ring-1 ring-black/10"
        style={{ background: swatch(label) }}
      />
      <span className="flex-1 text-left">{label}</span>
      {active && <Check size={14} className="text-[var(--color-accent)]" />}
    </button>
  );
}
