"use client";

import { Plus, Package, ShoppingBag, MapPin } from "lucide-react";
import { Pill } from "@/components/ui";
import type { PortalSummary } from "@/lib/gateway";

const STATUS_LABEL: Record<string, string> = {
  draft: "Bozza",
  review: "Da rivedere",
  approved: "Approvato",
  onboarded: "Live",
};

const STATUS_VARIANT: Record<string, "neutral" | "warning" | "accent" | "tertiary"> = {
  draft: "neutral",
  review: "warning",
  approved: "accent",
  onboarded: "tertiary",
};

function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

interface Props {
  portals: PortalSummary[];
}

export function PortalsDashboard({ portals }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-[var(--color-ink-muted)]">
            {portals.length} portal{portals.length !== 1 ? "i" : "e"}
          </span>
          <div className="flex gap-2">
            {summarizeCounts(portals).map(([label, count]) => (
              <span
                key={label}
                className="text-xs text-[var(--color-ink-muted)]"
              >
                {count} {label}
              </span>
            ))}
          </div>
        </div>
        <a
          href="/portals/new"
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuovo portale
        </a>
      </div>

      {portals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((p) => (
            <PortalCard key={p.slug} portal={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PortalCard({ portal }: { portal: PortalSummary }) {
  const variant = STATUS_VARIANT[portal.status] ?? "neutral";
  const label = STATUS_LABEL[portal.status] ?? portal.status;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-5 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-medium text-[var(--color-ink)] leading-tight">
          {portal.nome}
        </h3>
        <Pill variant={variant} size="sm">
          {label}
        </Pill>
      </div>

      <p className="mb-4 font-mono text-xs text-[var(--color-ink-muted)]">
        {portal.slug}
      </p>

      <div className="flex flex-col gap-1.5 text-xs text-[var(--color-ink-soft)]">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {portal.city}{portal.countryArea ? ` (${portal.countryArea})` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <ShoppingBag className="h-3 w-3" />
          {portal.productCount} prodott{portal.productCount !== 1 ? "i" : "o"}
        </span>
        <span className="flex items-center gap-1.5">
          <Package className="h-3 w-3" />
          {portal.bundleCount} kit
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-line)] pt-3">
        <span className="text-xs text-[var(--color-ink-muted)]">
          {formatDate(portal.collectedAt)}
        </span>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {portal.collectedBy === "agent" ? "via Agente" : "Manuale"}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-8 py-16 text-center">
      <p className="mb-2 text-sm text-[var(--color-ink-soft)]">
        Nessun portale configurato
      </p>
      <p className="mb-6 text-xs text-[var(--color-ink-muted)] max-w-sm">
        Crea il primo portale scuola con l&apos;assistente AI. Raccogliera&apos; i dati,
        il catalogo prodotti e i kit in pochi minuti.
      </p>
      <a
        href="/portals/new"
        className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Nuovo portale
      </a>
    </div>
  );
}

function summarizeCounts(portals: PortalSummary[]): [string, number][] {
  const counts: Record<string, number> = {};
  for (const p of portals) {
    const label = STATUS_LABEL[p.status] ?? p.status;
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts);
}
