import { Card } from "@/components/ui";
import type { PageRow } from "@/lib/analytics";
import { BarList } from "./BarList";

// Pagine piu' visitate (per visitatori unici). Path "/" etichettato Home;
// dati globali (cms + shop), non filtrati per origine.

function pageLabel(path: string): string {
  if (path === "/") return "Home";
  if (path === "/shop") return "Shop";
  return path;
}

interface PagesBreakdownProps {
  pages: PageRow[];
}

export function PagesBreakdown({ pages }: PagesBreakdownProps) {
  if (pages.length === 0) return null;

  return (
    <Card padding="sm" className="px-5 py-4">
      <h2 className="text-sm font-medium mb-3">Pagine piu' visitate</h2>
      <BarList
        rows={pages.map((p) => ({ label: pageLabel(p.path), count: p.visitors }))}
      />
    </Card>
  );
}
