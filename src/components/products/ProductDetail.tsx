"use client";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { BadgePercent, ChevronLeft, Images, Info, Layers } from "lucide-react";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import type { Product } from "@/lib/products";
import { Pill } from "@/components/ui";
import { Section, SectionIcon, type Tone } from "@/components/orders/detail-section";
import { InfoRow } from "@/components/orders/drawer-primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { ProductThumbnail } from "@/components/catalogo/ProductThumbnail";
import { ProductDiscounts } from "./ProductDiscounts";
import {
  listPriceLabel,
  productSales,
  type ChannelNames,
  type SalesIndex,
} from "@/components/catalogo/catalog-view";
import { ProductVariants } from "./ProductVariants";
import { PRODUCT_TABS, type ProductTab } from "./products-filter";

const TAB_META: Record<
  ProductTab,
  { label: string; icon: ComponentType<{ size?: number }>; tone: Tone }
> = {
  informazioni: { label: "Informazioni", icon: Info, tone: "indigo" },
  sconti: { label: "Sconti e portali", icon: BadgePercent, tone: "amber" },
  varianti: { label: "Varianti", icon: Layers, tone: "violet" },
};

interface Props {
  product: Product;
  names: ChannelNames;
  sales: SalesIndex;
  /** Presente = scheda inline al centro: disegna la barra indietro e ascolta Esc. */
  onBack?: () => void;
  /** Tab attivo: vive nel workspace perche' lo cambia anche Teo dalla chat. */
  tab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  /** Apre il drawer del portale sopra la scheda. */
  onOpenPortal?: (slug: string) => void;
  /** Il prodotto e' cambiato (foto caricata): rileggi dal server. */
  onChanged?: () => void;
}

// Contenuto della scheda prodotto, senza guscio: al centro del pannello su
// desktop, dentro la bottom sheet su mobile. Come in Ordini: un drawer da
// destra coprirebbe la chat, e Teo deve vedere il prodotto mentre lo apre.
export function ProductDetail({
  product,
  names,
  sales,
  onBack,
  tab,
  onTabChange,
  onOpenPortal,
  onChanged,
}: Props) {
  // Esc chiude la scheda inline (con un Drawer lo faceva il core).
  useEffect(() => {
    if (!onBack) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const sold = productSales(product, sales);
  const published = product.channels.length;

  return (
    <Slide direction="right" offset={18} className="flex h-full min-h-0 flex-1 flex-col">
      {onBack && <BackBar product={product} onBack={onBack} />}

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as ProductTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 px-6 pt-4">
          <TabsList variant="line" className="h-auto w-full justify-start gap-1">
            {PRODUCT_TABS.map((k) => (
              <TabsTrigger key={k} value={k} className="flex-none gap-2 px-2.5 py-1.5">
                <SectionIcon icon={TAB_META[k].icon} tone={TAB_META[k].tone} size={24} />
                {TAB_META[k].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {/* Fuori dai tab: l'identita' del prodotto si deve vedere da qualunque
              sezione (come lo stato lavorazione nella scheda ordine). */}
          <div className="mb-6 flex items-center gap-3">
            <ProductThumbnail src={product.imageUrl} className="h-14 w-14 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate font-medium">{product.name}</p>
              <span className="mt-1 inline-flex flex-wrap items-center gap-1.5">
                <Pill size="sm" variant={published ? "tertiary" : "warning"}>
                  {published
                    ? `Pubblicato su ${published} portal${published === 1 ? "e" : "i"}`
                    : "Non pubblicato"}
                </Pill>
                <Pill size="sm" variant="neutral">
                  {sold} vendut{sold === 1 ? "o" : "i"}
                </Pill>
              </span>
            </div>
          </div>

          <TabsContent value="informazioni" className="flex flex-col gap-6">
            <Section title="Informazioni" icon={Info} tone="indigo">
              <InfoRow label="Categoria" value={product.category ?? "—"} />
              <InfoRow label="Tipo" value={product.productType} />
              <InfoRow label="Codice interno" value={product.slug} />
              <InfoRow label="Prezzo di riferimento" value={listPriceLabel(product)} />
              {product.description && (
                <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-ink-soft)]">
                  {product.description}
                </p>
              )}
            </Section>
            <Gallery product={product} onChanged={onChanged} />
          </TabsContent>

          <TabsContent value="sconti" className="flex flex-col gap-6">
            <ProductDiscounts
              product={product}
              names={names}
              sales={sales}
              onOpenPortal={onOpenPortal}
            />
          </TabsContent>

          <TabsContent value="varianti" className="flex flex-col gap-6">
            <ProductVariants product={product} names={names} sales={sales} />
          </TabsContent>
        </div>
      </Tabs>
    </Slide>
  );
}

// Le foto del prodotto. Se le varianti hanno le loro foto (un iPad ne ha 60,
// una per colore x taglio), qui la griglia sarebbe illeggibile: le foto giuste
// stanno accanto alla variante, nel tab Varianti.
function Gallery({
  product,
  onChanged,
}: {
  product: Product;
  onChanged?: () => void;
}) {
  // Su Saleor ogni prodotto ha almeno una variante: le punte Apple Pencil ne
  // hanno una sola, e la sua foto e' la foto del prodotto. Il rimando al tab
  // Varianti serve solo quando le varianti sono piu' di una.
  const perVariant =
    product.variants.length > 1 && product.variants.some((v) => v.images.length > 0);
  const photos = perVariant
    ? []
    : product.images.length
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  return (
    <Section title={perVariant ? "Foto" : `Foto (${photos.length})`} icon={Images} tone="sky">
      {perVariant ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          Le foto di questo prodotto sono legate alle varianti: le vedi nel tab Varianti.
        </p>
      ) : photos.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">Nessuna foto.</p>
      ) : (
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-10">
          {photos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="group">
              <ProductThumbnail src={url} className="aspect-square h-auto w-full rounded-lg" />
            </a>
          ))}
        </div>
      )}
      <AddPhoto product={product} onChanged={onChanged} />
    </Section>
  );
}

// Barra indietro della scheda inline: sostituisce la X del DrawerHeader.
function BackBar({ product, onBack }: { product: Product; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-line)] px-5 py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
      >
        <ChevronLeft size={16} />
        Prodotti
      </button>
      <span className="text-[var(--color-line-strong)]">/</span>
      <p className="min-w-0 truncate text-base font-semibold">{product.name}</p>
      <p className="shrink-0 text-xs text-[var(--color-ink-muted)]">
        {product.category ?? product.productType}
      </p>
    </div>
  );
}

// Caricamento foto prodotto (salvato dal vecchio ProductDrawer): l'unica
// scrittura che l'operatore fa dalla scheda, il resto passa da Teo.
function AddPhoto({
  product,
  onChanged,
}: {
  product: Product;
  onChanged?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/products/${product.slug}/media`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? `Errore ${res.status}`);
      return;
    }
    onChanged?.();
  }

  return (
    <div className="mt-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      <button
        type="button"
        className="text-xs underline text-[var(--color-ink-muted)]"
        onClick={() => fileRef.current?.click()}
      >
        Aggiungi foto
      </button>
      {error && <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{error}</p>}
    </div>
  );
}

interface DrawerProps extends Omit<Props, "onBack" | "product"> {
  product: Product | null;
  onClose: () => void;
}

// Guscio mobile della scheda prodotto: bottom sheet col contenuto di
// ProductDetail. Il Drawer del core porta animazione, Esc, scroll-lock e cache
// dei figli durante l'uscita, quindi qui non serve stato locale.
export function ProductDrawer({ product, onClose, ...rest }: DrawerProps) {
  return (
    <Drawer open={Boolean(product)} onClose={onClose} side="bottom">
      {product && (
        <>
          <DrawerHeader
            eyebrow="Prodotto"
            title={product.name}
            meta={product.category ?? product.productType}
            onClose={onClose}
            closeLabel="Chiudi"
          />
          <ProductDetail product={product} {...rest} />
        </>
      )}
    </Drawer>
  );
}
