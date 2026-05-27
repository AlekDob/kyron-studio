import { MapPin, Package, ShoppingBag, Truck, Globe, Hash } from "lucide-react";
import { Pill } from "@/components/ui";
import type { PortalDetail as PortalDetailType } from "@/lib/gateway";

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

const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

interface Props {
  portal: PortalDetailType;
}

export function PortalDetail({ portal }: Props) {
  const addr = portal.schoolAddress as Record<string, string>;
  const variant = STATUS_VARIANT[portal.status] ?? "neutral";
  const label = STATUS_LABEL[portal.status] ?? portal.status;

  return (
    <div className="flex flex-col gap-6">
      <Section title="Informazioni">
        <Row icon={<Hash className="h-4 w-4" />} label="Slug">
          <code className="text-xs">{portal.slug}</code>
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Stato">
          <Pill variant={variant} size="sm">{label}</Pill>
        </Row>
        {portal.sitoUfficiale && portal.sitoUfficiale !== "TBD" ? (
          <Row icon={<Globe className="h-4 w-4" />} label="Sito">
            {portal.sitoUfficiale}
          </Row>
        ) : null}
        <Row icon={<Hash className="h-4 w-4" />} label="Cod. meccanografico">
          {portal.codiceMeccanografico}
        </Row>
      </Section>

      <Section title="Indirizzo">
        <Row icon={<MapPin className="h-4 w-4" />} label="Via">
          {addr.streetAddress1}
        </Row>
        <Row icon={<MapPin className="h-4 w-4" />} label="Citta'">
          {addr.postalCode} {addr.city} ({addr.countryArea})
        </Row>
      </Section>

      <Section title="Spedizione">
        <Row icon={<Truck className="h-4 w-4" />} label="A scuola">
          {portal.shipToSchool ? "Si" : "No"}
        </Row>
        <Row icon={<Truck className="h-4 w-4" />} label="Metodo">
          {portal.shippingMethodLabel}
        </Row>
        <Row icon={<Truck className="h-4 w-4" />} label="Costo">
          {EURO.format(portal.shippingPriceEur)}
        </Row>
      </Section>

      <Section title={`Catalogo (${portal.catalog.visibleSlugs.length} prodotti)`}>
        <div className="flex flex-wrap gap-1.5">
          {portal.catalog.visibleSlugs.map((s) => (
            <Pill key={s} variant="neutral" size="sm">
              {s}
            </Pill>
          ))}
        </div>
      </Section>

      {portal.bundles.length > 0 ? (
        <Section title={`Kit (${portal.bundles.length})`}>
          <div className="flex flex-col gap-3">
            {portal.bundles.map((b) => (
              <div
                key={b.slug}
                className="rounded-[var(--radius-control)] border border-[var(--color-line)] p-3"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    {b.name}
                  </span>
                  <span className="text-sm tabular-nums text-[var(--color-ink)]">
                    {EURO.format(b.finalPriceEur)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {b.components.map((c, i) => (
                    <Pill key={i} variant="neutral" size="sm">
                      {String(c.productSlug)}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <h3 className="text-xs font-medium text-[var(--color-ink-muted)] uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[var(--color-ink-muted)]">{icon}</span>
      <span className="text-[var(--color-ink-muted)] min-w-[100px]">
        {label}
      </span>
      <span className="text-[var(--color-ink)]">{children}</span>
    </div>
  );
}
