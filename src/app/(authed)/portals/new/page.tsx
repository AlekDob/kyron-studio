import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { OnboardingChat } from "@/components/OnboardingChat";

export default async function NewPortalPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  return (
    <main className="min-h-screen px-8 py-12 max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-2">Studio / Portali</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Nuovo <span className="font-serif italic">portale</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          Rispondi alle domande dell&apos;assistente. A fine raccolta il portale
          viene salvato come descriptor e Alek lo rivedera&apos;.
        </p>
      </header>
      <OnboardingChat />
    </main>
  );
}
