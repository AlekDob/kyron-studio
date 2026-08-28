"use client";
import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";

// Tinte delle sezioni della scheda ordine. Una tinta = un argomento: chi ha
// ordinato (indaco), i soldi (verde), la roba (ambra), quello che scriviamo
// (viola). Servono a far riconoscere la sezione prima di leggerla.
export const TONES = {
  indigo: "#5b67f0",
  emerald: "#0f9d6a",
  amber: "#d08700",
  violet: "#8b5cf6",
  slate: "#64748b",
} as const;

export type Tone = keyof typeof TONES;

interface IconProps {
  icon: ComponentType<{ size?: number }>;
  tone: Tone;
  size?: number;
}

// Pastiglia di vetro colorata: sfondo alla tinta con alfa basso, filo interno
// piu' saturo, blur. `color-mix` invece di 5 variabili per tinta.
export function SectionIcon({ icon: Icon, tone, size = 28 }: IconProps) {
  const c = TONES[tone];
  return (
    <motion.span
      aria-hidden
      whileHover={{ scale: 1.08, rotate: -4 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      style={{
        width: size,
        height: size,
        color: c,
        background: `color-mix(in srgb, ${c} 12%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 22%, transparent)`,
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-[10px] backdrop-blur-md"
    >
      <Icon size={Math.round(size * 0.54)} />
    </motion.span>
  );
}

// Sezione della scheda: card shadcn con la pastiglia colorata in testata.
export function Section({
  title,
  icon,
  tone,
  action,
  children,
}: {
  title: string;
  children: ReactNode;
  /** Contenuto allineato a destra nella testata (es. badge di stato). */
  action?: ReactNode;
} & Omit<IconProps, "size">) {
  return (
    <Card className="gap-3 border-border py-4 shadow-none">
      <CardHeader className="flex flex-row items-center gap-2.5 px-4">
        <SectionIcon icon={icon} tone={tone} size={26} />
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </CardTitle>
        {action && <span className="ml-auto flex items-center gap-2">{action}</span>}
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-4">{children}</CardContent>
    </Card>
  );
}
