export default function Loading() {
  return (
    <main className="px-8 py-12 max-w-3xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-32 rounded bg-[var(--color-line-strong)] mb-3" />
        <div className="h-8 w-64 rounded bg-[var(--color-line-strong)]" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 rounded bg-[var(--color-line-strong)] mb-2" />
            <div
              className={`rounded-lg bg-[var(--color-paper-soft)] border border-[var(--color-line)] ${i === 3 ? "h-32" : "h-9"}`}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
