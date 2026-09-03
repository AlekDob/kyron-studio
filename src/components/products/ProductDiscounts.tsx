"use client";
import { useEffect, useState } from "react";
import { BadgePercent } from "lucide-react";
import type { PortalDiscount, Product } from "@/lib/products";
import { SkeletonRows } from "@/components/ui";
import { Section } from "@/components/orders/detail-section";
import { PortalPrices } from "@/components/catalogo/PortalPrices";
import type { ChannelNames, SalesIndex } from "@/components/catalogo/catalog-view";

// Sconti e portali in una lista sola. Serve perche' il prezzo sul channel
// listing e' il listino: l'iPad fa 509 EUR su tutti i 42 portali, mentre la
// scuola paga 469. Lo sconto vero sta nelle promotion Saleor, e lo chiediamo al
// volo quando l'operatore apre il tab (una query per prodotto, non per pagina).
export function ProductDiscounts({
  product,
  names,
  sales,
  onOpenPortal,
}: {
  product: Product;
  names: ChannelNames;
  sales: SalesIndex;
  onOpenPortal?: (slug: string) => void;
}) {
  const [rows, setRows] = useState<PortalDiscount[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setFailed(false);
    fetch(`/api/products/${product.slug}/discounts`)
      .then((r) => r.json() as Promise<{ portals?: PortalDiscount[] }>)
      .then((j) => alive && (j.portals ? setRows(j.portals) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [product.slug]);

  const discounted = (rows ?? []).filter((r) => r.maxDiscountEur > 0);
  const bySlug = Object.fromEntries((rows ?? []).map((r) => [r.channelSlug, r]));
  const published = product.channels.length;

  return (
    <Section title={`Sconti e portali (${published})`} icon={BadgePercent} tone="amber">
      {/* Lo skeleton copre solo la colonna sconti: la lista portali e i prezzi
          ci sono gia', non li facciamo aspettare la query delle promotion. */}
      {rows === null && !failed && (
        <SkeletonRows rows={2} rowClassName="h-[18px]" label="Carico gli sconti" />
      )}
      {failed && (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Non riesco a leggere gli sconti adesso: i prezzi qui sotto sono di listino.
        </p>
      )}
      {rows !== null && (
        <p className="text-sm text-[var(--color-ink-muted)]">
          {discounted.length === 0
            ? "Nessuno sconto: su tutti i portali si paga il listino."
            : `${discounted.length} portali su ${rows.length} hanno uno sconto.`}
        </p>
      )}
      <PortalPrices
        product={product}
        names={names}
        sales={sales}
        onOpenPortal={onOpenPortal}
        discounts={bySlug}
      />
    </Section>
  );
}
