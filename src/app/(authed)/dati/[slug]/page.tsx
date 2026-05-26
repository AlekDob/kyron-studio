import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listRecords, GatewayError, type PayloadDoc } from "@/lib/gateway";
import { DataWorkspace } from "@/components/data/DataWorkspace";

export const dynamic = "force-dynamic";

function pickTitle(doc: PayloadDoc): string {
  const candidates = ["titolo", "title", "name", "nome", "slug", "email"];
  for (const k of candidates) {
    const v = doc[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return `#${doc.id}`;
}

function pickMeta(doc: PayloadDoc): string {
  const slug = doc.slug;
  const updated = doc.updatedAt;
  const parts: string[] = [];
  if (typeof slug === "string") parts.push(slug);
  if (typeof updated === "string") parts.push(updated.slice(0, 10));
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
    <main className="px-8 py-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-2">
          <Link href="/dati" className="hover:underline">
            Studio · Dati
          </Link>
        </p>
        <div className="flex items-baseline justify-between gap-6">
          <h1 className="text-3xl font-medium tracking-tight">
            {list.collection.label.it}
          </h1>
          <span className="text-sm text-[var(--color-ink-muted)]">
            {list.meta.total} record · pagina {list.meta.page}/{totalPages}
          </span>
        </div>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          {list.collection.description.it}
        </p>

        <form action={`/dati/${slug}`} method="GET" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cerca per titolo, nome, slug..."
            className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ink)] transition-colors"
          />
          <button
            type="submit"
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-2 text-sm hover:bg-[var(--color-paper)] transition-colors"
          >
            Cerca
          </button>
          {q ? (
            <Link
              href={`/dati/${slug}`}
              className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-paper)] transition-colors"
            >
              Reset
            </Link>
          ) : null}
        </form>
      </header>

      {list.data.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)] italic">
          Nessun record in questa collection.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] overflow-hidden">
          {list.data.map((doc) => (
            <li key={String(doc.id)}>
              <Link
                href={`/dati/${slug}/${doc.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-paper)] transition-colors"
              >
                <div>
                  <div className="text-sm font-medium">{pickTitle(doc)}</div>
                  <div className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                    {pickMeta(doc)}
                  </div>
                </div>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  #{doc.id}
                </span>
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
              className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 hover:bg-[var(--color-paper-soft)] transition-colors"
            >
              ← Precedente
            </Link>
          ) : (
            <span className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[var(--color-ink-muted)] opacity-50">
              ← Precedente
            </span>
          )}
          <span className="text-[var(--color-ink-muted)]">
            Pagina {page} di {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={nextHref}
              className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 hover:bg-[var(--color-paper-soft)] transition-colors"
            >
              Successiva →
            </Link>
          ) : (
            <span className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[var(--color-ink-muted)] opacity-50">
              Successiva →
            </span>
          )}
        </nav>
      ) : null}
    </main>
    </DataWorkspace>
  );
}
