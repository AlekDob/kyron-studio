import type { OrderRow } from "@/lib/gateway";
import { formatEur } from "./format";
import { ColorChangeNote } from "./ColorChangeNote";
import { ProductThumbnail } from "@/components/catalogo/ProductThumbnail";

// Righe prodotto di un ordine: cod SKU + descrizione x qty + prezzo.
// Brain: le mutation di editing riga Saleor operano SOLO su ordini UNCONFIRMED
// (money-path); su un ordine gia' confermato/evaso le modifiche si annotano per
// Danea (campo Note). L'editing reale (Parte C2) e' abilitato solo se editabile.
// I cambi colore concordati (annotazione, decision-019) restano visibili qui in
// sola lettura anche quando l'ordine e' spedito/chiuso.
export function OrderLines({ order }: { order: OrderRow }) {
  const lines = order.lines;
  if (lines.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">Nessun prodotto.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {lines.map((l, i) => {
        const change = order.colorChanges.find(
          (c) => (l.sku && c.sku === l.sku) || c.product === l.name,
        );
        return (
          <li key={`${l.sku}-${i}`} className="flex items-center gap-3">
            <ProductThumbnail src={l.imageUrl} className="h-10 w-10 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[var(--color-ink)]">
                {l.sku && (
                  <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                    {l.sku}{" "}
                  </span>
                )}
                <span className="font-medium">{l.name}</span>
                <span className="text-[var(--color-ink-muted)]"> × {l.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatEur(l.totalGross)}</span>
            </div>
            {change && <ColorChangeNote from={change.from} to={change.to} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
