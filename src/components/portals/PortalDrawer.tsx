"use client";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import { Pill } from "@/components/ui";
import { useIsMobile } from "@/lib/use-is-mobile";
import { Section, InfoRow } from "@/components/orders/drawer-primitives";
import type { PortalDetail } from "@/lib/gateway";
import { PortalCatalogSections } from "./PortalCatalogSections";
import { STATUS_LABEL, STATUS_VARIANT } from "./portal-status";
import { portalShopUrl } from "./portal-links";

const EURO = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

// Il portale visto dal catalogo: sola lettura, sopra il drawer prodotto. Si
// impila perche' il Drawer di studio-core fa portal su body: aperto per ultimo,
// il suo nodo e' l'ultimo del body e sta sopra (stesso z-index per tutti).
export function PortalDrawer({
  slug,
  onClose,
}: {
  slug: string | null;
  onClose: () => void;
}) {
  const [portal, setPortal] = useState<PortalDetail | null>(null);
  const [error, setError] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!slug) return;
    setError(false);
    let alive = true;
    fetch(`/api/portals/${slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((p: PortalDetail) => alive && setPortal(p))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [slug]);

  // Il portale caricato resta in stato durante l'uscita: senza, il drawer si
  // svuota a meta' animazione.
  const shown = slug && portal?.slug === slug ? portal : null;
  const addr = (shown?.schoolAddress ?? {}) as Record<string, string>;

  return (
    <Drawer
      open={Boolean(slug)}
      onClose={onClose}
      side={isMobile ? "bottom" : "right"}
      width={440}
    >
      <DrawerHeader
        eyebrow="Portale"
        title={shown?.nome ?? "Caricamento..."}
        icon={<Store className="h-4 w-4" />}
        meta={
          shown ? (
            <Pill variant={STATUS_VARIANT[shown.status] ?? "neutral"} size="sm">
              {STATUS_LABEL[shown.status] ?? shown.status}
            </Pill>
          ) : null
        }
        onClose={onClose}
        closeLabel="Chiudi"
      />
      <div className="min-h-0 flex-1 divide-y divide-[var(--color-line)] overflow-y-auto overscroll-contain px-5">
        {error && (
          <p className="py-5 text-sm text-[var(--color-ink-muted)]">
            Portale non trovato.
          </p>
        )}
        {shown && (
          <>
            <div className="py-5">
              <Section title="Informazioni">
                <InfoRow label="Codice interno" value={shown.slug} />
                <InfoRow
                  label="Link"
                  value={
                    <a
                      href={portalShopUrl(shown.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-[var(--color-accent)]"
                    >
                      kyronedu.it/shop/{shown.slug}
                    </a>
                  }
                />
                <InfoRow label="Citta'" value={addr.city || shown.city || "—"} />
                <InfoRow
                  label="Sito"
                  value={
                    shown.sitoUfficiale && shown.sitoUfficiale !== "TBD"
                      ? shown.sitoUfficiale
                      : "—"
                  }
                />
                <InfoRow label="Cod. MIUR" value={shown.codiceMeccanografico || "—"} />
              </Section>
            </div>
            <div className="py-5">
              <Section title="Spedizione">
                <InfoRow label="A scuola" value={shown.shipToSchool ? "Sì" : "No"} />
                <InfoRow label="Metodo" value={shown.shippingMethodLabel || "—"} />
                <InfoRow label="Costo" value={EURO.format(shown.shippingPriceEur)} />
              </Section>
            </div>
            <PortalCatalogSections portal={shown} />
            <div className="py-5">
              <a
                href={`/portals?detail=${shown.slug}`}
                className="text-sm text-[var(--color-ink-muted)] underline underline-offset-2 hover:text-[var(--color-ink)]"
              >
                Apri in Portali per modificare
              </a>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
