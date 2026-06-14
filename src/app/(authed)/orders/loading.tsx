export default function Loading() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 max-w-6xl mx-auto animate-pulse">
      <div className="mb-6 h-28 rounded-2xl bg-[var(--color-line)]" />
      <div className="mb-6 flex gap-2">
        <div className="h-10 w-40 rounded-[var(--radius-input)] bg-[var(--color-line)]" />
        <div className="h-10 w-40 rounded-[var(--radius-input)] bg-[var(--color-line)]" />
        <div className="h-10 w-44 rounded-[var(--radius-input)] bg-[var(--color-line)]" />
      </div>
      <ul className="divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="px-5 py-4">
            <div className="h-4 w-2/3 rounded bg-[var(--color-line)] mb-2" />
            <div className="h-3 w-1/3 rounded bg-[var(--color-line)]" />
          </li>
        ))}
      </ul>
    </main>
  );
}
