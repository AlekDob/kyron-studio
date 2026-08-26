// Directory degli agenti: le card leggono il registry, non una lista a parte.
// L'avatar e' lo slot della AgentCard del core: ci mettiamo la faccia con lo
// sguardo che segue il mouse, la stessa che compare nel canale dell'agente
// (stesso seed = stessa faccia: l'id del modulo, non il nome).
import Link from "next/link";
import { AgentCard } from "@/components/ui";
import { AgentFace } from "@/components/chat/AgentFace";
import { AGENTS } from "@/components/shell/modules";

export function AgentsGrid({ fill = false }: { fill?: boolean }) {
  return (
    <div
      className={
        fill
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
          : "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(220px,260px))]"
      }
    >
      {AGENTS.map((a) => (
        <Link key={a.id} href={a.href} className="block text-left">
          <AgentCard
            name={a.agentName}
            meta={a.agentRole}
            description={a.description}
            avatar={
              <AgentFace
                seed={a.id}
                label={a.agentName}
                size={88}
                className="rounded-full border-[3px] border-white shadow-md"
              />
            }
          />
        </Link>
      ))}
    </div>
  );
}
