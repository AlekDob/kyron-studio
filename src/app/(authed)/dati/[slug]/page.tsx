import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listRecords, GatewayError, type PayloadDoc } from "@/lib/gateway";
import { DataWorkspace } from "@/components/data/DataWorkspace";

export const dynamic = "force-dynamic";

function parseLocalizedString(value: string): { it?: string; en?: string } | null {
  if (!value.trim().startsWith("{")) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    if (!("it" in parsed) && !("en" in parsed)) return null;
    return parsed as { it?: string; en?: string };
  } catch {
    return null;
  }
}

function pickTitle(doc: PayloadDoc): string {
  const candidates = ["titolo", "title", "name", "nome", "slug", "email"];
  for (const k of candidates) {
    const v = doc[k];
    if (typeof v === "string" && v.trim()) {
      const localized = parseLocalizedString(v);
      return localized?.it ?? localized?.en ?? v;
    }
    if (v && typeof v === "object" && "it" in v) {
      const label = (v as { it?: unknown; en?: unknown }).it ?? (v as { en?: unknown }).en;
      if (typeof label === "string" && label.trim()) return label;
    }
  }
  return `#${doc.id}`;
}

function pickMeta(doc: PayloadDoc): string {
  const slug = doc.slug;
  const updated = doc.updatedAt;
  const parts: string[] = [];
  if (typeof slug === "string") parts.push(slug);
  if (typeof updated === "string") parts.push(`aggiornato ${updated.slice(0, 10)}`);
  return parts.join(" · ");
}

function buildHref(
  slug: string,
  params: { q?: string; page?: number },
): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const str = qs.toString();
  return `/dati/${slug}${str ? `?${str}` : ""}`;
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function CollectionListPage({
  params,
  searchParams,
}: Props) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const { slug } = await params;
  const sp = await searchParams;
  const page = sp.page ? Number(sp.page) : 1;
  const q = sp.q?.trim() || undefined;
  const limit = 25;

  let list;
  try {
    list = await listRecords(slug, { page, q, limit });
  } catch (err) {
    if (err instanceof GatewayError && err.status === 404) notFound();
    throw err;
  }

  const totalPages = list.meta.totalPages || 1;
  const prevHref = buildHref(slug, { q, page: page - 1 });
  const nextHref = buildHref(slug, { q, page: page + 1 });

  return (
    <DataWorkspace slug={slug}>
    <main className="px-5 py-8 sm:px-8 lg:px-10 max-w-5xl mx-auto">
      <header className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-5">
        <p className="eyebrow mb-2">
          <Link href="/dati" className="hover:underline">
            Studio · Dati
          </Link>
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-3xl font-medium tracking-tight">
            {list.collection.label.it}
          </h1>
          <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1 text-xs text-[var(--color-ink-muted)]">
            {list.meta.total} record · pagina {list.meta.page}/{totalPages}
          </span>
        </div>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          {list.collection.description.it}
        </p>

        <form action={`/dati/${slug}`} method="GET" className="mt-6 flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
            />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cerca per titolo, nome, slug..."
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-ink)]"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2.5 text-sm hover:bg-[var(--color-paper-muted)] transition-colors"
          >
            Cerca
          </button>
          {q ? (
            <Link
              href={`/dati/${slug}`}
              className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-center text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-paper)] transition-colors"
            >
              Reset
            </Link>
          ) : null}
        </form>
      </header>

      {list.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-paper-soft)] p-8 text-center">
          <p className="text-sm font-medium">Nessun record trovato</p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Prova a rimuovere la ricerca o a cambiare termine.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {list.data.map((doc) => (
            <li key={String(doc.id)}>
              <Link
                href={`/dati/${slug}/${doc.id}`}
                className="group flex items-center justify-between gap-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-4 transition-colors hover:border-[var(--color-line-strong)] hover:bg-[var(--color-paper)]"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{pickTitle(doc)}</div>
                  <div className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    {pickMeta(doc) || "Nessun metadato disponibile"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 font-mono text-[11px] text-[var(--color-ink-muted)]">
                    #{doc.id}
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

      {totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={prevHref}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2 hover:bg-[var(--color-paper-soft)] transition-colors"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Precedente
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink-muted)] opacity-50">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Precedente
            </span>
          )}
          <span className="text-[var(--color-ink-muted)]">
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2 hover:bg-[var(--color-paper-soft)] transition-colors"
            >
              Successiva
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink-muted)] opacity-50">
              Successiva
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          )}
        </nav>
      ) : null}
    </main>
    </DataWorkspace>
  );
}
