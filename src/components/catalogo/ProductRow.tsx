"use client";
import type { Product } from "@/lib/products";

// Prezzo mostrato in lista: quello del main shop se c'e', altrimenti il primo
// canale con un prezzo. Il canale vero si legge nel drawer — qui serve solo un
// ordine di grandezza per riconoscere il prodotto.
function displayPrice(product: Product): string {
  const prices = product.variants.flatMap((v) =>
    v.channels.filter((c) => c.priceEur !== null),
  );
  const main = prices.find((c) => c.channelSlug === "default-channel") ?? prices[0];
  if (!main?.priceEur) return "senza prezzo";
  return main.priceEur.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function ProductRow({
  product,
  selected,
  onSelect,
}: {
  product: Product;
  selected: boolean;
  onSelect: (slug: string) => void;
}) {
  const stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  return (
    <button
      type="button"
      onClick={() => onSelect(product.slug)}
      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
        selected
          ? "border-[var(--color-ink)] bg-[var(--color-paper)]"
          : "border-[var(--color-line)] hover:bg-[var(--color-paper)]"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[var(--color-ink)] truncate">
          {product.name}
        </span>
        <span className="text-xs text-[var(--color-ink-muted)] shrink-0">
          {displayPrice(product)}
        </span>
      </div>
      <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 truncate">
        {product.variants.length} variant{product.variants.length !== 1 ? "i" : "e"}
        {" · "}
        {stock} in magazzino
        {product.channels.length === 0 && " · non pubblicato"}
      </p>
    </button>
  );
}
