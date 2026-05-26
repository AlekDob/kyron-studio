import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { fetchPendingSchools } from "@/lib/pending-schools";
import { QueueTable } from "@/components/QueueTable";

export default async function QueuePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  const items = await fetchPendingSchools();

  return (
    <main className="min-h-screen px-8 py-12 max-w-5xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-2">Studio · Coda</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Scuole <span className="font-serif italic">in attesa</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          PendingSchools raccolte dall&apos;agente. Approva o modifica via
          Payload admin.
        </p>
      </header>
      <QueueTable items={items} />
    </main>
  );
}
