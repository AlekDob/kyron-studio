import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { StudioShell } from "@/components/shell/StudioShell";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }
  return <StudioShell userEmail={user.email}>{children}</StudioShell>;
}
