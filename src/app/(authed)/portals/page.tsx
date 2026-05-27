import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listPortals } from "@/lib/gateway";
import { PortalsWorkspace } from "@/components/portals/PortalsWorkspace";

export default async function PortalsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  const portals = await listPortals();

  return <PortalsWorkspace initialPortals={portals} />;
}
