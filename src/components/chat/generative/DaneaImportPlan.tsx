"use client";

import type { ReactElement } from "react";
import { Card } from "@/components/ui";
import { fmtEur } from "@/components/analytics/format";

// Piano di import Danea: cosa nasce, cosa cambierebbe di prezzo, cosa resta
// fermo. I prezzi che CAMBIANO non si applicano da qui: passano dal piano
// prezzi, che sa dei voucher dei kit (money-path, decision-011).

interface PlanGroup {
  slug: string;
  aggregator: string;
  subcategory: string;
  isNew: boolean;
  newVariants: Array<{ sku: string; name: string; priceEur: number }>;
  priceChanges: Array<{ sku: string; fromEur: number | null; toEur: number }>;
  unchanged: string[];
  warnings: string[];
}

export interface DaneaImportPlanProps {
  target: "prod" | "staging";
  plan: {
    channelSlug: string;
    groups: PlanGroup[];
    totals: {
      newProducts: number;
      newVariants: number;
      priceChanges: number;
      unchanged: number;
    };
    warnings: string[];
  };
}

export function DaneaImportPlan({ target, plan }: DaneaImportPlanProps): ReactElement {
  const t = plan.totals;

  return (
    <Card padding="md">
      <Card.Header>
        <h3 className="text-sm font-medium">
          Import Danea — {plan.channelSlug}
          {target === "staging" && " (staging)"}
        </h3>
      </Card.Header>

      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        {t.newProducts} prodotti nuovi · {t.newVariants} varianti nuove ·{" "}
        {t.priceChanges} prezzi diversi · {t.unchanged} invariati
      </p>

      <div className="mt-3 space-y-3">
        {plan.groups.map((g) => (
          <div key={g.slug} className="border-t border-[var(--color-line)] pt-2">
            <p className="text-xs text-[var(--color-ink)]">
              {g.aggregator}
              <span className="text-[var(--color-ink-muted)]">
                {" "}
                · {g.slug} · {g.isNew ? "nuovo" : "esistente"}
              </span>
            </p>

            {g.newVariants.map((v) => (
              <p key={v.sku} className="mt-1 text-xs text-[var(--color-ink-soft)]">
                + {v.name} · {v.sku} · {fmtEur(v.priceEur)}
              </p>
            ))}

            {g.priceChanges.map((c) => (
              <p key={c.sku} className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {c.sku}: {c.fromEur === null ? "—" : fmtEur(c.fromEur)} →{" "}
                {fmtEur(c.toEur)} (non applicato qui)
              </p>
            ))}

            {g.unchanged.length > 0 && (
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {g.unchanged.length} invariat{g.unchanged.length === 1 ? "a" : "e"}
              </p>
            )}

            {g.warnings.map((w) => (
              <p key={w} className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {w}
              </p>
            ))}
          </div>
        ))}
      </div>

      {plan.warnings.map((w) => (
        <p key={w} className="mt-2 text-xs text-[var(--color-ink-soft)]">
          {w}
        </p>
      ))}

      <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
        Confermando in chat vengono creati solo i prodotti e le varianti nuove,
        non pubblicati. I prezzi diversi su roba esistente restano da fare col
        piano prezzi.
      </p>
    </Card>
  );
}
