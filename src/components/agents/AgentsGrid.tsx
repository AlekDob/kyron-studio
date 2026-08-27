// Directory degli agenti: le card leggono il registry, non una lista a parte.
// L'avatar e' lo slot della AgentCard del core: ci mettiamo la faccia, la stessa
// che compare in testata al canale dell'agente (stesso seed = stessa faccia:
// l'id del modulo, non il nome).
//
// `gaze` (occhi che seguono il mouse) solo nella griglia di /agenti. Nella riga
// della dashboard no: la riga stampa gli agenti DUE volte e scorre a 60fps, con
// gli occhi vivi erano 22 SVG animati che si ridisegnano sopra la lastra di
// vetro (backdrop-filter) a ogni frame. Le facce ferme sono <img>.
import Link from "next/link";
import { AgentCard } from "@/components/ui";
import { AgentFace } from "@/components/chat/AgentFace";
import { AGENTS } from "@/components/shell/modules";
import { AgentsMarquee } from "./AgentsMarquee";

function AgentTile({
  id,
  href,
  agentName,
  agentRole,
  description,
  gaze = false,
}: (typeof AGENTS)[number] & { gaze?: boolean }) {
  return (
    <Link href={href} className="block text-left">
      <AgentCard
        name={agentName}
        meta={agentRole}
        description={description}
        avatar={
          <AgentFace
            seed={id}
            label={agentName}
            size={88}
            gaze={gaze}
            className="rounded-full border-[3px] border-white shadow-md"
          />
        }
      />
    </Link>
  );
}

/**
 * `fill` = versione dashboard: una riga sola che scorre da sola e riparte dal
 * primo agente. `fill` off = directory completa a griglia (/agenti).
 */
export function AgentsGrid({ fill = false }: { fill?: boolean }) {
  if (fill) {
    return (
      <AgentsMarquee>
        {AGENTS.map((a) => (
          <div key={a.id} className="w-[232px] shrink-0 pr-3">
            <AgentTile {...a} />
          </div>
        ))}
      </AgentsMarquee>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(220px,260px))]">
      {AGENTS.map((a) => (
        <AgentTile key={a.id} {...a} gaze />
      ))}
    </div>
  );
}
