import { Card } from "@/components/ui";
import type { LeadTotals } from "@/lib/analytics";
import { BarList } from "./BarList";

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

  return (
    <Card padding="sm" className="px-5 py-4">
      <h2 className="text-sm font-medium mb-3">Form compilati per tipo</h2>
      <BarList
        rows={leads.forms.map(({ form, count }) => ({
          label: FORM_LABELS[form] ?? form,
          count,
        }))}
      />
    </Card>
  );
}
