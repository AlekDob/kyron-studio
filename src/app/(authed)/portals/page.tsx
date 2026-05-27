import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listPortals } from "@/lib/gateway";
import { PortalsDashboard } from "@/components/PortalsDashboard";

export default async function PortalsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  const portals = await listPortals();

  return (
    <main className="min-h-screen px-8 py-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-2">Studio / Portali</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Portali <span className="font-serif italic">scuole</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          Tutti i portali configurati dall&apos;agente. Da qui puoi vederne lo
          stato e crearne di nuovi.
        </p>
      </header>
      <PortalsDashboard portals={portals} />
    </main>
  );
}
