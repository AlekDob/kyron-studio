"use client";
import { Popover } from "@/components/ui";
import { InfoRow } from "@/components/orders/drawer-primitives";
import type { ProductVariant } from "@/lib/products";
import type { SalesIndex } from "./catalog-view";

// Le varianti erano un blocco verticale a testa: su un MacBook con 12 tagli il
// drawer diventava una tabella infinita. Ora una riga di pallini: il colore si
// vede, il resto (codice, venduti, magazzino) sta nel popover.
// I nomi colore arrivano da Saleor come testo libero: mappa dei colori Apple
// che usiamo davvero, fallback grigio chiaro.
const SWATCH: Record<string, string> = {
  nero: "#1d1d1f",
  "grigio siderale": "#54545c",
  grigio: "#8e8e93",
  argento: "#e3e4e6",
  bianco: "#f5f5f7",
  oro: "#f4e0c8",
  rosa: "#f7cfd6",
  rosso: "#d32f2f",
  giallo: "#f6e27a",
  blu: "#2f5fa8",
  celeste: "#a7c7e7",
  verde: "#3f7f6a",
  viola: "#7b6ba8",
  lavanda: "#c7c0e0",
  titanio: "#c8c4bd",
  mezzanotte: "#2b3240",
  galassia: "#dcdcdc",
};

function colorOf(v: ProductVariant): { label: string; hex: string } {
  const raw = v.attributes.find((a) => /colore|color/i.test(a.name))?.value ?? "";
  const key = raw.trim().toLowerCase();
  return { label: raw || v.sku, hex: SWATCH[key] ?? "#d8d8dc" };
}

export function VariantDots({
  variants,
  sales,
}: {
  variants: ProductVariant[];
  sales: SalesIndex;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((v) => {
        const { label, hex } = colorOf(v);
        return (
          <Popover
            key={v.id}
            label={v.name || v.sku}
            trigger={
              <span
                title={v.name || v.sku}
                style={{ background: hex }}
                className="block h-7 w-7 rounded-full ring-1 ring-inset ring-black/10 transition-transform hover:scale-110"
              />
            }
          >
            <p className="mb-2 text-xs font-medium text-[var(--color-ink)]">
              {v.name || v.sku}
            </p>
            <div className="flex flex-col gap-1.5">
              <InfoRow label="Colore" value={label || "—"} />
              <InfoRow label="Codice" value={v.sku || "—"} />
              <InfoRow label="Venduti" value={`${sales[v.sku]?.total ?? 0}`} />
              <InfoRow label="Magazzino" value={`${v.stock}`} />
              {v.attributes
                .filter((a) => !/colore|color/i.test(a.name))
                .map((a) => (
                  <InfoRow key={a.name} label={a.name} value={a.value} />
                ))}
            </div>
          </Popover>
        );
      })}
    </div>
  );
}
