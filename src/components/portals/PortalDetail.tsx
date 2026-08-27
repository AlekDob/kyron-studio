"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  MapPin,
  Truck,
  Globe,
  Hash,
  User,
  ExternalLink,
} from "lucide-react";
import { Pill } from "@/components/ui";
import { Section as BaseSection } from "@/components/orders/drawer-primitives";
import { EnablePortalButton } from "./EnablePortalButton";
import { PortalCatalogSections } from "./PortalCatalogSections";
import { STATUS_LABEL, STATUS_VARIANT } from "./portal-status";
import { portalShopUrl } from "./portal-links";
import { InlineText } from "./inline-fields";
import type { PortalDetail as PortalDetailType } from "@/lib/gateway";

const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

interface Props {
  portal: PortalDetailType;
  onChanged?: () => void;
}

export function PortalDetail({ portal, onChanged }: Props) {
  const addr = portal.schoolAddress as Record<string, string>;
  const variant = STATUS_VARIANT[portal.status] ?? "neutral";
  const label = STATUS_LABEL[portal.status] ?? portal.status;

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

  return (
    <div className="divide-y divide-[var(--color-line)]">
      <Section title="Pubblicazione">
        <EnablePortalButton
          slug={portal.slug}
          status={portal.status}
          onDone={onChanged}
        />
      </Section>

      <Section title="Informazioni">
        <Row icon={<Hash className="h-4 w-4" />} label="Slug">
          <code className="text-xs text-[var(--color-ink-muted)]">
            {portal.slug}
          </code>
        </Row>
        <Row icon={<ExternalLink className="h-4 w-4" />} label="Link">
          <a
            href={portalShopUrl(portal.slug)}
            target="_blank"
            rel="noreferrer"
            className="truncate text-sm text-[var(--color-ink)] underline underline-offset-2 hover:text-[var(--color-accent)]"
          >
            kyronedu.it/shop/{portal.slug}
          </a>
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Nome">
          <InlineText value={portal.nome} onSave={(v) => patchPortal({ nome: v })} />
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Stato">
          <Pill variant={variant} size="sm">{label}</Pill>
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
          <InlineText
            value={addr.city ?? ""}
            onSave={(v) => patchPortal({ city: v })}
          />
        </Row>
        <Row icon={<MapPin className="h-4 w-4" />} label="Prov.">
          <InlineText
            value={addr.countryArea ?? ""}
            onSave={(v) =>
              patchPortal({ countryArea: v.toUpperCase().slice(0, 2) })
            }
          />
        </Row>
      </Section>

      <Section title="Spedizione">
        <Row icon={<Truck className="h-4 w-4" />} label="A scuola">
          <button
            type="button"
            onClick={() => patchPortal({ shipToSchool: !portal.shipToSchool })}
            className="text-xs underline-offset-2 hover:underline text-[var(--color-ink)]"
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
          <img
            src={portal.branding.logoUrl}
            alt={`Logo ${portal.nome}`}
            className="h-16 w-16 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] object-contain p-1"
          />
        ) : (
          <p className="text-xs text-[var(--color-ink-muted)]">
            Nessun logo caricato.
          </p>
        )}
      </Section>

      <PortalCatalogSections
        portal={portal}
        onSaveCatalog={patchCatalog}
        onSaveDiscounts={patchDiscounts}
        onChanged={onChanged}
      />

    </div>
  );
}

// Le card con bordo sono sparite: sezioni separate da una linea, come nel drawer
// del catalogo. Il titolo e i colori arrivano da drawer-primitives (unica fonte).
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-5">
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
      <span className="text-[var(--color-ink-muted)] min-w-[90px] text-xs">
        {label}
      </span>
      <span className="text-[var(--color-ink)] flex-1 min-w-0">{children}</span>
    </div>
  );
}
