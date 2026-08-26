// Testata del canale: la faccia dell'agente, "#nome" e l'etichetta "agent".
// Sta in un file suo perche' la usa anche la chat dell'Anteprima, che ha il suo
// loop di messaggi (proposte di annotazione) e non passa da AgentChannel.
import type { ReactElement } from "react";
import { AgentFace } from "@/components/chat/AgentFace";

export function ChannelHeader({
  agentId,
  name,
}: {
  agentId: string;
  name: string;
}): ReactElement {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-[var(--color-line)] px-4 sm:px-5">
      <AgentFace seed={agentId} label={name} size={28} gaze />
      <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
        <span className="font-normal text-[var(--color-ink-muted)]">#</span>
        {name.toLowerCase()}
      </h2>
      <span className="text-xs text-[var(--color-ink-muted)]">agent</span>
    </div>
  );
}
