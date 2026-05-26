"use client";
// Source: Virgilio apps/client/src/shell/DesktopShell.tsx — semplificato (no resizable panel, no AnimatePresence).
import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { CommandPaletteProvider } from "./CommandPaletteProvider";
import { AppSidebar } from "./AppSidebar";

interface Props {
  children: ReactNode;
  userEmail?: string;
}

export function DesktopShell({ children, userEmail }: Props) {
  return (
    <ThemeProvider>
      <CommandPaletteProvider>
        <div className="flex h-screen bg-[var(--color-paper)]">
          <div className="w-[248px] shrink-0">
            <AppSidebar userEmail={userEmail} />
          </div>
          <main className="relative flex-1 min-w-0 overflow-y-auto">{children}</main>
        </div>
      </CommandPaletteProvider>
    </ThemeProvider>
  );
}
