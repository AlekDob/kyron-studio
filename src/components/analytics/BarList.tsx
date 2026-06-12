import { fmtInt } from "./format";

// Lista a barre orizzontali condivisa (form per tipo, fonti, citta'):
// label | barra proporzionale al max | valore. DRY tra le card analytics.

export interface BarRow {
  label: string;
  count: number;
}

interface BarListProps {
  rows: BarRow[];
}

export function BarList({ rows }: BarListProps) {
  const max = rows[0]?.count || 1;
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map(({ label, count }) => (
        <li key={label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-[var(--color-ink-soft)] sm:w-44">
            {label}
          </span>
          <span
            className="h-2 rounded-full bg-[var(--color-action)] opacity-80"
            style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
            aria-hidden="true"
          />
          <span className="ml-auto text-sm tabular-nums font-medium">
            {fmtInt(count)}
          </span>
        </li>
      ))}
    </ul>
  );
}
