import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function DataSelect({ className = "", children, ...props }: Props) {
  return (
    <span className="relative block">
      <select
        {...props}
        className={`w-full appearance-none rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 pr-10 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20 ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
      />
    </span>
  );
}
