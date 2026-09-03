// Stato vuoto/errore del modulo Richieste. Niente emoji (regola UI Kyron).

interface Props {
  variant: "error" | "no-data";
}

const COPY: Record<Props["variant"], { title: string; body: string }> = {
  error: {
    title: "Richieste non disponibili",
    body: "Non riesco a leggere i ticket da Linear. Riprova tra poco.",
  },
  "no-data": {
    title: "Nessuna richiesta",
    body: "Non c'e' niente con questi filtri. Toglili, oppure chiedi a Ivo qui a fianco di aprirne una nuova.",
  },
};

export function RequestsEmptyState({ variant }: Props) {
  const { title, body } = COPY[variant];
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-6 py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-ink-muted)]">{body}</p>
    </div>
  );
}
