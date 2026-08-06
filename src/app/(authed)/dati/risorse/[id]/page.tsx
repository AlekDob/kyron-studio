import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { getRecord, GatewayError } from "@/lib/gateway";
import { RisorsaForm } from "@/components/data/RisorsaForm";
import { DeleteRisorsaButton } from "@/components/data/DeleteRisorsaButton";
import { toRisorsaValues } from "@/lib/risorse";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRisorsaPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const { id } = await params;
  let doc;
  try {
    doc = await getRecord("risorse", id);
  } catch (err) {
    if (err instanceof GatewayError && err.status === 404) notFound();
    throw err;
  }
  const values = toRisorsaValues(doc);

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
        <h1 className="text-3xl font-medium tracking-tight">
          {values.titolo.it || `#${values.id}`}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          {values.pubblicata
            ? "Pubblicata: visibile su kyronedu.it/risorse."
            : "Bozza: non visibile sul sito."}
        </p>
      </header>

      <RisorsaForm values={values} />

      <div className="mt-12 border-t border-[var(--color-line)] pt-6">
        <DeleteRisorsaButton id={values.id} />
      </div>
    </main>
  );
}
