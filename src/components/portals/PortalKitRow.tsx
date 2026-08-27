"use client";
import { useCallback, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Badge, Popover } from "@/components/ui";
import { eur } from "@/components/catalogo/catalog-view";
import type { Product } from "@/lib/products";
import type { PortalDetail, SaleorProduct } from "@/lib/gateway";
import { KitThumbnail } from "./KitThumbnail";
import { InlineText, InlinePrice } from "./inline-fields";
import { buildComponent, componentLabel, componentProductSlug } from "./bundle-components";

type Bundle = PortalDetail["bundles"][number];

// Riga kit nella stessa lista dei prodotti: cover in stile storefront (hero +
// accessori), nome, componenti, prezzo finale. Editabile solo nel pannello
// portali (arriva portalSlug): i componenti si aprono sotto la riga, non in
// popover — il popover si chiude allo scroll e la lista prodotti scrolla.
export function PortalKitRow({
  bundle,
  bySlug,
  index,
  portalSlug,
  onChanged,
}: {
  bundle: Bundle;
  bySlug: Map<string, Product>;
  index: number;
  portalSlug?: string;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [openComponents, setOpenComponents] = useState(false);
  const [adding, setAdding] = useState(false);
  const [available, setAvailable] = useState<SaleorProduct[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // I componenti raw del kit (jsonb Payload). Si trattano VERBATIM: aggiungere o
  // rimuovere un componente non deve toccare la `selection` degli altri (era il
  // bug che riscriveva tutto a variantSku=slug). Brain: gotcha-portal-kit-slug-mismatch.
  const components = (bundle.components ?? []) as Array<Record<string, unknown>>;
  const images = components
    .map((c) => bySlug.get(componentProductSlug(c))?.imageUrl ?? null)
    .filter((u): u is string => Boolean(u));

  const callPut = useCallback(
    async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/portals/${portalSlug}/bundles/${bundle.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    },
    [portalSlug, bundle.slug, onChanged],
  );

  // Rimuove SOLO il componente col productSlug dato; gli altri restano verbatim.
  const removeComponent = async (productSlug: string) => {
    setBusy(true);
    try {
      await callPut({
        components: components.filter((c) => componentProductSlug(c) !== productSlug),
      });
    } finally {
      setBusy(false);
    }
  };

  const loadAvailable = async () => {
    if (available) return;
    const res = await fetch("/api/portals/_catalog");
    if (res.ok) setAvailable((await res.json()) as SaleorProduct[]);
  };

  // Costruisce la selection canonica dallo SKU/taglio REALE della riga catalogo
  // (mai dallo slug) e la appende, lasciando intatti i componenti esistenti.
  const addComponent = async (row: SaleorProduct) => {
    const built = buildComponent(row);
    if (!built) return;
    setBusy(true);
    try {
      await callPut({ components: [...components, built] });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  const removeBundle = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/portals/${portalSlug}/bundles/${bundle.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const presentSlugs = new Set(components.map(componentProductSlug).filter(Boolean));
  const candidates = (available ?? []).filter((p) => !presentSlugs.has(p.slug));
  const countLabel = `${components.length} componenti`;

  return (
    <li
      className="studio-row-in group rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--studio-glass-surface)]"
      style={{ animationDelay: `${Math.min(index, 8) * 20}ms` }}
    >
      <div className="flex items-center gap-3">
        <KitThumbnail hero={images[0] ?? null} accessories={images.slice(1)} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <Badge>Kit</Badge>
            {portalSlug ? (
              <div className="min-w-0 flex-1 text-sm">
                <InlineText value={bundle.name} onSave={(v) => callPut({ name: v })} />
              </div>
            ) : (
              <p className="truncate text-sm text-[var(--color-ink)]">{bundle.name}</p>
            )}
          </div>
          <div className="mt-0.5">
            {portalSlug ? (
              <button
                type="button"
                onClick={() => setOpenComponents((v) => !v)}
                className="text-xs text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-2 hover:text-[var(--color-ink)]"
              >
                {countLabel}
              </button>
            ) : (
              <Popover
                label={`Componenti di ${bundle.name}`}
                trigger={
                  <span className="text-xs text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-2">
                    {countLabel}
                  </span>
                }
              >
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                  Componenti
                </p>
                <ul className="flex flex-col gap-1">
                  {components.map((c, i) => {
                    const cslug = componentProductSlug(c);
                    return (
                      <li key={`${cslug}-${i}`} className="text-sm text-[var(--color-ink)]">
                        {bySlug.get(cslug)?.name ?? componentLabel(c)}
                      </li>
                    );
                  })}
                </ul>
              </Popover>
            )}
          </div>
        </div>
        <span className="shrink-0 text-right text-sm tabular-nums">
          {portalSlug ? (
            <InlinePrice
              value={bundle.finalPriceEur}
              onSave={(v) => callPut({ finalPriceEur: v })}
            />
          ) : (
            <span className="font-medium">{eur(bundle.finalPriceEur)}</span>
          )}
        </span>
        {portalSlug && (
          <button
            type="button"
            onClick={removeBundle}
            disabled={busy}
            title={confirmDelete ? "Conferma" : "Rimuovi kit"}
            className={`shrink-0 transition-opacity ${
              confirmDelete
                ? "text-[var(--color-critical)]"
                : "text-[var(--color-ink-muted)] opacity-0 hover:text-[var(--color-critical)] group-hover:opacity-100"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {confirmDelete && (
        <p className="mt-1 text-[10px] text-[var(--color-critical)]">
          Premi di nuovo il cestino per confermare.
        </p>
      )}

      {portalSlug && openComponents && (
        <div className="mt-1.5 pl-12">
          <div className="flex flex-wrap gap-1">
            {components.map((c, i) => {
              const cslug = componentProductSlug(c);
              return (
                <span
                  key={`${cslug}-${i}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--color-paper-muted)] px-2 py-0.5 text-[10px] text-[var(--color-ink-soft)]"
                >
                  {bySlug.get(cslug)?.name ?? componentLabel(c)}
                  <button
                    type="button"
                    onClick={() => removeComponent(cslug)}
                    disabled={busy}
                    aria-label={`Rimuovi ${cslug}`}
                    className="hover:text-[var(--color-ink)]"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setAdding((v) => !v);
                void loadAvailable();
              }}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--color-line)] px-2 py-0.5 text-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              <Plus className="h-2.5 w-2.5" /> Componente
            </button>
          </div>
          {adding && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-soft)]">
              {available === null ? (
                <p className="p-2 text-xs text-[var(--color-ink-muted)]">Caricamento...</p>
              ) : candidates.length === 0 ? (
                <p className="p-2 text-xs text-[var(--color-ink-muted)]">
                  Nessun altro prodotto disponibile.
                </p>
              ) : (
                candidates.map((p) => {
                  const buildable = buildComponent(p) !== null;
                  return (
                    <button
                      key={p.id ?? p.slug}
                      type="button"
                      onClick={() => addComponent(p)}
                      disabled={busy || !buildable}
                      title={
                        buildable
                          ? undefined
                          : "Prodotto multi-variante: scegli un taglio specifico"
                      }
                      className="flex w-full items-center gap-3 px-2 py-1.5 text-left hover:bg-[var(--color-paper-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-ink)]">
                        {p.name}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-[var(--color-ink-muted)]">
                        {eur(p.priceEur)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
