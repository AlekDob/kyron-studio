// Directory degli agenti: le card leggono il registry, non una lista a parte.
// L'avatar e' lo slot della AgentCard del core: ci mettiamo la faccia con gli
// occhi che seguono il mouse (`gaze`), la stessa che compare in testata al
// canale dell'agente (stesso seed = stessa faccia: l'id del modulo, non il nome).
import Link from "next/link";
import { AgentCard } from "@/components/ui";
import { AgentFace } from "@/components/chat/AgentFace";
import { AGENTS } from "@/components/shell/modules";
import { AgentsMarquee } from "./AgentsMarquee";

function AgentTile({ id, href, agentName, agentRole, description }: (typeof AGENTS)[number]) {
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
            gaze
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
        <AgentTile key={a.id} {...a} />
      ))}
    </div>
  );
}
