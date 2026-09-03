"use client";
import { ChevronRight, MapPin, Package, ShoppingBag, Store } from "lucide-react";
import { Pill } from "@/components/ui";
import { SectionIcon } from "@/components/orders/detail-section";
import { Slides } from "@/components/animate-ui/primitives/effects/slide";
import type { PortalSummary } from "@/lib/gateway";
import { PortalLogo } from "./PortalLogo";
import { isDraft, type PortalGroup } from "./portals-filter";

interface Props {
  groups: PortalGroup[];
  onSelect: (portal: PortalSummary) => void;
}

// Lista portali raggruppata per stato: Bozze in cima (il lavoro da finire),
// Live sotto. Niente azioni sulla riga: stato, duplica ed elimina stanno nella
// scheda, cosi' la lista resta leggibile come quella di Ordini e Prodotti.
export function PortalsList({ groups, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((g, gi) => (
        <section key={g.key}>
          {/* Riga di stacco tra un gruppo e l'altro: altrimenti si toccherebbero. */}
          {gi > 0 && <div className="mb-5 h-px bg-[var(--color-line)]" />}
          <div className="mb-2 flex items-center gap-2 px-1">
            <SectionIcon icon={Store} tone={g.key === "bozze" ? "amber" : "emerald"} size={26} />
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              {g.label}
            </h2>
            <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
              {g.portals.length} portal{g.portals.length === 1 ? "e" : "i"}
            </span>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
            {/* Le righe entrano a scalare: quando Livia cambia il filtro si vede
                che la lista si e' rifatta. `asChild` per non infilare un div
                tra <ul> e <li>. */}
            <Slides asChild direction="up" offset={10} holdDelay={28}>
              {g.portals.map((p) => (
                <li key={p.slug}>
                  <PortalListRow portal={p} onSelect={onSelect} />
                </li>
              ))}
            </Slides>
          </ul>
        </section>
      ))}
    </div>
  );
}

function PortalListRow({
  portal,
  onSelect,
}: {
  portal: PortalSummary;
  onSelect: (portal: PortalSummary) => void;
}) {
  const draft = isDraft(portal);
  return (
    <button
      type="button"
      onClick={() => onSelect(portal)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-paper-soft)]"
    >
      <PortalLogo
        logoUrl={portal.logoUrl}
        nome={portal.nome}
        size={40}
        tone={draft ? "amber" : "emerald"}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{portal.nome}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-[var(--color-ink-soft)]">
          {portal.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" />
              {portal.city}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <ShoppingBag size={12} aria-hidden="true" />
            {portal.productCount} prodotti
          </span>
          <span className="inline-flex items-center gap-1">
            <Package size={12} aria-hidden="true" />
            {portal.bundleCount} kit
          </span>
        </p>
      </div>

      <Pill size="sm" variant={draft ? "neutral" : "tertiary"}>
        {draft ? "Bozza" : "Live"}
      </Pill>

      <ChevronRight size={16} className="shrink-0 text-[var(--color-ink-muted)]" />
    </button>
  );
}
