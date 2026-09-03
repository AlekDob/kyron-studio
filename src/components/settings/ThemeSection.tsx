"use client";
// Brain: feature-020 — tema per-browser: localStorage + data-theme su <html>.
// "Sistema" = nessuna chiave salvata, decide prefers-color-scheme. Lo script
// inline in app/layout.tsx (THEME_INIT) fa lo stesso calcolo al primo paint:
// se cambi la logica qui, cambiala anche la'.
import { useEffect, useState, type ReactElement } from "react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "kyron-studio-theme";

// Colori FISSI delle anteprime: mostrano com'e' l'altro tema, non possono
// seguire i token correnti.
const PREVIEW = {
  light: { desk: "#d6d6d6", slab: "#ebebeb", card: "#ffffff", line: "#0b0d12" },
  dark: { desk: "#141519", slab: "#1b1c21", card: "#232429", line: "#f2f3f7" },
} as const;

const OPTIONS: Array<{ id: Theme; label: string; hint: string }> = [
  { id: "light", label: "Chiaro", hint: "Scrivania grigia, card bianche" },
  { id: "dark", label: "Scuro", hint: "Scrivania scura, card grafite" },
  { id: "system", label: "Sistema", hint: "Segue il tema del dispositivo" },
];

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Miniatura scrivania + lastra + card. "system" e' mezza chiara e mezza scura. */
function ThemePreview({ option }: { option: Theme }) {
  const halves = option === "system" ? (["light", "dark"] as const) : ([option] as const);
  return (
    <span className="flex h-16 w-full overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-line)]">
      {halves.map((half) => {
        const c = PREVIEW[half];
        return (
          <span key={half} className="relative flex-1 p-1.5" style={{ background: c.desk }}>
            <span
              className="flex h-full w-full flex-col justify-end rounded-md p-1"
              style={{ background: c.slab }}
            >
              <span className="h-4 w-3/4 rounded-sm" style={{ background: c.card }}>
                <span
                  className="mt-1 ml-1 block h-0.5 w-1/2 rounded-full opacity-40"
                  style={{ background: c.line }}
                />
              </span>
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function ThemeSection(): ReactElement {
  const [theme, setTheme] = useState<Theme>("system");

  // Letto al mount: il server non conosce localStorage.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="eyebrow mb-3">Tema</p>
        <h2 className="text-3xl font-semibold tracking-tight">Aspetto</h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-ink-muted)]">
          Vale solo per questo browser: ogni persona sceglie il suo.
        </p>
      </header>

      <div role="radiogroup" aria-label="Tema" className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={theme === option.id}
            onClick={() => choose(option.id)}
            className={cn(
              "flex flex-col gap-3 rounded-[var(--radius-card)] border p-3 text-left transition-colors",
              theme === option.id
                ? "border-[var(--color-accent)] bg-[var(--color-paper)] ring-1 ring-[var(--color-accent)]"
                : "border-[var(--color-line)] bg-[var(--color-paper)] hover:border-[var(--color-line-strong)]",
            )}
          >
            <ThemePreview option={option.id} />
            <span>
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-xs text-[var(--color-ink-muted)]">
                {option.hint}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
