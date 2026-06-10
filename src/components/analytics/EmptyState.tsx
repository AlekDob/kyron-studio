import { ChartNoAxesColumn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { AnalyticsErrorKind } from "@/lib/analytics";

// Stati vuoti/errore del modulo Analytics. Tre varianti:
// not-configured (manca la personal API key sul server), query-error
// (PostHog irraggiungibile e nessuna cache stale), no-data (zero eventi).

type Variant = AnalyticsErrorKind | "no-data";

const COPY: Record<Variant, { title: string; body: string }> = {
  "not-configured": {
    title: "Analytics non configurata",
    body: "Sul server mancano POSTHOG_API_KEY (personal key con scope query:read) e POSTHOG_PROJECT_ID. Aggiungile alle env di studio-server e ricarica.",
  },
  "query-error": {
    title: "PostHog non raggiungibile",
    body: "La query verso PostHog e' fallita e non c'e' una copia in cache. Riprova tra qualche minuto; se persiste controlla la personal API key.",
  },
  unknown: {
    title: "Errore inatteso",
    body: "Qualcosa e' andato storto nel recupero dei dati. Riprova ricaricando la pagina.",
  },
  "no-data": {
    title: "Nessun evento nel periodo",
    body: "PostHog non ha registrato traffico nell'intervallo selezionato. Prova ad allargare il periodo.",
  },
};

export function AnalyticsEmptyState({ variant }: { variant: Variant }) {
  const copy = COPY[variant];
  return (
    <Card padding="lg" className="text-center">
      <ChartNoAxesColumn
        aria-hidden="true"
        className="mx-auto size-8 text-[var(--color-ink-muted)]"
      />
      <h2 className="mt-3 text-base font-medium">{copy.title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--color-ink-muted)]">
        {copy.body}
      </p>
    </Card>
  );
}
