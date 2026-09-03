"use client";

import { ArrowUp } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** Etichetta screen reader dell'input: dice a quale agente stai scrivendo. */
  ariaLabel: string;
  /** Riga sotto il campo (es. "l'agente puo' sbagliare"). */
  hint?: ReactNode;
  className?: string;
}

// Composer unico delle 6 chat dello Studio. Prima ogni chat si copiava lo stesso
// markup: cambiare stile voleva dire sei diff identici.
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Scrivi all'agente…",
  ariaLabel,
  hint,
  className,
}: Props): ReactElement {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      // Marcatore per chi vuole portare qui il cursore da fuori: l'input non
      // ha un id stabile, il form si'.
      data-chat-composer=""
      className={cn("shrink-0 px-4 pb-4 pt-2", className)}
    >
      <div className="flex items-center gap-2 rounded-[20px] border border-[var(--color-line)] bg-[var(--color-paper)] py-2 pl-4 pr-2 shadow-[var(--shadow-card)] transition-colors focus-within:border-[var(--color-line-strong)]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          className="flex-1 bg-transparent text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          aria-label="Invia"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-action)] text-[var(--color-paper)] transition-opacity hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
      {hint && (
        <p className="mt-3 text-center text-xs text-[var(--color-ink-muted)]">
          {hint}
        </p>
      )}
    </form>
  );
}
