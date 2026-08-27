"use client";
// Source: global-games studio src/components/dashboard/GradientTile.tsx —
// stessi toni e stesso tilt, senza il font a puntini (Kyron non lo carica).
import { motion } from "framer-motion";
import { useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { usePointer } from "@/components/ui";
import { cn } from "@/lib/cn";

// I gradienti stanno qui e solo qui: le tile si scelgono per nome, non per hex.
// Macchie radiali fuori centro su base chiarissima, cosi' il colore e' denso al
// centro e si spegne verso i bordi invece di essere un blocco pieno.
const GRADIENTS = {
  indaco: `radial-gradient(120% 90% at 18% 12%, #c6ccfb 0%, transparent 62%),
    radial-gradient(110% 100% at 88% 78%, #aeb6f8 0%, transparent 58%),
    radial-gradient(90% 80% at 60% 40%, #dfe2fd 0%, transparent 70%), #f5f6fe`,
  menta: `radial-gradient(120% 90% at 18% 12%, #b7e8cd 0%, transparent 62%),
    radial-gradient(110% 100% at 88% 78%, #9fdcc0 0%, transparent 58%),
    radial-gradient(90% 80% at 60% 40%, #d9f2e4 0%, transparent 70%), #f4faf6`,
  ambra: `radial-gradient(120% 90% at 18% 12%, #fbdcb0 0%, transparent 62%),
    radial-gradient(110% 100% at 88% 78%, #f6c88f 0%, transparent 58%),
    radial-gradient(90% 80% at 60% 40%, #fdeacf 0%, transparent 70%), #fdf6ec`,
  rosa: `radial-gradient(120% 90% at 18% 12%, #f8ccd7 0%, transparent 62%),
    radial-gradient(110% 100% at 88% 78%, #f3aec2 0%, transparent 58%),
    radial-gradient(90% 80% at 60% 40%, #fbe0e6 0%, transparent 70%), #fdf1f4`,
} as const;

export type TileTone = keyof typeof GRADIENTS;

/** Posto della tile nel mosaico: min-w-0 o la marquee sotto allarga la colonna. */
export const TILE_CLASS = "min-w-0 lg:col-span-3";

export function StatTile({
  tone,
  label,
  value,
  caption,
  footer,
  className,
  index = 0,
}: {
  tone: TileTone;
  label: string;
  /** Numero gia' formattato. "—" quando la fonte non risponde. */
  value: string;
  caption?: string;
  /** Pastiglia opzionale in fondo alla tile. */
  footer?: ReactNode;
  className?: string;
  /** Ritardo a scalare dell'entrata. */
  index?: number;
}) {
  const { x, y, onPointerMove, onPointerLeave } = usePointer();
  const rotateY = useTransform(x, [-0.5, 0.5], [-9, 9]);
  const rotateX = useTransform(y, [-0.5, 0.5], [7, -7]);

  return (
    <motion.div
      className={cn(className)}
      style={{ perspective: 900 }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div
        className="relative flex min-h-[176px] flex-col justify-between overflow-hidden rounded-3xl p-5"
        style={{
          background: GRADIENTS[tone],
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mono-caps text-[var(--color-ink-soft)] opacity-80">{label}</p>
        {/* translateZ: senza rilievo il tilt non si legge */}
        <div style={{ transform: "translateZ(24px)" }}>
          <p className="text-[34px] font-semibold leading-none tracking-tight text-[var(--color-ink)]">
            {value}
          </p>
          {caption && (
            <p className="mt-1.5 text-xs text-[var(--color-ink-soft)] opacity-90">
              {caption}
            </p>
          )}
        </div>
        {footer}
      </motion.div>
    </motion.div>
  );
}

/** Pastiglia bianca sopra il gradiente. */
export function TilePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-soft)] backdrop-blur">
      {children}
    </span>
  );
}

/** Placeholder della tile mentre il fetch e' in volo (fallback di Suspense). */
export function StatTileSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-h-[176px] animate-pulse rounded-3xl bg-[var(--studio-active-surface)]",
        className,
      )}
      aria-hidden="true"
    />
  );
}
