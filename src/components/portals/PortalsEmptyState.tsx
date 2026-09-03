// Stato vuoto/errore del modulo Portali. Niente emoji (regola UI Kyron).

interface PortalsEmptyStateProps {
  variant: "error" | "no-data";
}

const COPY: Record<PortalsEmptyStateProps["variant"], { title: string; body: string }> = {
  error: {
    title: "Portali non disponibili",
    body: "Non riesco a leggere i portali in questo momento. Riprova tra poco.",
  },
  "no-data": {
    title: "Nessun portale",
    body: "Non ci sono portali per i filtri selezionati. Cambia citta' o stato, oppure chiedi a Livia di crearne uno nuovo.",
  },
};

export function PortalsEmptyState({ variant }: PortalsEmptyStateProps) {
  const { title, body } = COPY[variant];
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-6 py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">{body}</p>
    </div>
  );
}
