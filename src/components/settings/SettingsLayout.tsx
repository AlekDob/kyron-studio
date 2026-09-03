"use client";
// Source: Virgilio apps/client/src/modules/settings/SettingsModule.tsx
// Adattato: layout tabs left-rail + content. Tabs gestiti via useState.
// Sezioni non ancora portate (Profilo, Organizzazione, MCP) sono placeholder.
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ProviderConnectionsSection } from "./ProviderConnectionsSection";
import { ModelRoutingSection } from "./ModelRoutingSection";
import { ComingSoonSection } from "./ComingSoonSection";
import { OrganizationSection } from "./OrganizationSection";
import { EcommerceSection } from "./EcommerceSection";
import { ThemeSection } from "./ThemeSection";

type Tab =
  | "profile"
  | "theme"
  | "connections"
  | "models"
  | "org"
  | "ecommerce"
  | "mcp";

// Brain: feature-008 — adminOnly: connessioni AI, modelli, MCP e organizzazione
// (gestione utenti) sono riservate agli admin. Tema (feature 020) e' per tutti:
// preferenza personale, salvata per-browser.
const TABS: Array<{
  id: Tab;
  label: string;
  disabled?: boolean;
  adminOnly?: boolean;
}> = [
  { id: "profile", label: "Profilo", disabled: true },
  { id: "theme", label: "Tema" },
  { id: "connections", label: "Connessioni", adminOnly: true },
  { id: "models", label: "Modelli AI", adminOnly: true },
  { id: "org", label: "Organizzazione", adminOnly: true },
  { id: "ecommerce", label: "Ecommerce", adminOnly: true },
  { id: "mcp", label: "MCP Servers", disabled: true, adminOnly: true },
];

interface Props {
  userEmail: string;
  isAdmin: boolean;
}

export function SettingsLayout({ userEmail, isAdmin }: Props) {
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  const [active, setActive] = useState<Tab>(isAdmin ? "connections" : "theme");

  return (
    <div className="flex h-full min-h-full flex-col lg:flex-row">
      {/* Tab rail — horizontal scroll on mobile, vertical on desktop */}
      <nav className="shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--color-line)] bg-[var(--color-paper-muted)] lg:w-64">
        <div className="px-4 py-3 lg:px-6 lg:py-5">
          <p className="eyebrow">Impostazioni</p>
        </div>
        <ul className="flex overflow-x-auto lg:flex-col lg:overflow-x-visible px-2 pb-2 lg:px-0 lg:pb-0 gap-1 lg:gap-0">
          {tabs.map((tab) => (
            <li key={tab.id} className="shrink-0">
              <button
                type="button"
                disabled={tab.disabled}
                onClick={() => !tab.disabled && setActive(tab.id)}
                className={cn(
                  "whitespace-nowrap rounded-full lg:rounded-none lg:w-full lg:border-l-2 px-4 py-2 lg:px-6 lg:py-2.5 text-left text-sm transition-colors",
                  active === tab.id
                    ? "bg-[var(--color-paper)] text-[var(--color-ink)] lg:border-[var(--color-accent)]"
                    : "border-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-action-subtle)] hover:text-[var(--color-ink)]",
                  tab.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[var(--color-ink-muted)]",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{tab.label}</span>
                  {tab.disabled && (
                    <span className="mono-caps text-[var(--color-ink-muted)] hidden lg:inline">
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
        <div className="mx-auto max-w-3xl px-5 py-6 lg:px-12 lg:py-10">
          {active === "theme" && <ThemeSection />}
          {active === "connections" && <ProviderConnectionsSection />}
          {active === "models" && <ModelRoutingSection />}
          {active === "profile" && (
            <ComingSoonSection
              title="Profilo"
              italicSuffix="utente"
              description="Email, nome, preferenze personali. Per ora il profilo e' gestito da Payload CMS."
            />
          )}
          {active === "org" && <OrganizationSection currentEmail={userEmail} />}
          {active === "ecommerce" && <EcommerceSection />}
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
