"use client";
// Source: Virgilio apps/client/src/modules/settings/ThemeSection.tsx
// Adattato: niente accent presets (studio ha un solo accent fisso),
// niente "system" mode (ThemeProvider studio supporta solo light/dark).
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/shell/ThemeProvider";

const MODE_OPTIONS = [
  { value: "light", label: "Chiaro", hint: "Default. Uffici luminosi, documenti lunghi." },
  { value: "dark", label: "Scuro", hint: "Contrasto alto, ambienti a bassa luce." },
] as const;

export function ThemeSection() {
  const { mode, setMode } = useTheme();

  return (
    <section className="space-y-8">
      <header>
        <p className="eyebrow mb-3">Tema</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Aspetto <span className="font-serif italic">interfaccia</span>
        </h2>
        <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
          Scegli modalita&apos; scura o chiara. La preferenza viene salvata sul
          browser corrente.
        </p>
      </header>

      <div>
        <p className="eyebrow mb-4">Modalita&apos;</p>
        <div className="grid grid-cols-2 gap-3">
          {MODE_OPTIONS.map((option) => {
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-[var(--radius-card)] border p-4 text-left transition-colors",
                  active
                    ? "border-[var(--color-ink)] bg-[var(--color-paper)]"
                    : "border-[var(--color-line)] hover:border-[var(--color-line-strong)]",
                )}
              >
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {option.label}
                </span>
                <span className="mono-caps text-[var(--color-ink-muted)]">
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mono-caps mt-3 text-[var(--color-ink-muted)]">
          attivo: {mode}
        </p>
      </div>
    </section>
  );
}
