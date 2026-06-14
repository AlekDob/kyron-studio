// Stato vuoto/errore del modulo Ordini. Niente emoji (regola UI Kyron).

interface OrdersEmptyStateProps {
  variant: "error" | "no-data";
}

const COPY: Record<OrdersEmptyStateProps["variant"], { title: string; body: string }> = {
  error: {
    title: "Ordini non disponibili",
    body: "Non riesco a leggere gli ordini da Saleor in questo momento. Riprova tra poco.",
  },
  "no-data": {
    title: "Nessun ordine nel periodo",
    body: "Non ci sono ordini per i filtri selezionati. Allarga l'intervallo di date o cambia portale.",
  },
};

export function OrdersEmptyState({ variant }: OrdersEmptyStateProps) {
  const { title, body } = COPY[variant];
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-6 py-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)] max-w-md mx-auto">
        {body}
      </p>
    </div>
  );
}
