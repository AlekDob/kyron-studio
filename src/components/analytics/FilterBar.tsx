import Link from "next/link";
import { cn } from "@/lib/cn";
import type { AppFilter, RangeKey } from "@/lib/analytics";

// Filtri come <Link> sui searchParams: stato nell'URL, zero client state.
// Su mobile i due gruppi vanno a capo (flex-wrap).

const RANGES: Array<{ key: RangeKey; label: string }> = [
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
    "rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm font-medium transition-colors",
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
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <nav aria-label="Periodo" className="flex flex-wrap gap-2">
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
