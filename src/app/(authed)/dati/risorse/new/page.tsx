import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { RisorsaForm } from "@/components/data/RisorsaForm";
import { EMPTY_RISORSA } from "@/lib/risorse";

export const dynamic = "force-dynamic";

export default async function NewRisorsaPage() {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-5">
        <p className="eyebrow mb-2">
          <Link href="/dati" className="hover:underline">
            Studio · Dati
          </Link>
          {" / "}
          <Link href="/dati/risorse" className="hover:underline">
            Risorse
          </Link>
        </p>
        <h1 className="text-3xl font-medium tracking-tight">Nuova risorsa</h1>
      </header>

      <RisorsaForm values={EMPTY_RISORSA} />
    </main>
  );
}
