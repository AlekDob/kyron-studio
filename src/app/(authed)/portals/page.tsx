import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { PortalsWorkspace } from "@/components/portals/PortalsWorkspace";

export default async function PortalsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  return <PortalsWorkspace />;
}
