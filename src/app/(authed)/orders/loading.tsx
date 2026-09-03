// Skeleton della pagina Ordini. Deve avere la forma del workspace vero
// (OrdersWorkspace): colonna piena a sinistra — testata ferma + lista che
// scorre — e la colonna della chat a destra. Un blocco centrato e corto
// racconterebbe una pagina che non esiste, e la lista poi entrerebbe di scatto.
export default function Loading() {
  return (
    <div className="flex h-full min-h-0 overflow-hidden lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col animate-pulse">
        {/* Testata: tile stato, ricerca, filtri (stessi padding di OrdersHeader). */}
        <div className="flex shrink-0 flex-col gap-4 px-5 pb-4 pt-5">
          <div className="h-24 rounded-2xl bg-[var(--color-line-strong)]" />
          <div className="h-9 rounded-[var(--radius-input)] bg-[var(--color-line-strong)]" />
          <div className="flex gap-2">
            <div className="h-9 w-40 rounded-[var(--radius-input)] bg-[var(--color-line-strong)]" />
            <div className="h-9 w-40 rounded-[var(--radius-input)] bg-[var(--color-line-strong)]" />
            <div className="h-9 w-44 rounded-[var(--radius-input)] bg-[var(--color-line-strong)]" />
          </div>
        </div>

        {/* La lista riempie quello che resta: le righe in eccesso le taglia
            overflow-hidden, cosi' lo skeleton arriva in fondo a ogni schermo. */}
        <div className="min-h-0 flex-1 px-5 pb-8">
          <ul className="h-full divide-y divide-[var(--color-line)] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)]">
            {Array.from({ length: 18 }).map((_, i) => (
              <li key={i} className="px-4 py-3">
                <div className="mb-2 h-4 w-2/3 rounded bg-[var(--color-line-strong)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--color-line-strong)]" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Il posto della chat: vuoto, ma il bordo tiene la pagina della larghezza giusta. */}
      <aside className="hidden w-[420px] shrink-0 border-l border-[var(--color-line)] lg:block" />
    </div>
  );
}
