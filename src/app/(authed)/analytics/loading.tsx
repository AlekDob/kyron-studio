// Skeleton del modulo Analytics: KPI grid + chart + tabella.

function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] ${className}`}
    />
  );
}

export default function AnalyticsLoading() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 max-w-6xl mx-auto">
      <Block className="mb-6 h-32" />
      <div className="mb-6 flex gap-2">
        <Block className="h-9 w-24" />
        <Block className="h-9 w-24" />
        <Block className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Block key={i} className="h-20" />
        ))}
      </div>
      <Block className="mt-4 h-[300px]" />
      <Block className="mt-4 h-64" />
    </main>
  );
}
