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
      className={`relative shrink-0 overflow-hidden rounded-lg p-1 ring-1 ring-[var(--color-line)] ${
        hero ? "bg-white" : "border border-dashed border-[var(--color-line)] bg-white/50"
      } ${className}`}
    >
      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt=""
          loading="lazy"
          className={`absolute inset-1 right-auto h-[calc(100%-0.5rem)] object-contain ${
            heroFull ? "w-[calc(100%-0.5rem)]" : "w-[56%]"
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
          className={`absolute right-1 w-[40%] object-contain ${
            side.length === 1
              ? "top-1 h-[calc(100%-0.5rem)]"
              : i === 0
                ? "top-1 h-[calc(50%-0.25rem)]"
                : "bottom-1 h-[calc(50%-0.25rem)]"
          }`}
        />
      ))}
    </div>
  );
}
