"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import { SkeletonRows } from "@/components/ui";
import type { PortalDetail as PortalDetailType } from "@/lib/gateway";
import { PortalDetail } from "./PortalDetail";
import type { PortalActionHandlers } from "./PortalActions";
import type { PortalTab } from "./portals-filter";

// La riga della lista porta solo il riassunto (niente catalogo ne' kit): la
// scheda va letta dal BFF per slug. Qui sta l'unico fetch, cosi' desktop e
// mobile mostrano la stessa cosa e un salvataggio rilegge scheda + lista.
function usePortalDetail(slug: string | null) {
  const [portal, setPortal] = useState<PortalDetailType | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    const res = await fetch(`/api/portals/${slug}`, { cache: "no-store" });
    if (res.ok) setPortal((await res.json()) as PortalDetailType);
  }, [slug]);

  useEffect(() => {
    setPortal(null); // niente scheda vecchia sotto il portale nuovo
    void load();
  }, [load]);

  return { portal, reload: load };
}

interface Props extends PortalActionHandlers {
  slug: string;
  /** Nome dalla riga: si mostra durante il caricamento, senza far ballare il titolo. */
  nome: string;
  tab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  onBack: () => void;
  /** Rilegge la lista: i conteggi e lo stato cambiano insieme alla scheda. */
  onListChanged: () => void;
}

// Desktop: la scheda prende la colonna centrale al posto della lista.
export function PortalCard({ slug, nome, onListChanged, ...rest }: Props) {
  const { portal, reload } = usePortalDetail(slug);
  const onChanged = useCallback(() => {
    void reload();
    onListChanged();
  }, [reload, onListChanged]);

  if (!portal) return <PortalCardSkeleton nome={nome} />;
  return <PortalDetail portal={portal} onChanged={onChanged} {...rest} />;
}

// Mobile: la stessa scheda dentro una bottom sheet.
export function PortalCardDrawer({
  slug,
  nome,
  onListChanged,
  onBack,
  ...rest
}: Omit<Props, "slug"> & { slug: string | null }) {
  const { portal, reload } = usePortalDetail(slug);
  const onChanged = useCallback(() => {
    void reload();
    onListChanged();
  }, [reload, onListChanged]);

  return (
    <Drawer open={Boolean(slug)} onClose={onBack} side="bottom">
      {slug && (
        <>
          <DrawerHeader
            eyebrow="Portale"
            title={portal?.nome ?? nome}
            meta={portal?.city}
            onClose={onBack}
            closeLabel="Chiudi"
          />
          {portal ? (
            <PortalDetail portal={portal} onChanged={onChanged} {...rest} />
          ) : (
            <PortalCardSkeleton nome={nome} />
          )}
        </>
      )}
    </Drawer>
  );
}

// Forma della scheda, non uno spinner: barra azioni, tre tab, righe.
function PortalCardSkeleton({ nome }: { nome: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-5" role="status" aria-label={`Carico ${nome}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-[var(--radius-control)] bg-[var(--color-paper-muted)]" />
        <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-paper-muted)]" />
      </div>
      <div className="mb-6 flex gap-2">
        {[96, 110, 80, 84].map((w) => (
          <div
            key={w}
            style={{ width: w }}
            className="h-6 animate-pulse rounded-[var(--radius-control)] bg-[var(--color-paper-muted)]"
          />
        ))}
      </div>
      <SkeletonRows rows={6} rowClassName="h-[28px]" label={`Carico ${nome}`} />
    </div>
  );
}
