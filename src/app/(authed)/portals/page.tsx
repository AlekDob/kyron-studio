import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listPortals, type PortalSummary } from "@/lib/gateway";
import { PortalsWorkspace } from "@/components/portals/PortalsWorkspace";

interface Props {
  searchParams: Promise<{ detail?: string }>;
}

export default async function PortalsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  // Se studio-server o Payload non rispondono la pagina resta in piedi con la
  // lista vuota, come fa /orders: prima l'eccezione buttava giu' tutto in 500.
  let portals: PortalSummary[] = [];
  try {
    portals = await listPortals();
  } catch {
    portals = [];
  }
  const { detail } = await searchParams;

  return <PortalsWorkspace initialPortals={portals} initialDetailSlug={detail} />;
}
