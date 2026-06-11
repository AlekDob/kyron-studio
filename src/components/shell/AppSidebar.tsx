"use client";
// Source: Virgilio apps/client/src/shell/AppSidebar.tsx — adattato per Next.js App Router.
import { LayoutGrid, Moon, Sun, Command, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, Pill } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MODULES, type ModuleDefinition } from "./modules";
import { useTheme } from "./ThemeProvider";
import { useCommandPalette } from "./CommandPaletteProvider";

interface Props {
  userEmail?: string;
  // Modalita' rail: solo icone (label/pill nascoste). Usata dal DesktopShell
  // su /preview per dare piu' spazio all'iframe; espansione in hover.
  collapsed?: boolean;
}

export function AppSidebar({ userEmail, collapsed = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggle } = useTheme();
  const { open: openPalette } = useCommandPalette();

  const inbox = MODULES.find((m) => m.id === "inbox");
  const agents = MODULES.filter((m) => m.kind === "agent");
  const tools = MODULES.filter((m) => m.kind === "tool" && m.id !== "inbox");

  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const go = (href: string): void => {
    router.push(href);
  };

  // Una sezione di moduli (Agenti AI / Strumenti) — estratta per DRY.
  const moduleSection = (title: string, items: ModuleDefinition[]) =>
    items.length > 0 && (
      <Sidebar.Section title={collapsed ? undefined : title}>
        {items.map((m) => {
          const Icon = m.icon;
          const disabled = m.status === "coming-soon";
          return (
            <Sidebar.Item
              key={m.id}
              icon={<Icon className="h-4 w-4" />}
              active={isActive(m.href)}
              disabled={disabled}
              title={collapsed ? m.label : undefined}
              onClick={() => !disabled && go(m.href)}
              className={disabled ? "cursor-not-allowed opacity-60" : undefined}
            >
              {!collapsed && (
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">{m.label}</span>
                  {disabled && (
                    <Pill variant="neutral" size="sm">presto</Pill>
                  )}
                </span>
              )}
            </Sidebar.Item>
          );
        })}
      </Sidebar.Section>
    );

  return (
    <Sidebar width={248} className="bg-[var(--color-paper-muted)]" style={{ width: "100%" }}>
      <div
        className={cn(
          "flex items-center py-4",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-paper)]">
            K
          </span>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Studio
            </span>
          )}
        </div>
        {!collapsed && <Pill variant="neutral" size="sm">anteprima</Pill>}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <Sidebar.Section>
          {inbox && (
            <Sidebar.Item
              icon={<inbox.icon className="h-4 w-4" />}
              active={isActive(inbox.href)}
              disabled={inbox.status === "coming-soon"}
              title={collapsed ? inbox.label : undefined}
              onClick={() => inbox.status === "live" && go(inbox.href)}
              className={inbox.status === "coming-soon" ? "cursor-not-allowed opacity-60" : undefined}
            >
              {!collapsed && inbox.label}
            </Sidebar.Item>
          )}
          <Sidebar.Item
            icon={<LayoutGrid className="h-4 w-4" />}
            active={pathname === "/"}
            title={collapsed ? "Dashboard" : undefined}
            onClick={() => go("/")}
          >
            {!collapsed && "Dashboard"}
          </Sidebar.Item>
          <Sidebar.Item
            icon={<Command className="h-4 w-4" />}
            onClick={openPalette}
            title={collapsed ? "Comandi" : undefined}
            className="hidden lg:flex"
          >
            {!collapsed && (
              <span className="flex w-full items-center justify-between gap-2">
                <span>Comandi</span>
                <span className="mono-caps text-[var(--color-ink-muted)]">⌘K</span>
              </span>
            )}
          </Sidebar.Item>
        </Sidebar.Section>

        {moduleSection("Agenti AI", agents)}
        {moduleSection("Strumenti", tools)}
      </div>

      <Sidebar.Footer>
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Tema" : undefined}
          className="flex w-full items-center gap-3 rounded-[var(--radius-card)] px-3 py-2 text-left text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-action-subtle)] hover:text-[var(--color-ink)]"
          aria-label={mode === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"}
        >
          {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>Tema {mode === "dark" ? "chiaro" : "scuro"}</span>}
        </button>
        {/* Brain: feature-008 — logout: re-login applica il ruolo aggiornato */}
        <a
          href="/api/logout"
          title={collapsed ? "Esci" : undefined}
          className="mt-1 flex w-full items-center gap-3 rounded-[var(--radius-card)] px-3 py-2 text-left text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-action-subtle)] hover:text-[var(--color-ink)]"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Esci</span>}
        </a>
        {userEmail && !collapsed && (
          <div className="mt-2 px-3 pb-1 text-xs text-[var(--color-ink-muted)] truncate">
            {userEmail}
          </div>
        )}
      </Sidebar.Footer>
    </Sidebar>
  );
}
