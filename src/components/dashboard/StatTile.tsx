"use client";
// Source: global-games studio src/components/dashboard/GradientTile.tsx —
// stessi toni e stesso tilt, senza il font a puntini (Kyron non lo carica).
import { motion } from "framer-motion";
import { useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { usePointer } from "@/components/ui";
import { cn } from "@/lib/cn";

// I gradienti vivono in globals.css come variabili --tile-{tone}: la tile si
// sceglie per nome e il dark mode li ribalta senza toccare questo file
// (feature 020).
const TONES = ["indaco", "menta", "ambra", "rosa"] as const;

export type TileTone = (typeof TONES)[number];

/** Posto della tile nel mosaico: min-w-0 o la marquee sotto allarga la colonna.
 *  Le colonne le decide TileRail, qui non serve piu' un col-span. */
export const TILE_CLASS = "min-w-0";

export function StatTile({
  tone,
  label,
  value,
  caption,
  footer,
  className,
  index = 0,
  size = "md",
  active,
  onClick,
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
  /** "sm" per i pannelli a mezzo schermo: stessa tile, meno altezza. */
  size?: "md" | "sm";
  /** Solo con onClick: la tile e' un filtro acceso. */
  active?: boolean;
  onClick?: () => void;
}) {
  const { x, y, onPointerMove, onPointerLeave } = usePointer();
  const rotateY = useTransform(x, [-0.5, 0.5], [-9, 9]);
  const rotateX = useTransform(y, [-0.5, 0.5], [7, -7]);

  const sm = size === "sm";

  // Con onClick la tile e' un bottone vero (tastiera + aria-pressed): il
  // gradiente ci sta dentro, il tilt resta sul wrapper esterno.
  const Body = onClick ? "button" : "div";

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
      <Body
        type={onClick ? "button" : undefined}
        onClick={onClick}
        aria-pressed={onClick ? active : undefined}
        className="block w-full text-left"
      >
      <motion.div
        className={cn(
          // @container: il valore sotto si misura sulla larghezza della tile.
          "@container relative flex flex-col justify-between overflow-hidden rounded-3xl p-5",
          sm ? "min-h-[120px]" : "min-h-[176px]",
          // Anello quando la tile e' il filtro attivo: dentro il gradiente,
          // cosi' non litiga col tilt del wrapper.
          active && "ring-2 ring-inset ring-[var(--color-accent)]",
        )}
        style={{
          background: `var(--tile-${tone})`,
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
          <p
            className={cn(
              "font-semibold leading-none tracking-tight text-[var(--color-ink)]",
              // Fluido: un totale lungo (279.099,32 €) in una tile stretta
              // rimpicciolisce invece di finire tagliato dall'overflow.
              sm ? "text-[clamp(18px,11cqw,26px)]" : "text-[clamp(24px,12cqw,34px)]",
            )}
          >
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
      </Body>
    </motion.div>
  );
}

/** Pastiglia sopra il gradiente: paper velato, cosi' funziona anche su tile scura. */
export function TilePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-paper)]/70 px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-soft)] backdrop-blur">
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
