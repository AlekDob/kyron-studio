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
  ShieldCheck,
  FileCheck,
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
  },
  {
    id: "portals",
    label: "Portali",
    description: "Gestisci i portali scuola: onboarding, stato, catalogo prodotti.",
    href: "/portals",
    icon: Store,
    kind: "agent",
    status: "live",
  },
  {
    id: "dati",
    label: "Dati",
    description: "Modifica diretta delle collection: bandi, eventi, prodotti, brand.",
    href: "/dati",
    icon: Database,
    kind: "tool",
    status: "live",
  },
  {
    id: "orders",
    label: "Ordini",
    description: "Tutti gli ordini dei portali: filtra per scuola e data, vedi agente e stato.",
    href: "/orders",
    icon: ShoppingBag,
    kind: "tool",
    status: "live",
  },
  {
    id: "checks",
    label: "Controlli",
    description: "Controlla prezzi e sconti dei portali: chiedi una verifica, ricevi le anomalie.",
    href: "/checks",
    icon: ShieldCheck,
    kind: "agent",
    status: "live",
  },
  {
    id: "vat-relief",
    label: "Agevolazioni",
    description: "Controlla i documenti 104 e valida le richieste di IVA al 4%.",
    href: "/vat-relief",
    icon: FileCheck,
    kind: "agent",
    status: "live",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Visite, funnel e ricavi: sito, shop principale e portali scuola.",
    href: "/analytics",
    icon: ChartNoAxesColumn,
    kind: "tool",
    status: "live",
  },
  {
    id: "preview",
    label: "Anteprima",
    description: "Naviga il sito kyronedu.it e proponi modifiche con l'agente Review Editor.",
    href: "/preview",
    icon: Eye,
    kind: "agent",
    status: "live",
  },
  {
    id: "brain",
    label: "Brain",
    description: "Knowledge base persistente del RAG: carica una volta, riusa sempre.",
    href: "/brain",
    icon: Brain,
    kind: "tool",
    status: "coming-soon",
  },
  {
    id: "log",
    label: "Log",
    description: "Audit append-only: chi ha fatto cosa, quando e su quale conversazione.",
    href: "/log",
    icon: ScrollText,
    kind: "tool",
    status: "coming-soon",
  },
  {
    id: "settings",
    label: "Impostazioni",
    description: "Provider AI, modelli, routing per gli agenti.",
    href: "/settings",
    icon: Settings,
    kind: "tool",
    status: "live",
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
