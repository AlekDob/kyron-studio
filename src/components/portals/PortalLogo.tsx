"use client";

// Logo scuola nelle liste/card portali. I media Payload possono mancare o
// rispondere 404: fallback all'iniziale del nome (mai un'icona "immagine
// rotta" a vista). Riusabile ovunque serva il logo di un portale.
import { useState } from "react";
import { Store } from "lucide-react";
import { SectionIcon, type Tone } from "@/components/orders/detail-section";

interface Props {
  logoUrl: string | null;
  nome: string;
  /** Lato in px (default 32, lista compatta). */
  size?: number;
  /** Se il logo manca: pastiglia colorata invece dell'iniziale grigia. */
  tone?: Tone;
}

export function PortalLogo({ logoUrl, nome, size = 32, tone }: Props) {
  const [broken, setBroken] = useState(false);
  const initial = (nome.trim()[0] ?? "?").toUpperCase();
  const box = { width: size, height: size };

  if ((!logoUrl || broken) && tone) {
    return <SectionIcon icon={Store} tone={tone} size={size} />;
  }
  if (!logoUrl || broken) {
    return (
      <span
        style={box}
        aria-hidden
        className="flex shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] text-[11px] font-semibold text-[var(--color-ink-muted)]"
      >
        {initial}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- media Payload esterni, niente next/image
    <img
      src={logoUrl}
      alt={`Logo ${nome}`}
      style={box}
      onError={() => setBroken(true)}
      className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-white object-contain p-0.5"
    />
  );
}
