import Link from "next/link";
import { cn } from "@/lib/cn";
import type { AppFilter, RangeKey } from "@/lib/analytics";

// Filtri come <Link> sui searchParams: stato nell'URL, zero client state.
// Su mobile la riga periodi scorre orizzontalmente (niente wrap a 3 righe):
// overflow-x-auto + edge-to-edge col negative margin del padding pagina.

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Oggi" },
  { key: "yesterday", label: "Ieri" },
  { key: "week", label: "Settimana" },
  { key: "month", label: "Mese" },
  { key: "7d", label: "7 giorni" },
  { key: "30d", label: "30 giorni" },
  { key: "90d", label: "90 giorni" },
];

const APPS: Array<{ key: AppFilter; label: string }> = [
  { key: "all", label: "Tutti" },
  { key: "cms", label: "Sito" },
  { key: "storefront", label: "Shop" },
];

interface FilterBarProps {
  range: RangeKey;
  app: AppFilter;
}

function pillClass(active: boolean): string {
  return cn(
    "shrink-0 rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]"
      : "border-[var(--color-line)] bg-[var(--color-paper-soft)] text-[var(--color-ink-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]",
  );
}

function href(range: RangeKey, app: AppFilter): string {
  const params = new URLSearchParams({ range, app });
  return `/analytics?${params.toString()}`;
}

export function FilterBar({ range, app }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-x-6">
      <nav
        aria-label="Periodo"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-0"
      >
        {RANGES.map((r) => (
          <Link key={r.key} href={href(r.key, app)} className={pillClass(r.key === range)}>
            {r.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Origine" className="flex flex-wrap gap-2">
        {APPS.map((a) => (
          <Link key={a.key} href={href(range, a.key)} className={pillClass(a.key === app)}>
            {a.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
