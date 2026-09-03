// Stato vuoto/errore del modulo Prodotti. Niente emoji (regola UI Kyron).

interface ProductsEmptyStateProps {
  variant: "error" | "no-data";
}

const COPY: Record<ProductsEmptyStateProps["variant"], { title: string; body: string }> = {
  error: {
    title: "Catalogo non disponibile",
    body: "Non riesco a leggere i prodotti da Saleor in questo momento. Riprova tra poco.",
  },
  "no-data": {
    title: "Nessun prodotto",
    body: "Non ci sono prodotti per i filtri selezionati. Cambia categoria o portale, oppure azzera la ricerca.",
  },
};

export function ProductsEmptyState({ variant }: ProductsEmptyStateProps) {
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
