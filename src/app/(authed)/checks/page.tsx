import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { ChecksWorkspace } from "@/components/checks/ChecksWorkspace";

export default async function ChecksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  return <ChecksWorkspace />;
}
