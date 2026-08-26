// Navigazione dello Studio Kyron: e' la config del cliente, il tipo sta nel core.
import {
  Store,
  Settings,
  Database,
  Eye,
  ChartNoAxesColumn,
  ShoppingBag,
  ShieldCheck,
  FileCheck,
  LineChart,
  Bot,
  Package,
} from "lucide-react";
import type { ModuleDefinition } from "@studiofuturo/studio-core";

export type {
  ModuleDefinition,
  ModuleKind,
  ModuleStatus,
} from "@studiofuturo/studio-core";

/**
 * Un modulo Kyron. Gli agenti hanno un nome proprio: il core non lo conosce,
 * quindi il tipo si allarga qui e nessuna release del pacchetto serve.
 */
export type KyronModule = ModuleDefinition & {
  /** Nome proprio dell'agente ("Livia"). Seed dell'avatar blobatar. */
  agentName?: string;
  /** Sezione che presidia ("Portali"). Riga secondaria della AgentCard. */
  agentRole?: string;
};

export type KyronAgent = KyronModule & { agentName: string; agentRole: string };

// Label doppio "Livia · Portali": lo costruiamo qui una volta sola, cosi'
// palette e AgentCard (che leggono solo `label`) lo prendono gratis.
const agent = (
  name: string,
  role: string,
): Pick<KyronAgent, "label" | "agentName" | "agentRole"> => ({
  label: `${name} · ${role}`,
  agentName: name,
  agentRole: role,
});

/**
 * Gli agenti. NON stanno in `MODULES`: nella sidebar sono i canali `#` sotto
 * la voce "Agenti" (come in Studio GGS), non righe di primo livello.
 */
export const AGENTS: KyronAgent[] = [
  {
    id: "portals",
    ...agent("Livia", "Portali"),
    description: "Gestisce i portali scuola: onboarding, stato, catalogo prodotti.",
    href: "/portals",
    icon: Store,
    kind: "agent",
    status: "live",
  },
  {
    id: "checks",
    ...agent("Bruno", "Controlli"),
    description: "Controlla prezzi e sconti dei portali e ti spiega le anomalie.",
    href: "/checks",
    icon: ShieldCheck,
    kind: "agent",
    status: "live",
  },
  {
    id: "vat-relief",
    ...agent("Elsa", "Agevolazioni"),
    description: "Legge i documenti 104 e valida le richieste di IVA al 4%.",
    href: "/vat-relief",
    icon: FileCheck,
    kind: "agent",
    status: "live",
  },
  {
    id: "stats",
    ...agent("Ada", "Statistiche"),
    description:
      "Numeri del sito e dello shop, campagne Meta e come si parlano tra loro.",
    href: "/stats",
    icon: LineChart,
    kind: "agent",
    status: "live",
  },
  {
    id: "catalogo",
    ...agent("Nico", "Catalogo"),
    description: "Catalogo, giacenze e prezzi dello shop. Scrive su Saleor.",
    href: "/catalogo",
    icon: Package,
    kind: "agent",
    status: "live",
  },
  {
    id: "preview",
    ...agent("Vera", "Anteprima"),
    description: "Naviga kyronedu.it con te e propone le modifiche al sito.",
    href: "/preview",
    icon: Eye,
    kind: "agent",
    status: "live",
  },
];

export const MODULES: KyronModule[] = [
  {
    id: "agents",
    label: "Agenti",
    description: "Chi lavora con te nello Studio e di cosa si occupa.",
    href: "/agenti",
    icon: Bot,
    kind: "agent",
    status: "live",
    // Attivo solo su /agenti: i canali figli hanno il loro highlight.
    exact: true,
  },
  {
    id: "dati",
    label: "Dati",
    // Nico non e' un agente autonomo: e' la chat dentro uno strumento, quindi
    // sta in Strumenti. Il nome resta per la chat e l'avatar.
    agentName: "Nico",
    description: "Modifica le collection al posto tuo: bandi, eventi, prodotti, brand.",
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
    id: "analytics",
    label: "Analytics",
    description: "Visite, funnel e ricavi: sito, shop principale e portali scuola.",
    href: "/analytics",
    icon: ChartNoAxesColumn,
    kind: "tool",
    status: "live",
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

/**
 * Nome proprio dell'agente di un modulo. Unico punto da cui chat, avatar e
 * overlay mobile leggono il nome: prima era una stringa ripetuta a mano.
 */
export function agentNameOf(moduleId: string): string {
  const found =
    AGENTS.find((a) => a.id === moduleId) ?? MODULES.find((m) => m.id === moduleId);
  return found?.agentName ?? "Agente Studio";
}
