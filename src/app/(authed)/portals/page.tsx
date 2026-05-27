import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listPortals } from "@/lib/gateway";
import { PortalsWorkspace } from "@/components/portals/PortalsWorkspace";

interface Props {
  searchParams: Promise<{ detail?: string }>;
}

export default async function PortalsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  const [portals, { detail }] = await Promise.all([listPortals(), searchParams]);

  return <PortalsWorkspace initialPortals={portals} initialDetailSlug={detail} />;
}
