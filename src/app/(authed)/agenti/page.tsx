import { PageHeader } from "@/components/ui";
import { AgentsGrid } from "@/components/agents/AgentsGrid";

export const metadata = { title: "Agenti — Studio" };

export default function AgentsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-14 xl:px-12">
        <PageHeader
          eyebrow="Kyron"
          title="Agenti"
          description="Chi lavora con te nello Studio e di cosa si occupa."
        />
        <div className="mt-8">
          <AgentsGrid />
        </div>
      </div>
    </div>
  );
}
