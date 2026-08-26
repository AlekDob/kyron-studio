import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { AgentChannel } from "@/components/chat/AgentChannel";
import { CHANNELS } from "@/components/chat/agent-channels";

export default async function StatsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  // Nessun pannello laterale: tabelle e grafici stanno nel canale.
  return <AgentChannel agentId="stats" {...CHANNELS.stats} />;
}
