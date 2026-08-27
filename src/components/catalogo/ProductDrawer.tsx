"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Section, InfoRow } from "@/components/orders/drawer-primitives";
import { Badge } from "@/components/ui";
import type { Product } from "@/lib/products";
import { ProductThumbnail } from "./ProductThumbnail";
import { PortalPrices } from "./PortalPrices";
import { productSales, type ChannelNames, type SalesIndex } from "./catalog-view";

// Drawer dettaglio prodotto. Stessa meccanica di OrderDrawer: bottom sheet su
// mobile, scivola da destra su desktop (il translateX desktop non e' esprimibile
// inline, va iniettato in una media query).
export function ProductDrawer({
  product,
  onClose,
  names,
  sales,
}: {
  product: Product | null;
  onClose: () => void;
  names: ChannelNames;
  sales: SalesIndex;
}) {
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState<Product | null>(null);

  useEffect(() => {
    if (product) {
      setCurrent(product);
      setRender(true);
      return;
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 320);
    return () => clearTimeout(t);
  }, [product]);

  useEffect(() => {
    if (!render) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShow(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [render]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (render) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [render, onClose]);

  if (!render || !current) return null;

  return (
    <div
      aria-hidden={!show}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: show ? "auto" : "none" }}
    >
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: show ? 1 : 0 }}
      />
      <aside
        role="dialog"
        aria-label={current.name}
        className="absolute flex flex-col bg-[var(--color-paper)] shadow-2xl
                   inset-x-0 bottom-0 rounded-t-2xl
                   max-h-[calc(100dvh-env(safe-area-inset-top)-3rem)]
                   lg:inset-y-4 lg:right-4 lg:left-auto lg:inset-x-auto
                   lg:w-[440px] lg:max-h-none lg:rounded-2xl
                   lg:border lg:border-[var(--color-line)]"
        style={{
          transform: show ? "translateY(0)" : "translateY(100%)",
          transition: "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        data-product-drawer
      >
        <style>{`
          @media (min-width: 1024px) {
            [data-product-drawer] {
              transform: ${show ? "translateX(0)" : "translateX(100%)"} !important;
            }
          }
        `}</style>
        <header className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-[var(--color-line)]">
          <div className="flex min-w-0 gap-3">
            <ProductThumbnail
              src={current.imageUrl}
              className="h-14 w-14 rounded-xl"
            />
            <div className="min-w-0">
              <p className="eyebrow">Prodotto</p>
              <h2 className="text-base font-medium text-[var(--color-ink)] mt-0.5">
                {current.name}
              </h2>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge tone="accent">
                  {productSales(current, sales)} vendut
                  {productSales(current, sales) === 1 ? "o" : "i"}
                </Badge>
                <span className="truncate text-xs text-[var(--color-ink-muted)]">
                  {current.category ?? current.productType}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="shrink-0 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Sezioni separate da una linea, non solo da spazio: con tre blocchi
            diversi (info, portali, varianti) lo stacco deve essere leggibile. */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 divide-y divide-[var(--color-line)]">
          <div className="py-5">
            <Section title="Informazioni">
              <InfoRow label="Categoria" value={current.category ?? "—"} />
              <InfoRow label="Tipo" value={current.productType} />
              <InfoRow label="Codice interno" value={current.slug} />
            </Section>
          </div>

          <div className="py-5">
            <Section title={`Portali (${current.channels.length})`}>
              <PortalPrices product={current} names={names} sales={sales} />
            </Section>
          </div>

          {/* Nessun bottone "chiedi": finche' il drawer e' aperto il prodotto
              viaggia da solo in coda al messaggio (selectionContext). */}
        </div>
      </aside>
    </div>
  );
}
