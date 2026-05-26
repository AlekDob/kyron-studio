import "./globals.css";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { DesktopShell } from "@/components/shell/DesktopShell";

export const metadata: Metadata = {
  title: "Studio — Kyron",
  description: "Hub admin Kyron",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  return (
    <html lang="it">
      <body>
        <DesktopShell userEmail={user.email}>{children}</DesktopShell>
      </body>
    </html>
  );
}
