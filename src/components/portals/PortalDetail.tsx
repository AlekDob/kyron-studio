"use client";

import { useCallback, useEffect, type ComponentType, type ReactNode } from "react";
import {
  ChevronLeft,
  ExternalLink,
  Globe,
  Hash,
  Info,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { Pill } from "@/components/ui";
import { Section as BaseSection } from "@/components/orders/drawer-primitives";
import { SectionIcon, type Tone } from "@/components/orders/detail-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { PortalActions, type PortalActionHandlers } from "./PortalActions";
import { PortalCatalogSections } from "./PortalCatalogSections";
import { PortalLogo } from "./PortalLogo";
import { STATUS_LABEL, STATUS_VARIANT } from "./portal-status";
import { portalShopUrl } from "./portal-links";
import { InlineText } from "./inline-fields";
import { PORTAL_TABS, type PortalTab } from "./portals-filter";
import type { PortalDetail as PortalDetailType } from "@/lib/gateway";

const EURO = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

const TAB_META: Record<
  PortalTab,
  { label: string; icon: ComponentType<{ size?: number }>; tone: Tone }
> = {
  informazioni: { label: "Informazioni", icon: Info, tone: "indigo" },
  catalogo: { label: "Catalogo", icon: ShoppingBag, tone: "emerald" },
  kit: { label: "Kit", icon: Package, tone: "violet" },
};

interface Props extends PortalActionHandlers {
  portal: PortalDetailType;
  /** Presente = scheda inline al centro: disegna la barra indietro e ascolta Esc. */
  onBack?: () => void;
  /** Tab attivo: vive nel workspace perche' lo cambia anche Livia dalla chat. */
  tab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  /** Il portale e' cambiato: rileggi scheda e lista. */
  onChanged?: () => void;
}

// Contenuto della scheda portale, senza guscio: al centro del pannello su
// desktop, dentro la bottom sheet su mobile. Come in Ordini e Prodotti: un
// drawer da destra coprirebbe la chat, e Livia deve vedere il portale aperto.
export function PortalDetail({
  portal,
  onBack,
  tab,
  onTabChange,
  onChanged,
  ...actions
}: Props) {
  // Esc chiude la scheda inline (con un Drawer lo faceva il core).
  useEffect(() => {
    if (!onBack) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const patchPortal = useCallback(
    async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/portals/${portal.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    },
    [portal.slug, onChanged],
  );

  // Stessa rotta per prodotti e sconti: cambia solo la chiave nel body.
  const putCatalog = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/portals/${portal.slug}/catalog`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    },
    [portal.slug, onChanged],
  );

  const patchCatalog = useCallback(
    (visibleSlugs: string[]) => putCatalog({ visibleSlugs }),
    [putCatalog],
  );
  const patchDiscounts = useCallback(
    (productDiscounts: PortalDetailType["catalog"]["productDiscounts"]) =>
      putCatalog({ productDiscounts }),
    [putCatalog],
  );

  const addr = portal.schoolAddress as Record<string, string>;

  return (
    <Slide direction="right" offset={18} className="flex h-full min-h-0 flex-1 flex-col">
      {onBack && <BackBar portal={portal} onBack={onBack} />}

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as PortalTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 px-6 pt-4">
          <TabsList variant="line" className="h-auto w-full justify-start gap-1">
            {PORTAL_TABS.map((k) => (
              <TabsTrigger key={k} value={k} className="flex-none gap-2 px-2.5 py-1.5">
                <SectionIcon icon={TAB_META[k].icon} tone={TAB_META[k].tone} size={24} />
                {TAB_META[k].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {/* Fuori dai tab: identita' e azioni si devono vedere da qualunque
              sezione (come lo stato lavorazione nella scheda ordine). */}
          <div className="mb-5 flex items-center gap-3">
            <PortalLogo logoUrl={portal.branding?.logoUrl ?? portal.logoUrl} nome={portal.nome} size={48} />
            <div className="min-w-0">
              <p className="truncate font-medium">{portal.nome}</p>
              <span className="mt-1 inline-flex flex-wrap items-center gap-1.5">
                <Pill size="sm" variant={STATUS_VARIANT[portal.status] ?? "neutral"}>
                  {STATUS_LABEL[portal.status] ?? portal.status}
                </Pill>
                <a
                  href={portalShopUrl(portal.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-muted)] underline underline-offset-2 hover:text-[var(--color-accent)]"
                >
                  <ExternalLink size={11} /> kyronedu.it/shop/{portal.slug}
                </a>
              </span>
            </div>
          </div>
          <div className="mb-6">
            <PortalActions portal={portal} onChanged={onChanged} {...actions} />
          </div>

          <TabsContent value="informazioni" className="flex flex-col">
            <div className="divide-y divide-[var(--color-line)]">
              <Section title="Informazioni">
                <Row icon={<Hash className="h-4 w-4" />} label="Slug">
                  <code className="text-xs text-[var(--color-ink-muted)]">{portal.slug}</code>
                </Row>
                <Row icon={<Globe className="h-4 w-4" />} label="Nome">
                  <InlineText value={portal.nome} onSave={(v) => patchPortal({ nome: v })} />
                </Row>
                <Row icon={<Globe className="h-4 w-4" />} label="Sito">
                  <InlineText
                    value={portal.sitoUfficiale === "TBD" ? "" : portal.sitoUfficiale}
                    placeholder="https://..."
                    onSave={(v) => patchPortal({ sitoUfficiale: v || "TBD" })}
                  />
                </Row>
                <Row icon={<Hash className="h-4 w-4" />} label="Cod. MIUR">
                  <InlineText
                    value={portal.codiceMeccanografico}
                    onSave={(v) => patchPortal({ codiceMeccanografico: v })}
                  />
                </Row>
                {portal.requestedBy ? (
                  <Row icon={<User className="h-4 w-4" />} label="Richiesto da">
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {portal.requestedBy}
                    </span>
                  </Row>
                ) : null}
              </Section>

              <Section title="Indirizzo">
                <Row icon={<MapPin className="h-4 w-4" />} label="Via">
                  <InlineText
                    value={addr.streetAddress1 ?? ""}
                    onSave={(v) => patchPortal({ streetAddress1: v })}
                  />
                </Row>
                <Row icon={<MapPin className="h-4 w-4" />} label="CAP">
                  <InlineText
                    value={addr.postalCode ?? ""}
                    onSave={(v) => patchPortal({ postalCode: v })}
                  />
                </Row>
                <Row icon={<MapPin className="h-4 w-4" />} label="Citta'">
                  <InlineText value={addr.city ?? ""} onSave={(v) => patchPortal({ city: v })} />
                </Row>
                <Row icon={<MapPin className="h-4 w-4" />} label="Prov.">
                  <InlineText
                    value={addr.countryArea ?? ""}
                    onSave={(v) => patchPortal({ countryArea: v.toUpperCase().slice(0, 2) })}
                  />
                </Row>
              </Section>

              <Section title="Spedizione">
                <Row icon={<Truck className="h-4 w-4" />} label="A scuola">
                  <button
                    type="button"
                    onClick={() => patchPortal({ shipToSchool: !portal.shipToSchool })}
                    className="text-xs text-[var(--color-ink)] underline-offset-2 hover:underline"
                  >
                    {portal.shipToSchool ? "Si" : "No"}
                  </button>
                </Row>
                <Row icon={<Truck className="h-4 w-4" />} label="Metodo">
                  {portal.shippingMethodLabel}
                </Row>
                <Row icon={<Truck className="h-4 w-4" />} label="Costo">
                  {EURO.format(portal.shippingPriceEur)}
                </Row>
              </Section>

              <Section title="Logo">
                {portal.branding?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={portal.branding.logoUrl}
                    alt={`Logo ${portal.nome}`}
                    className="h-16 w-16 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] object-contain p-1"
                  />
                ) : (
                  <p className="text-xs text-[var(--color-ink-muted)]">Nessun logo caricato.</p>
                )}
              </Section>
            </div>
          </TabsContent>

          <TabsContent value="catalogo">
            <PortalCatalogSections
              portal={portal}
              only="products"
              onSaveCatalog={patchCatalog}
              onSaveDiscounts={patchDiscounts}
              onChanged={onChanged}
            />
          </TabsContent>

          <TabsContent value="kit">
            <PortalCatalogSections portal={portal} only="kit" onChanged={onChanged} />
          </TabsContent>
        </div>
      </Tabs>
    </Slide>
  );
}

// Barra indietro della scheda inline: sostituisce la X del DrawerHeader.
function BackBar({ portal, onBack }: { portal: PortalDetailType; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-line)] px-5 py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
      >
        <ChevronLeft size={16} />
        Portali
      </button>
      <span className="text-[var(--color-line-strong)]">/</span>
      <p className="min-w-0 truncate text-base font-semibold">{portal.nome}</p>
      <p className="shrink-0 text-xs text-[var(--color-ink-muted)]">{portal.city}</p>
    </div>
  );
}

// Le card con bordo sono sparite: sezioni separate da una linea, come nel drawer
// del catalogo. Il titolo e i colori arrivano da drawer-primitives (unica fonte).
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-5 first:pt-0">
      <BaseSection title={title}>{children}</BaseSection>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[var(--color-ink-muted)]">{icon}</span>
      <span className="min-w-[90px] text-xs text-[var(--color-ink-muted)]">{label}</span>
      <span className="min-w-0 flex-1 text-[var(--color-ink)]">{children}</span>
    </div>
  );
}
