"use client";
// Periodo degli ordini: i preset, come si leggono e le pastiglie per sceglierli.
// Nessuno filtra qui: ogni cambio passa da onChange, finisce nell'URL e lo
// applica il server (vedi OrdersWorkspace.pushFilter). I campi filtro in pagina
// non esistono piu': la testata e' una frase con chip (OrdersSentence).
// Il periodo e' solo from/to: lo usano la testata Ordini e la testata Clienti,
// quindi il tipo qui e' la coppia di date, non il filtro di un modulo.
interface DateRange {
  from: string;
  to: string;
}

// Preset periodo: calcolano from/to in locale (il giorno "oggi" e' quello
// dell'operatore, non UTC). "Sempre" parte dal primo ordine Kyron.
const EPOCH = "2026-01-01";

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function presetRange(key: string): [string, string] {
  const now = new Date();
  const today = iso(now);
  switch (key) {
    case "oggi":
      return [today, today];
    case "ieri": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return [iso(y), iso(y)];
    }
    case "mese":
      return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), today];
    case "mese-scorso":
      return [
        iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      ];
    default:
      return [EPOCH, today];
  }
}

// Dal piu' largo al piu' stretto: "Tutti" e' il default della pagina, quindi e'
// il primo a sinistra e da li' si restringe.
const PRESETS: Array<{ key: string; label: string }> = [
  { key: "sempre", label: "Tutti" },
  { key: "mese-scorso", label: "Mese scorso" },
  { key: "mese", label: "Mese corrente" },
  { key: "ieri", label: "Ieri" },
  { key: "oggi", label: "Oggi" },
];

// Dentro la frase il preset si legge con la sua preposizione: "gli ordini DEL
// MESE SCORSO", non "gli ordini di mese scorso".
const PHRASES: Record<string, string> = {
  sempre: "di sempre",
  "mese-scorso": "del mese scorso",
  mese: "di questo mese",
  ieri: "di ieri",
  oggi: "di oggi",
};

/** Come si legge il periodo attivo nella frase. null = periodo su misura. */
export function periodPhrase(from: string, to: string): string | null {
  const hit = PRESETS.find((p) => {
    const [pf, pt] = presetRange(p.key);
    return pf === from && pt === to;
  });
  return hit ? PHRASES[hit.key] : null;
}

/** Etichetta del periodo attivo, per il chip. "Personalizzato" quando le date
 *  non coincidono con nessun preset. */
export function presetLabel(from: string, to: string): string {
  const hit = PRESETS.find((p) => {
    const [pf, pt] = presetRange(p.key);
    return pf === from && pt === to;
  });
  return hit?.label ?? "Personalizzato";
}

/** I cinque preset come pastiglie, dentro il popover del periodo. */
export function PeriodPresets({
  filter,
  onChange,
  onPicked,
  className = "flex flex-wrap gap-2",
}: {
  filter: DateRange;
  onChange: (patch: DateRange & { source: "browse" }) => void;
  /** Chiude il popover dopo la scelta. */
  onPicked?: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {PRESETS.map((p) => {
        const [pf, pt] = presetRange(p.key);
        const active = pf === filter.from && pt === filter.to;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              onChange({ from: pf, to: pt, source: "browse" });
              onPicked?.();
            }}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              active
                ? "border-transparent bg-[var(--color-ink)] text-[var(--color-paper)]"
                : "border-[var(--color-line)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
