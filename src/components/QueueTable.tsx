import type { PendingSchool } from "@/lib/pending-schools";
import { Pill } from "@/components/ui";

const STATUS_LABEL: Record<PendingSchool["status"], string> = {
  draft: "Bozza",
  review: "Da rivedere",
  approved: "Approvata",
  onboarded: "Onboardata",
};

const STATUS_VARIANT: Record<
  PendingSchool["status"],
  "neutral" | "warning" | "accent" | "tertiary"
> = {
  draft: "neutral",
  review: "warning",
  approved: "accent",
  onboarded: "tertiary",
};

export function QueueTable({ items }: { items: PendingSchool[] }) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-line)] text-[var(--color-ink-muted)] text-sm">
        Nessuna scuola in coda. Inizia con{" "}
        <a
          href="/portals/new"
          className="text-[var(--color-accent)] hover:underline"
        >
          un nuovo onboarding
        </a>
        .
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-paper)] border border-[var(--color-line)] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-paper-muted)] text-[var(--color-ink-muted)] text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Scuola</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Stato</th>
            <th className="px-4 py-3 font-medium">Origine</th>
            <th className="px-4 py-3 font-medium text-right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-t border-[var(--color-line)]">
              <td className="px-4 py-3 text-[var(--color-ink)]">{it.nome}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-soft)]">
                {it.slug}
              </td>
              <td className="px-4 py-3">
                <Pill variant={STATUS_VARIANT[it.status]} size="sm">
                  {STATUS_LABEL[it.status]}
                </Pill>
              </td>
              <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                {it.collectedBy === "agent" ? "Agente" : "Manuale"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-3 justify-end items-center">
                  <a
                    href={`/api/schools/${it.id}/markdown`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    Genera .md
                  </a>
                  <a
                    href={`https://kyronedu.it/admin/collections/pending-schools/${it.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    Modifica →
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
