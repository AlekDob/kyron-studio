"use client";

import { useState } from "react";
import { MapPin, Package, ShoppingBag } from "lucide-react";
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

interface Props {
  portals: PortalSummary[];
  onSelect?: (slug: string) => void;
}

export function PortalsList({ portals, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? portals.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.nome.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
        );
      })
    : portals;

  if (portals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-[var(--color-ink-soft)] mb-1">
          Nessun portale configurato
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Chiedi all&apos;agente di crearne uno nuovo
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {portals.length > 3 ? (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca portale..."
          className="w-full rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-line-strong)] focus:outline-none"
        />
      ) : null}

      <div className="flex flex-col gap-2">
        {filtered.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => onSelect?.(p.slug)}
            className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3 transition-colors hover:border-[var(--color-line-strong)] text-left w-full"
          >
            <div className="flex items-start justify-between mb-1.5">
              <span className="text-xs font-medium text-[var(--color-ink)] leading-tight">
                {p.nome}
              </span>
              <Pill
                variant={STATUS_VARIANT[p.status] ?? "neutral"}
                size="sm"
              >
                {STATUS_LABEL[p.status] ?? p.status}
              </Pill>
            </div>
            <p className="font-mono text-[10px] text-[var(--color-ink-muted)] mb-1.5">
              {p.slug}
            </p>
            <div className="flex gap-3 text-[10px] text-[var(--color-ink-soft)]">
              <span className="flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />
                {p.city}
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-2.5 w-2.5" />
                {p.productCount}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-2.5 w-2.5" />
                {p.bundleCount}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
