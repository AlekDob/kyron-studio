import { Card } from "@/components/ui";
import type { SourceRow } from "@/lib/analytics";
import { BarList } from "./BarList";

// Fonti delle visite: utm_source o referring domain dal payload PostHog.
// Le varianti dello stesso social (m.facebook.com, lm.facebook.com, app
// Android LinkedIn...) vengono raggruppate in un'unica voce leggibile.
// Dati globali (cms + shop), non filtrati per origine.

const SOURCE_GROUPS: Array<{ match: RegExp; label: string }> = [
  { match: /facebook\.com$|^fb$/i, label: "Facebook" },
  { match: /instagram\.com$|^ig$/i, label: "Instagram" },
  { match: /linkedin\.com$|linkedin\.android$|^linkedin$/i, label: "LinkedIn" },
  { match: /google\./i, label: "Google" },
  { match: /bing\.com$/i, label: "Bing" },
  { match: /whatsapp/i, label: "WhatsApp" },
  { match: /t\.co$|twitter\.com$|^x\.com$/i, label: "X (Twitter)" },
];

function sourceLabel(source: string): string {
  if (source === "$direct") return "Diretto";
  if (source.endsWith("kyronedu.it")) return "Interno (kyronedu.it)";
  const group = SOURCE_GROUPS.find((g) => g.match.test(source));
  return group ? group.label : source;
}

// Raggruppa per label normalizzata e riordina per volume.
function groupSources(sources: SourceRow[]): Array<{ label: string; count: number }> {
  const byLabel = new Map<string, number>();
  for (const s of sources) {
    const label = sourceLabel(s.source);
    byLabel.set(label, (byLabel.get(label) ?? 0) + s.visitors);
  }
  return [...byLabel.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

interface SourcesBreakdownProps {
  sources: SourceRow[];
}

export function SourcesBreakdown({ sources }: SourcesBreakdownProps) {
  const rows = groupSources(sources);
  if (rows.length === 0) return null;

  return (
    <Card padding="sm" className="px-5 py-4">
      <h2 className="text-sm font-medium mb-3">Fonti delle visite</h2>
      <BarList rows={rows} />
    </Card>
  );
}
