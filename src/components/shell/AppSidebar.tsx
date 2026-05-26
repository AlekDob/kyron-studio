"use client";
// Source: Virgilio apps/client/src/shell/AppSidebar.tsx — adattato per Next.js App Router.
import { LayoutGrid, Moon, Sun, Command } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, Pill } from "@/components/ui";
import { MODULES } from "./modules";
import { useTheme } from "./ThemeProvider";
import { useCommandPalette } from "./CommandPaletteProvider";

interface Props {
  userEmail?: string;
}

export function AppSidebar({ userEmail }: Props) {
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

  return (
    <Sidebar width={248} className="bg-[var(--color-paper-muted)]" style={{ width: "100%" }}>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-paper)]">
            K
          </span>
          <span className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
            Studio
          </span>
        </div>
        <Pill variant="neutral" size="sm">anteprima</Pill>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <Sidebar.Section>
          {inbox && (
            <Sidebar.Item
              icon={<inbox.icon className="h-4 w-4" />}
              active={isActive(inbox.href)}
              disabled={inbox.status === "coming-soon"}
              onClick={() => inbox.status === "live" && go(inbox.href)}
              className={inbox.status === "coming-soon" ? "cursor-not-allowed opacity-60" : undefined}
            >
              {inbox.label}
            </Sidebar.Item>
          )}
          <Sidebar.Item
            icon={<LayoutGrid className="h-4 w-4" />}
            active={pathname === "/"}
            onClick={() => go("/")}
          >
            Dashboard
          </Sidebar.Item>
          <Sidebar.Item
            icon={<Command className="h-4 w-4" />}
            onClick={openPalette}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span>Comandi</span>
              <span className="mono-caps text-[var(--color-ink-muted)]">⌘K</span>
            </span>
          </Sidebar.Item>
        </Sidebar.Section>

        {agents.length > 0 && (
          <Sidebar.Section title="Agenti AI">
            {agents.map((m) => {
              const Icon = m.icon;
              const disabled = m.status === "coming-soon";
              return (
                <Sidebar.Item
                  key={m.id}
                  icon={<Icon className="h-4 w-4" />}
                  active={isActive(m.href)}
                  disabled={disabled}
                  onClick={() => !disabled && go(m.href)}
                  className={disabled ? "cursor-not-allowed opacity-60" : undefined}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{m.label}</span>
                    {disabled && (
                      <Pill variant="neutral" size="sm">presto</Pill>
                    )}
                  </span>
                </Sidebar.Item>
              );
            })}
          </Sidebar.Section>
        )}

        {tools.length > 0 && (
          <Sidebar.Section title="Strumenti">
            {tools.map((m) => {
              const Icon = m.icon;
              const disabled = m.status === "coming-soon";
              return (
                <Sidebar.Item
                  key={m.id}
                  icon={<Icon className="h-4 w-4" />}
                  active={isActive(m.href)}
                  disabled={disabled}
                  onClick={() => !disabled && go(m.href)}
                  className={disabled ? "cursor-not-allowed opacity-60" : undefined}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{m.label}</span>
                    {disabled && (
                      <Pill variant="neutral" size="sm">presto</Pill>
                    )}
                  </span>
                </Sidebar.Item>
              );
            })}
          </Sidebar.Section>
        )}
      </div>

      <Sidebar.Footer>
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-[var(--radius-card)] px-3 py-2 text-left text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-action-subtle)] hover:text-[var(--color-ink)]"
          aria-label={mode === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"}
        >
          {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>Tema {mode === "dark" ? "chiaro" : "scuro"}</span>
        </button>
        {userEmail && (
          <div className="mt-2 px-3 pb-1 text-xs text-[var(--color-ink-muted)] truncate">
            {userEmail}
          </div>
        )}
      </Sidebar.Footer>
    </Sidebar>
  );
}
