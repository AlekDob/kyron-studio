import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 max-w-5xl mx-auto">
      <header className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-5">
        <p className="eyebrow mb-2">Studio · Dati</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Dati <span className="font-serif italic">Kyron</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          Consulta e modifica le collection principali. L'agente Editor Dati
          usa gli stessi endpoint, quindi ogni modifica resta sincronizzata.
        </p>
      </header>

      <ul className="grid gap-3">
        {collections.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/dati/${c.slug}`}
              className="group flex items-center justify-between gap-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-4 hover:border-[var(--color-line-strong)] hover:bg-[var(--color-paper)] transition-colors"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-base font-medium">{c.label.it}</span>
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                    {PURPOSE_LABEL[c.purpose] ?? c.purpose}
                    {!c.editable ? " · read-only" : ""}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                  {c.description.it}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-right">
                <div>
                  <div className="text-2xl font-serif italic leading-none">
                    {c.count}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                    record
                  </div>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-[var(--color-ink-muted)] transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
