import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { DesktopShell } from "@/components/shell/DesktopShell";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }
  return <DesktopShell userEmail={user.email}>{children}</DesktopShell>;
}
