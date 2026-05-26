import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listCollections } from "@/lib/gateway";

export const metadata = { title: "Dati — Studio" };

const PURPOSE_LABEL: Record<string, string> = {
  manage: "Gestione",
  inbox: "Inbox",
  library: "Libreria",
};

export default async function DatiPage() {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const collections = await listCollections();

  return (
    <main className="min-h-screen px-8 py-12 max-w-5xl mx-auto">
      <header className="mb-10">
        <p className="eyebrow mb-2">Studio · Dati</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Collection <span className="font-serif italic">Kyron</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          Modifica diretta delle collection Payload via gateway. Il chat agente
          opera sugli stessi endpoint.
        </p>
      </header>

      <ul className="grid gap-3">
        {collections.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/dati/${c.slug}`}
              className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-4 hover:bg-[var(--color-paper)] transition-colors"
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-base font-medium">{c.label.it}</span>
                  <span className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                    {PURPOSE_LABEL[c.purpose] ?? c.purpose}
                    {!c.editable ? " · read-only" : ""}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                  {c.description.it}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-serif italic">{c.count}</div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                  record
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
