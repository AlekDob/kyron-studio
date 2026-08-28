"use client";
import { useRef, useState } from "react";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import { Section, InfoRow } from "@/components/orders/drawer-primitives";
import { Badge } from "@/components/ui";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { Product } from "@/lib/products";
import { ProductThumbnail } from "./ProductThumbnail";
import { PortalPrices } from "./PortalPrices";
import { productSales, type ChannelNames, type SalesIndex } from "./catalog-view";

// Drawer dettaglio prodotto: bottom sheet su mobile, da destra su desktop.
// Brain: gotcha-drawer-non-portalato-dietro-overlay — prima era un `fixed z-50`
// scritto a mano dentro la pagina e finiva DIETRO il pannello mobile
// dell'agente (z-60): il tap sulla riga sembrava non fare niente. Il Drawer di
// studio-core fa portal su body e cachea i figli durante l'uscita, quindi qui
// non serve piu' tenere una copia locale del prodotto.
export function ProductDrawer({
  product,
  onClose,
  names,
  sales,
  onOpenPortal,
  onChanged,
}: {
  product: Product | null;
  onClose: () => void;
  names: ChannelNames;
  sales: SalesIndex;
  onOpenPortal?: (slug: string) => void;
  onChanged?: () => void;
}) {
  const isMobile = useIsMobile();
  const sold = product ? productSales(product, sales) : 0;
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function addPhoto(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file || !product) return;
    setPhotoError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/products/${product.slug}/media`, { method: "POST", body: form });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setPhotoError(j.error ?? `Errore ${res.status}`);
      return;
    }
    onChanged?.();
  }

  return (
    <Drawer
      open={Boolean(product)}
      onClose={onClose}
      side={isMobile ? "bottom" : "right"}
      width={440}
    >
      {product && (
        <>
          <DrawerHeader
            eyebrow="Prodotto"
            title={product.name}
            icon={
              <ProductThumbnail
                src={product.imageUrl}
                className="h-9 w-9 rounded-lg"
              />
            }
            meta={
              <span className="inline-flex items-center gap-1.5">
                <Badge tone="accent">
                  {sold} vendut{sold === 1 ? "o" : "i"}
                </Badge>
                <span className="truncate">
                  {product.category ?? product.productType}
                </span>
              </span>
            }
            onClose={onClose}
            closeLabel="Chiudi"
          />

          {/* Sezioni separate da una linea, non solo da spazio: con blocchi
              diversi (info, portali) lo stacco deve essere leggibile. */}
          <div className="min-h-0 flex-1 divide-y divide-[var(--color-line)] overflow-y-auto overscroll-contain px-6">
            <div className="py-5">
              <Section title="Informazioni">
                <InfoRow label="Categoria" value={product.category ?? "—"} />
                <InfoRow label="Tipo" value={product.productType} />
                <InfoRow label="Codice interno" value={product.slug} />
              </Section>
              <div className="mt-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void addPhoto(e.target.files)}
                />
                <button
                  type="button"
                  className="text-xs underline text-[var(--color-ink-muted)]"
                  onClick={() => fileRef.current?.click()}
                >
                  Aggiungi foto
                </button>
                {photoError && (
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{photoError}</p>
                )}
              </div>
            </div>

            <div className="py-5">
              <Section title={`Portali (${product.channels.length})`}>
                <PortalPrices
                  product={product}
                  names={names}
                  sales={sales}
                  onOpenPortal={onOpenPortal}
                />
              </Section>
            </div>

            {/* Nessun bottone "chiedi": finche' il drawer e' aperto il prodotto
                viaggia da solo in coda al messaggio (selectionContext). */}
          </div>
        </>
      )}
    </Drawer>
  );
}
