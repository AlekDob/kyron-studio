import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listRecords, type PayloadDoc } from "@/lib/gateway";
import { CATEGORIE, labelOf } from "@/lib/risorse";

export const dynamic = "force-dynamic";

// Schermata dedicata alle Risorse dentro il modulo Dati: il renderer generico
// non sa gestire select, array e upload, e non ha una pagina "crea".

function meta(doc: PayloadDoc): string {
  const parts: string[] = [];
  const categoria = doc.categoria;
  if (typeof categoria === "string") parts.push(labelOf(CATEGORIE, categoria));
  const data = doc.dataAggiornamento;
  if (typeof data === "string") parts.push(`aggiornata ${data.slice(0, 10)}`);
  return parts.join(" · ");
}

export default async function RisorseListPage() {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const list = await listRecords("risorse", { limit: 100 });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-5">
        <p className="eyebrow mb-2">
          <Link href="/dati" className="hover:underline">
            Studio · Dati
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-3xl font-medium tracking-tight">Risorse</h1>
          <Link
            href="/dati/risorse/new"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:opacity-90"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuova risorsa
          </Link>
        </div>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">
          Cataloghi, brochure e materiali scaricabili pubblicati su
          kyronedu.it/risorse.
        </p>
      </header>

      {list.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-paper-soft)] p-8 text-center">
          <p className="text-sm font-medium">Nessuna risorsa</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Crea la prima con il pulsante Nuova risorsa.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {list.data.map((doc) => (
            <li key={String(doc.id)}>
              <Link
                href={`/dati/risorse/${doc.id}`}
                className="group flex items-center justify-between gap-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-4 transition-colors hover:border-[var(--color-line-strong)] hover:bg-[var(--color-paper)]"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {typeof doc.titolo === "string" ? doc.titolo : `#${doc.id}`}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                    {meta(doc)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-[11px] text-[var(--color-ink-muted)]">
                    {doc._status === "draft" ? "Bozza" : "Pubblicata"}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-[var(--color-ink-muted)] transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
