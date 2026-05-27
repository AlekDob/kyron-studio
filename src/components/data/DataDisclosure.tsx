import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  summary: ReactNode;
  children: ReactNode;
}

export function DataDisclosure({ summary, children }: Props) {
  return (
    <details className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-[var(--color-ink)] [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">{summary}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-[var(--color-ink-muted)] transition-transform group-open:rotate-180"
        />
      </summary>
      {children}
    </details>
  );
}
