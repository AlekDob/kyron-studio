import { Card } from "@/components/ui/Card";
import type { LeadTotals } from "@/lib/analytics";
import { fmtInt } from "./format";

// Dettaglio "quali form": volume per singolo form nel periodo.
// I dati sono globali (cms + shop), non filtrati per origine.

const FORM_LABELS: Record<string, string> = {
  contatti: "Contatti",
  "contatti-shop": "Contatti (shop)",
  "richiesta-informazioni": "Richiesta informazioni",
  "lavora-con-noi": "Lavora con noi",
  altro: "Altro",
};

interface FormsBreakdownProps {
  leads: LeadTotals;
}

export function FormsBreakdown({ leads }: FormsBreakdownProps) {
  if (leads.forms.length === 0) return null;
  const max = leads.forms[0]?.count || 1;

  return (
    <Card padding="sm" className="px-5 py-4">
      <h2 className="text-sm font-medium mb-3">Form compilati per tipo</h2>
      <ul className="flex flex-col gap-2.5">
        {leads.forms.map(({ form, count }) => (
          <li key={form} className="flex items-center gap-3">
            <span className="w-48 shrink-0 truncate text-sm text-[var(--color-ink-soft)]">
              {FORM_LABELS[form] ?? form}
            </span>
            <span
              className="h-2 rounded-full bg-[var(--color-action)] opacity-80"
              style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
              aria-hidden="true"
            />
            <span className="ml-auto text-sm tabular-nums font-medium">
              {fmtInt(count)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
