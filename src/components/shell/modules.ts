import {
  Inbox,
  Store,
  Brain,
  ScrollText,
  Settings,
  Database,
  Eye,
  ChartNoAxesColumn,
  ShoppingBag,
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
    id: "portals",
    label: "Portali",
    description: "Gestisci i portali scuola: onboarding, stato, catalogo prodotti.",
    href: "/portals",
    icon: Store,
    kind: "agent",
    status: "live",
    tone: { tile: "bg-[#0E7490]", icon: "text-white" },
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
    id: "orders",
    label: "Ordini",
    description: "Tutti gli ordini dei portali: filtra per scuola e data, vedi agente e stato.",
    href: "/orders",
    icon: ShoppingBag,
    kind: "tool",
    status: "live",
    tone: { tile: "bg-[#B45309]", icon: "text-white" },
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Visite, funnel e ricavi: sito, shop principale e portali scuola.",
    href: "/analytics",
    icon: ChartNoAxesColumn,
    kind: "tool",
    status: "live",
    tone: { tile: "bg-[#1B4FE5]", icon: "text-white" },
  },
  {
    id: "preview",
    label: "Anteprima",
    description: "Naviga il sito kyronedu.it e proponi modifiche con l'agente Review Editor.",
    href: "/preview",
    icon: Eye,
    kind: "agent",
    status: "live",
    tone: { tile: "bg-[#9333EA]", icon: "text-white" },
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
