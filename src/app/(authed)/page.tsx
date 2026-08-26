import { PageHeader } from "@/components/ui";
import { DashboardMosaic } from "@/components/dashboard/DashboardMosaic";

export const metadata = { title: "Dashboard — Studio" };

// La home e' il cruscotto, non un launcher: i moduli stanno in sidebar e in
// Cmd+K, qui ci vanno i numeri di oggi.
export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14 xl:px-12">
        <PageHeader
          eyebrow="Kyron"
          title="Dashboard"
          description="Ordini, portali e visite degli ultimi 30 giorni."
        />
        <DashboardMosaic />
      </div>
    </div>
  );
}
