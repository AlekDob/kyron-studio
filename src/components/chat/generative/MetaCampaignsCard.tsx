"use client";

import type { ReactElement } from "react";
import { Card } from "@/components/ui";
import { BarList } from "@/components/analytics/BarList";
import { fmtEur, fmtInt, fmtPct } from "@/components/analytics/format";

// Campagne Meta (o adset di una campagna) mostrate da Ada. Riusa BarList e i
// formattatori del modulo Analytics: stessa lettura visiva del cruscotto.

interface Campaign {
  id: string;
  name: string;
  spendEur: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpcEur: number;
  actions: Array<{ type: string; count: number }>;
}

export interface MetaCampaignsCardProps {
  title: string;
  campaigns: Campaign[];
}

// Le sole azioni che ci dicono qualcosa di commerciale: Meta ne restituisce
// una ventina (page_engagement, video_view, ...) e affogherebbero il numero.
const USEFUL_ACTIONS = new Set(["lead", "purchase", "initiate_checkout", "add_to_cart"]);

function conversions(c: Campaign): number {
  return c.actions
    .filter((a) => USEFUL_ACTIONS.has(a.type.replace(/^offsite_conversion\.fb_pixel_/, "")))
    .reduce((sum, a) => sum + a.count, 0);
}

export function MetaCampaignsCard({
  title,
  campaigns,
}: MetaCampaignsCardProps): ReactElement {
  const spend = campaigns.reduce((s, c) => s + c.spendEur, 0);
  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);

  return (
    <Card padding="md">
      <Card.Header>
        <h3 className="text-sm font-medium">{title}</h3>
      </Card.Header>

      {campaigns.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Nessuna campagna con spesa in questo periodo.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          <p className="text-sm text-[var(--color-ink-soft)]">
            {fmtEur(spend)} spesi, {fmtInt(clicks)} click
          </p>
          <BarList
            rows={campaigns.map((c) => ({
              label: c.name,
              count: Math.round(c.spendEur),
            }))}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-muted)]">
                  <th className="px-2 py-1.5 font-medium">Campagna</th>
                  <th className="px-2 py-1.5 font-medium">Spesa</th>
                  <th className="px-2 py-1.5 font-medium">Click</th>
                  <th className="px-2 py-1.5 font-medium">CTR</th>
                  <th className="px-2 py-1.5 font-medium">CPC</th>
                  <th className="px-2 py-1.5 font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id || c.name}
                    className="border-b border-[var(--color-line)] last:border-0"
                  >
                    <td className="px-2 py-1.5">{c.name}</td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtEur(c.spendEur)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtInt(c.clicks)}</td>
                    {/* Meta manda il CTR gia' in percentuale (2.4 = 2,4%). */}
                    <td className="px-2 py-1.5 tabular-nums">{fmtPct(c.ctr / 100)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtEur(c.cpcEur)}</td>
                    <td className="px-2 py-1.5 tabular-nums">{fmtInt(conversions(c))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
