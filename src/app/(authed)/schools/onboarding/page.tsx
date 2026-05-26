import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { OnboardingChat } from "@/components/OnboardingChat";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  return (
    <main className="min-h-screen px-8 py-12 max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-2">Studio · Onboarding</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Nuova <span className="font-serif italic">scuola</span>
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-2 text-sm max-w-xl">
          Rispondi alle domande dell&apos;assistente. A fine raccolta la scuola
          viene salvata come PendingSchool in Payload e Alek la rivedera&apos;.
        </p>
      </header>
      <OnboardingChat />
    </main>
  );
}
