// Annotazione cambio colore (decision-019): mostra l'acquisto originale e il colore
// richiesto (from -> to). Riusata nella vista sola lettura e in modalita' annotazione.
// Se manca l'originale mostra solo il nuovo colore.
export function ColorChangeNote({ from, to }: { from: string; to: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
      <span className="font-medium text-[var(--color-ink-soft)]">Colore:</span>
      {from ? (
        <>
          <span className="line-through">{from}</span>
          <span aria-hidden>→</span>
        </>
      ) : null}
      <span className="font-medium text-[var(--color-ink)]">{to}</span>
    </span>
  );
}
