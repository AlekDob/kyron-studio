import type { ReactNode } from "react";
import { Button } from "@/components/shadcn/button";

// Primitive di layout condivise dal drawer ordine e dai suoi blocchi (DRY):
// una sezione con eyebrow + una riga label/valore allineata.

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
        {title}
      </p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="shrink-0 text-[var(--color-ink-muted)]">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

// Bottone azione primario dei blocchi ordine (stile pill scuro pieno).
export function ActionButton({
  label,
  saving,
  savingLabel = "Salvataggio…",
  onClick,
}: {
  label: string;
  saving: boolean;
  savingLabel?: string;
  onClick: () => void;
}) {
  // Prova shadcn (solo Ordini): un solo punto e tutti i bottoni azione della
  // scheda passano al Button di shadcn. `ActionButton` lo usa solo OrderBlocks.
  return (
    <Button type="button" disabled={saving} onClick={onClick}>
      {saving ? savingLabel : label}
    </Button>
  );
}

// Riga di feedback locale (esito salvataggio) sotto un blocco azione.
export function FeedbackNote({ note }: { note: string }) {
  if (!note) return null;
  return <p className="text-xs text-[var(--color-ink-muted)]">{note}</p>;
}
