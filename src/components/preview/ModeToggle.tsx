"use client";

import { type ReactElement } from "react";

interface Props {
  active: boolean;
  onToggle: () => void;
}

export function ModeToggle({ active, onToggle }: Props): ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? "Passa a navigazione" : "Passa a selezione"}
      aria-pressed={active}
      title={active ? "Seleziona (attivo)" : "Naviga (attivo)"}
      className="shrink-0 rounded-full p-2 transition-colors"
      style={{
        backgroundColor: active ? "color-mix(in srgb, var(--color-action) 10%, transparent)" : "transparent",
        color: active ? "var(--color-action)" : "var(--color-ink-muted)",
      }}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {active ? (
          <>
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="m13 13 6 6" />
          </>
        ) : (
          <>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </>
        )}
      </svg>
    </button>
  );
}
