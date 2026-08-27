"use client";
import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

// Anteprima prodotto: la thumbnail Saleor su fondo bianco (le foto prodotto
// sono scontornate su bianco, il grigio le spegne). Se manca o non carica
// resta un riquadro tratteggiato, non un buco nel layout.
export function ProductThumbnail({
  src,
  className = "h-11 w-11 rounded-xl",
}: {
  src: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const show = Boolean(src) && !failed;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ring-1 ring-[var(--color-line)] ${
        show ? "bg-white" : "border border-dashed border-[var(--color-line)] bg-white/50"
      } ${className}`}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <ImageOff
          aria-hidden
          className="absolute inset-0 m-auto h-4 w-4 text-[var(--color-ink-muted)] opacity-60"
        />
      )}
    </div>
  );
}
