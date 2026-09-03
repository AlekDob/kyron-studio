// Stato vuoto/errore del modulo Clienti. Niente emoji (regola UI Kyron).

interface Props {
  variant: "error" | "no-data";
}

const COPY: Record<Props["variant"], { title: string; body: string }> = {
  error: {
    title: "Clienti non disponibili",
    body: "Non riesco a leggere gli ordini da cui ricavo i clienti. Riprova tra poco.",
  },
  "no-data": {
    title: "Nessun cliente nel periodo",
    body: "Non ci sono clienti per i filtri selezionati. Allarga l'intervallo di date o cambia portale.",
  },
};

export function CustomersEmptyState({ variant }: Props) {
  const { title, body } = COPY[variant];
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-6 py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-ink-muted)]">{body}</p>
    </div>
  );
}
