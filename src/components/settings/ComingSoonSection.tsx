"use client";
import { Pill } from "@/components/ui";

interface Props {
  title: string;
  italicSuffix?: string;
  description: string;
}

export function ComingSoonSection({ title, italicSuffix, description }: Props) {
  return (
    <section className="space-y-8">
      <header>
        <p className="eyebrow mb-3 flex items-center gap-2">
          <span>{title}</span>
          <Pill variant="neutral" size="sm">presto</Pill>
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">
          {title}
          {italicSuffix && (
            <>
              {" "}
              <span className="text-[var(--color-ink-muted)]">{italicSuffix}</span>
            </>
          )}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-ink-muted)]">
          {description}
        </p>
      </header>

      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-12 text-center">
        <p className="text-sm text-[var(--color-ink-muted)]">
          In arrivo nella prossima fase.
        </p>
      </div>
    </section>
  );
}
