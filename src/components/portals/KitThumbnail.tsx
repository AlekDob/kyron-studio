// Cover del kit come nello storefront (BundleHeroCollage): device hero grande a
// sinistra, accessori piccoli a destra, sfondo chiaro. Qui in miniatura, quindi
// al massimo due accessori: di piu' a 36px diventa poltiglia.
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

  return (
    <div
      className={`flex shrink-0 items-center gap-[6%] overflow-hidden rounded-lg bg-[var(--color-paper-muted)] p-[6%] ${className}`}
    >
      <div className="flex h-full basis-[58%] items-center justify-center">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="max-h-full max-w-full object-contain" />
        ) : null}
      </div>
      <div className="flex h-full flex-1 flex-col justify-center gap-[6%]">
        {side.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" className="max-h-full w-full object-contain" />
        ))}
      </div>
    </div>
  );
}
