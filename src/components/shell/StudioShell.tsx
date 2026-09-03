"use client";
// Configurazione Kyron della shell condivisa: moduli, copy italiana, pill
// "anteprima" accanto al marchio. La shell vera sta in @studiofuturo/studio-core.
import {
  DesktopShell,
  Pill,
  SubChannels,
  type ModuleDefinition,
} from "@studiofuturo/studio-core";
import type { ReactNode } from "react";
import { AGENTS, MODULES } from "./modules";

const COPY = {
  studio: "Studio",
  dashboard: "Dashboard",
  modules: "Moduli",
  agentsSection: "Agenti AI",
  toolsSection: "Strumenti",
  comingSoon: "presto",
  logout: "Esci",
  openMenu: "Apri menu",
  closeMenu: "Chiudi menu",
  commands: "Comandi",
  paletteLabel: "Comandi",
  palettePlaceholder: "Scrivi un comando o cerca un'app...",
  paletteEmpty: "Nessun risultato",
  paletteGroup: "App",
  paletteSelectHint: "↵ seleziona",
  paletteCloseHint: "esc chiudi",
};

/** Su /preview la sidebar e' una rail di sole icone: spazio all'iframe. */
function isPreviewPath(pathname: string): boolean {
  return pathname.startsWith("/preview");
}

// Workspace: pannello + chat a tutta altezza, lo scroll lo gestisce la pagina.
// Senza questo la lastra scrolla tutta insieme e il pannello perde la testata.
const WORKSPACE_PATHS = ["/orders", "/prodotti", "/clienti", "/portals", "/preview"];

function isWorkspacePath(pathname: string): boolean {
  return WORKSPACE_PATHS.some((p) => pathname.startsWith(p));
}

/** Gli agenti sono i canali della voce "Agenti": nome + ruolo, come su Slack. */
function agentChannels(m: ModuleDefinition): ReactNode {
  if (m.id !== "agents") return null;
  return (
    <SubChannels
      // Gli agenti che hanno gia' una voce di primo livello (Nico su Ordini,
      // Teo su Prodotti) non si ripetono qui: sarebbero due righe per lo
      // stesso posto.
      channels={AGENTS.filter((a) => !MODULES.some((m) => m.id === a.id)).map((a) => ({
        href: a.href,
        label: a.agentName,
        meta: a.agentRole,
      }))}
    />
  );
}

export function StudioShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail?: string;
}) {
  return (
    <DesktopShell
      modules={MODULES}
      userEmail={userEmail}
      copy={COPY}
      fillPane={isWorkspacePath}
      compactRail={isPreviewPath}
      subChannels={agentChannels}
      brandBadge={
        <Pill variant="neutral" size="sm">
          anteprima
        </Pill>
      }
      comingSoonBadge={
        <Pill variant="neutral" size="sm">
          presto
        </Pill>
      }
    >
      {children}
    </DesktopShell>
  );
}
