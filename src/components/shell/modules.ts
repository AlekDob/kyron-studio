import {
  Inbox,
  GraduationCap,
  Store,
  Brain,
  ScrollText,
  Settings,
  Database,
  type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "live" | "coming-soon";
export type ModuleKind = "agent" | "tool";

export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  kind: ModuleKind;
  status: ModuleStatus;
  tone: { tile: string; icon: string };
}

export const MODULES: ModuleDefinition[] = [
  {
    id: "inbox",
    label: "Inbox",
    description: "Tutte le conversazioni con i tuoi agenti in un posto.",
    href: "/inbox",
    icon: Inbox,
    kind: "tool",
    status: "coming-soon",
    tone: { tile: "bg-[#1F2937]", icon: "text-white" },
  },
  {
    id: "schools-onboarding",
    label: "Onboarding scuole",
    description: "Chat agentica per raccogliere i dati di una nuova scuola.",
    href: "/schools/onboarding",
    icon: GraduationCap,
    kind: "agent",
    status: "live",
    tone: { tile: "bg-[#1B4FE5]", icon: "text-white" },
  },
  {
    id: "dati",
    label: "Dati",
    description: "Modifica diretta delle collection: bandi, eventi, prodotti, brand.",
    href: "/dati",
    icon: Database,
    kind: "tool",
    status: "live",
    tone: { tile: "bg-[#0E4F4E]", icon: "text-white" },
  },
  {
    id: "portals",
    label: "Portali scuole",
    description: "Storefront multi-tenant Saleor e configurazione dominio.",
    href: "/portals",
    icon: Store,
    kind: "agent",
    status: "coming-soon",
    tone: { tile: "bg-[#0E7490]", icon: "text-white" },
  },
  {
    id: "brain",
    label: "Brain",
    description: "Knowledge base persistente del RAG: carica una volta, riusa sempre.",
    href: "/brain",
    icon: Brain,
    kind: "tool",
    status: "coming-soon",
    tone: { tile: "bg-[#7C3AED]", icon: "text-white" },
  },
  {
    id: "log",
    label: "Log",
    description: "Audit append-only: chi ha fatto cosa, quando e su quale conversazione.",
    href: "/log",
    icon: ScrollText,
    kind: "tool",
    status: "coming-soon",
    tone: { tile: "bg-[#475569]", icon: "text-white" },
  },
  {
    id: "settings",
    label: "Impostazioni",
    description: "Provider AI, modelli, routing per gli agenti.",
    href: "/settings",
    icon: Settings,
    kind: "tool",
    status: "live",
    tone: {
      tile: "bg-[var(--color-paper-soft)] border border-[var(--color-line)]",
      icon: "text-[var(--color-ink)]",
    },
  },
];

export function findModuleByPath(pathname: string): ModuleDefinition | null {
  if (pathname === "/" || pathname === "") return null;
  return (
    MODULES.find(
      (m) => pathname === m.href || pathname.startsWith(m.href + "/"),
    ) ?? null
  );
}
