"use client";

import { MapPin, Package, ShoppingBag, Truck, Globe, Hash, Check } from "lucide-react";
import { Pill } from "@/components/ui";
import type { PortalDraft } from "./PortalsWorkspace";

interface Props {
  draft: PortalDraft;
}

export function LivePortalCard({ draft }: Props) {
  const hasAnything = Boolean(draft.nome);

  if (!hasAnything) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonSection title="Informazioni" rows={4} />
        <SkeletonSection title="Indirizzo" rows={3} />
        <SkeletonSection title="Catalogo" rows={1} />
        <SkeletonSection title="Kit" rows={1} />
        <SkeletonSection title="Spedizione" rows={1} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Informazioni">
        <LiveRow
          icon={<Hash className="h-3.5 w-3.5" />}
          label="Nome"
          value={draft.nome}
        />
        <LiveRow
          icon={<Hash className="h-3.5 w-3.5" />}
          label="Slug"
          value={draft.slug}
          mono
        />
        <LiveRow
          icon={<Globe className="h-3.5 w-3.5" />}
          label="Sito"
          value={draft.sitoUfficiale}
        />
        <LiveRow
          icon={<Hash className="h-3.5 w-3.5" />}
          label="Cod. MIUR"
          value={draft.codiceMeccanografico}
        />
      </Section>

      <Section title="Indirizzo">
        <LiveRow
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Via"
          value={draft.via}
        />
        <LiveRow
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Citta'"
          value={
            draft.city
              ? `${draft.cap ?? "..."} ${draft.city}${draft.provincia ? ` (${draft.provincia})` : ""}`
              : undefined
          }
        />
      </Section>

      <Section
        title={`Catalogo${draft.selectedProducts ? ` (${draft.selectedProducts.length})` : ""}`}
      >
        {draft.selectedProducts ? (
          <div className="flex flex-wrap gap-1.5">
            {draft.selectedProducts.map((s) => (
              <Pill key={s} variant="neutral" size="sm">
                {s}
              </Pill>
            ))}
          </div>
        ) : (
          <SkeletonBar />
        )}
      </Section>

      <Section title={`Kit${draft.bundles ? ` (${draft.bundles.length})` : ""}`}>
        {draft.bundles && draft.bundles.length > 0 ? (
          <div className="flex flex-col gap-2">
            {draft.bundles.map((b, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-control)] border border-[var(--color-line)] p-2.5"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--color-ink)]">
                    {b.name}
                  </span>
                  <span className="text-xs tabular-nums text-[var(--color-ink)]">
                    {b.priceEur} EUR
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {b.components.map((c) => (
                    <Pill key={c} variant="neutral" size="sm">
                      {c}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SkeletonBar />
        )}
      </Section>

      <Section title="Spedizione">
        <LiveRow
          icon={<Truck className="h-3.5 w-3.5" />}
          label="A scuola"
          value={
            draft.shipToSchool != null
              ? draft.shipToSchool
                ? "Si"
                : "No"
              : undefined
          }
        />
      </Section>

      {draft.saved ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--color-positive)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-positive)_8%,transparent)] p-3 text-sm text-[var(--color-positive)]">
          <Check className="h-4 w-4" />
          Portale salvato
        </div>
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
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3.5">
      <h3 className="text-[10px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider mb-2.5">
        {title}
      </h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function LiveRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[var(--color-ink-muted)]">{icon}</span>
      <span className="text-[var(--color-ink-muted)] min-w-[70px]">
        {label}
      </span>
      {value ? (
        <span
          className={`text-[var(--color-ink)] animate-[fadeIn_0.3s_ease-out] ${mono ? "font-mono text-[11px]" : ""}`}
        >
          {value}
        </span>
      ) : (
        <span className="h-3.5 w-24 rounded-sm bg-[var(--color-paper-muted)] animate-pulse" />
      )}
    </div>
  );
}

function SkeletonSection({
  title,
  rows,
}: {
  title: string;
  rows: number;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3.5">
      <h3 className="text-[10px] font-medium text-[var(--color-ink-muted)] uppercase tracking-wider mb-2.5">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonBar key={i} />
        ))}
      </div>
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="h-3.5 rounded-sm bg-[var(--color-paper-muted)] animate-pulse" />
  );
}
