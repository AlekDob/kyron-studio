"use client";
// Source: Virgilio apps/client/src/modules/settings/SettingsModule.tsx
// Adattato: layout tabs left-rail + content. Tabs gestiti via useState.
// Sezioni non ancora portate (Profilo, Organizzazione, MCP) sono placeholder.
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ProviderConnectionsSection } from "./ProviderConnectionsSection";
import { ModelRoutingSection } from "./ModelRoutingSection";
import { ThemeSection } from "./ThemeSection";
import { ComingSoonSection } from "./ComingSoonSection";

type Tab = "profile" | "connections" | "models" | "theme" | "org" | "mcp";

const TABS: Array<{ id: Tab; label: string; disabled?: boolean }> = [
  { id: "profile", label: "Profilo", disabled: true },
  { id: "connections", label: "Connessioni" },
  { id: "models", label: "Modelli AI" },
  { id: "theme", label: "Tema" },
  { id: "org", label: "Organizzazione", disabled: true },
  { id: "mcp", label: "MCP Servers", disabled: true },
];

export function SettingsLayout() {
  const [active, setActive] = useState<Tab>("connections");

  return (
    <div className="flex h-full min-h-screen">
      <nav className="w-64 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-paper-muted)]">
        <div className="px-6 py-5">
          <p className="eyebrow">Impostazioni</p>
        </div>
        <ul>
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                disabled={tab.disabled}
                onClick={() => !tab.disabled && setActive(tab.id)}
                className={cn(
                  "w-full border-l-2 px-6 py-2.5 text-left text-sm transition-colors",
                  active === tab.id
                    ? "border-[var(--color-accent)] bg-[var(--color-paper)] text-[var(--color-ink)]"
                    : "border-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-action-subtle)] hover:text-[var(--color-ink)]",
                  tab.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[var(--color-ink-muted)]",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{tab.label}</span>
                  {tab.disabled && (
                    <span className="mono-caps text-[var(--color-ink-muted)]">
                      presto
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-12 py-10">
          {active === "connections" && <ProviderConnectionsSection />}
          {active === "models" && <ModelRoutingSection />}
          {active === "theme" && <ThemeSection />}
          {active === "profile" && (
            <ComingSoonSection
              title="Profilo"
              italicSuffix="utente"
              description="Email, nome, preferenze personali. Per ora il profilo e' gestito da Payload CMS."
            />
          )}
          {active === "org" && (
            <ComingSoonSection
              title="Organizzazione"
              description="Configurazione tenant Kyron, moduli abilitati, branding."
            />
          )}
          {active === "mcp" && (
            <ComingSoonSection
              title="MCP Servers"
              description="Server MCP custom per estendere gli agenti AI con tool aziendali."
            />
          )}
        </div>
      </div>
    </div>
  );
}
