"use client";
import { ImageOff } from "lucide-react";

// Cover del kit come nello storefront (BundleHeroCollage): device hero grande a
// sinistra, accessori piccoli a destra. Qui in miniatura, quindi max due
// accessori: di piu' a 36px diventa poltiglia.
// Posizionamento absolute e non flex: in un box da 36px un flex item con
// max-h-full/max-w-full collassa a 0x0 (verificato in browser).
export function KitThumbnail({
  hero,
  accessories,
  className = "h-9 w-9",
}: {
  hero: string | null;
  accessories: string[];
  className?: string;
}) {
  const side = accessories.slice(0, 2);
  const heroFull = side.length === 0;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg ring-1 ring-[var(--color-line)] ${
        hero ? "bg-white" : "border border-dashed border-[var(--color-line)] bg-white/50"
      } ${className}`}
    >
      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt=""
          loading="lazy"
          className={`absolute left-0 top-0 h-full object-contain p-px ${
            heroFull ? "w-full" : "w-[58%]"
          }`}
        />
      ) : (
        <ImageOff
          aria-hidden
          className="absolute inset-0 m-auto h-4 w-4 text-[var(--color-ink-muted)] opacity-60"
        />
      )}
      {side.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={url}
          alt=""
          loading="lazy"
          className={`absolute right-0 w-[42%] object-contain p-px ${
            side.length === 1 ? "top-0 h-full" : i === 0 ? "top-0 h-1/2" : "bottom-0 h-1/2"
          }`}
        />
      ))}
    </div>
  );
}
