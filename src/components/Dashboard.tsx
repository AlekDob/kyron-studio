"use client";
// Source: Virgilio apps/client/src/shell/Launcher.tsx — adattato per Next.js + moduli Kyron.
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { Card, Input, Pill } from "@/components/ui";
import { MODULES, type ModuleDefinition } from "@/components/shell/modules";

interface Props {
  orgName: string;
}

const norm = (s: string): string => s.toLowerCase().trim();

export function Dashboard({ orgName }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return MODULES;
    return MODULES.filter(
      (m) => norm(m.label).includes(q) || norm(m.description).includes(q),
    );
  }, [query]);

  const inbox = filtered.find((m) => m.id === "inbox");
  const agents = filtered.filter((m) => m.kind === "agent");
  const tools = filtered.filter((m) => m.kind === "tool" && m.id !== "inbox");
  const empty = filtered.length === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14 xl:px-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] md:text-3xl">
            Dashboard
          </h1>
          <p className="max-w-xl text-sm text-[var(--color-ink-muted)]">
            Esplora gli agenti AI e gli strumenti del tuo spazio {orgName} · Anteprima.
          </p>
        </header>

        <div className="mt-8 max-w-md">
          <Input
            size="md"
            iconLeft={<Search className="h-4 w-4" />}
            placeholder={`Cerca tra ${MODULES.length} app`}
            aria-label="Cerca app"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
          />
        </div>

        {empty ? (
          <div className="mt-16 rounded-[var(--radius-card)] border border-[var(--color-line)] border-dashed bg-[var(--color-paper)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--color-ink-muted)]">
              Nessuna app trovata per{" "}
              <span className="mono-caps text-[var(--color-ink)]">{query}</span>.
            </p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-12">
            {inbox && (
              <section aria-label={inbox.label}>
                <div className="grid grid-cols-1 gap-3">
                  <ModuleRow module={inbox} />
                </div>
              </section>
            )}
            {agents.length > 0 && (
              <ModuleSection title="Agenti AI" count={agents.length} modules={agents} />
            )}
            {tools.length > 0 && (
              <ModuleSection title="Strumenti" count={tools.length} modules={tools} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleSection({
  title,
  count,
  modules,
}: {
  title: string;
  count: number;
  modules: ModuleDefinition[];
}) {
  const headingId = `section-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId}>
      <div
        id={headingId}
        className="mono-caps mb-4 flex items-center gap-3 text-[var(--color-ink-muted)]"
      >
        <span>{title}</span>
        <span aria-hidden="true">·</span>
        <span>{count}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {modules.map((m) => (
          <ModuleRow key={m.id} module={m} />
        ))}
      </div>
    </section>
  );
}

function ModuleRow({ module: m }: { module: ModuleDefinition }) {
  const Icon = m.icon;
  const disabled = m.status === "coming-soon";

  const inner = (
    <Card
      padding="sm"
      interactive={!disabled}
      className={disabled ? "cursor-not-allowed opacity-60" : undefined}
    >
      <div className="flex items-start gap-3 p-1">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.tone.tile}`}
          aria-hidden="true"
        >
          <Icon className={`h-5 w-5 ${m.tone.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[var(--color-ink)]">
              {m.label}
            </h3>
            {disabled && (
              <Pill variant="neutral" size="sm">presto</Pill>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--color-ink-muted)]">
            {m.description}
          </p>
        </div>
      </div>
    </Card>
  );

  if (disabled) {
    return <div role="presentation">{inner}</div>;
  }
  return (
    <Link href={m.href} className="block">
      {inner}
    </Link>
  );
}
