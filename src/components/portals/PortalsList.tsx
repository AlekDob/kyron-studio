"use client";

import { useState, type ReactNode } from "react";
import { MapPin, Package, ShoppingBag, Trash2, User } from "lucide-react";
import type { PortalSummary } from "@/lib/gateway";

// Per ora solo 2 stati operativi: Bozza (draft) e Live (onboarded).
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "draft", label: "Bozza" },
  { value: "onboarded", label: "Live" },
];

// Normalizza qualunque stato legacy (review/approved) al modello a 2 stati:
// solo "draft" resta Bozza, tutto il resto e' considerato Live.
function normStatus(status: string): "draft" | "onboarded" {
  return status === "draft" ? "draft" : "onboarded";
}

interface Props {
  portals: PortalSummary[];
  onSelect?: (slug: string) => void;
  onChangeStatus?: (slug: string, status: string) => Promise<void> | void;
  onDelete?: (slug: string) => Promise<void> | void;
}

export function PortalsList({
  portals,
  onSelect,
  onChangeStatus,
  onDelete,
}: Props) {
  const [query, setQuery] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null);

  async function handleStatus(slug: string, status: string): Promise<void> {
    setBusySlug(slug);
    try {
      await onChangeStatus?.(slug, status);
    } finally {
      setBusySlug(null);
    }
  }

  async function handleDelete(slug: string): Promise<void> {
    if (confirmSlug !== slug) {
      setConfirmSlug(slug);
      return;
    }
    setBusySlug(slug);
    try {
      await onDelete?.(slug);
    } finally {
      setBusySlug(null);
      setConfirmSlug(null);
    }
  }

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

  // Grouping a 2 stati: Bozze in cima, Live sotto.
  const drafts = filtered.filter((p) => normStatus(p.status) === "draft");
  const live = filtered.filter((p) => normStatus(p.status) !== "draft");

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

      <PortalGroup label="Bozze" items={drafts} render={renderRow} />
      <PortalGroup label="Live" items={live} render={renderRow} />
    </div>
  );

  function renderRow(p: PortalSummary) {
    return (
      <div
        key={p.slug}
        className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3 transition-colors hover:border-[var(--color-line-strong)]"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <button
            type="button"
            onClick={() => onSelect?.(p.slug)}
            className="text-left text-xs font-medium text-[var(--color-ink)] leading-tight hover:underline"
          >
            {p.nome}
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={normStatus(p.status)}
              disabled={busySlug === p.slug || !onChangeStatus}
              onChange={(e) => void handleStatus(p.slug, e.target.value)}
              aria-label={`Stato ${p.nome}`}
              className="rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-1.5 py-0.5 text-[10px] text-[var(--color-ink)] focus:border-[var(--color-line-strong)] focus:outline-none disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {onDelete ? (
              <button
                type="button"
                onClick={() => void handleDelete(p.slug)}
                disabled={busySlug === p.slug}
                aria-label={`Elimina ${p.nome}`}
                title={confirmSlug === p.slug ? "Conferma eliminazione" : "Elimina"}
                className={`rounded-[var(--radius-control)] border px-1.5 py-0.5 disabled:opacity-50 ${
                  confirmSlug === p.slug
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-[var(--color-line)] text-[var(--color-ink-muted)] hover:border-red-400 hover:text-red-500"
                }`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect?.(p.slug)}
          className="block w-full text-left"
        >
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
          {p.requestedBy ? (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--color-ink-muted)]">
              <User className="h-2.5 w-2.5" />
              <span className="truncate">{p.requestedBy}</span>
            </div>
          ) : null}
        </button>
      </div>
    );
  }
}

// Gruppo con intestazione; render nascosto se vuoto. Bozze prima, Live dopo.
function PortalGroup({
  label,
  items,
  render,
}: {
  label: string;
  items: PortalSummary[];
  render: (p: PortalSummary) => ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="eyebrow px-1">
        {label} ({items.length})
      </p>
      {items.map(render)}
    </div>
  );
}
