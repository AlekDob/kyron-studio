"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// Menu di sezione: chip scrollabili orizzontali (mobile-first) che saltano
// alle ancore della pagina Analytics. Sticky sotto il filtro, evidenzia la
// sezione visibile via IntersectionObserver.

export const SECTIONS = [
  { id: "kpi", label: "KPI" },
  { id: "andamento", label: "Andamento" },
  { id: "citta", label: "Citta'" },
  { id: "fonti", label: "Fonti" },
  { id: "pagine", label: "Pagine" },
  { id: "device", label: "Device" },
  { id: "origini", label: "Origini" },
] as const;

export function SectionNav() {
  const [active, setActive] = useState<string>("kpi");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Sezioni"
      className="sticky top-0 z-20 -mx-5 flex gap-2 overflow-x-auto bg-[var(--color-paper)]/90 px-5 py-2 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0"
    >
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => go(s.id)}
          className={cn(
            "shrink-0 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors",
            active === s.id
              ? "bg-[var(--color-action-subtle)] text-[var(--color-ink)]"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
          )}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
