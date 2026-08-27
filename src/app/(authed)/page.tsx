import { DashboardMosaic } from "@/components/dashboard/DashboardMosaic";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata = { title: "Dashboard — Studio" };

// La home e' il cruscotto, non un launcher: i moduli stanno in sidebar e in
// Cmd+K, qui ci vanno i numeri di oggi.
export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14 xl:px-12">
        <DashboardShell>
          <DashboardMosaic />
        </DashboardShell>
      </div>
    </div>
  );
}
