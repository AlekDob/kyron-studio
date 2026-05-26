export default function Loading() {
  return (
    <main className="px-8 py-12 max-w-5xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-32 rounded bg-[var(--color-line)] mb-3" />
        <div className="h-8 w-64 rounded bg-[var(--color-line)]" />
      </div>
      <ul className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="px-5 py-3">
            <div className="h-4 w-2/3 rounded bg-[var(--color-line)] mb-2" />
            <div className="h-3 w-1/3 rounded bg-[var(--color-line)]" />
          </li>
        ))}
      </ul>
    </main>
  );
}
