// Helper sui componenti kit (jsonb Payload, forma canonica selection). Stanno
// qui e non nel drawer perche' li usano sia l'editor del pannello portali sia
// la vista read-only del drawer catalogo.
import type { BundleComponent, SaleorProduct } from "@/lib/gateway";

export function componentProductSlug(c: Record<string, unknown>): string {
  return typeof c.productSlug === "string" ? c.productSlug : "";
}

// Etichetta leggibile del componente: slug + taglio (by-attribute) o + SKU reale.
export function componentLabel(c: Record<string, unknown>): string {
  const slug = componentProductSlug(c);
  const sel = c.selection as Record<string, unknown> | undefined;
  if (sel && sel.kind === "by-attribute") {
    const vf = sel.valueFilter as Record<string, unknown> | undefined;
    const cap = vf && typeof vf.capacita === "string" ? vf.capacita : null;
    return cap ? `${slug} · ${cap}` : slug;
  }
  const sku =
    sel && typeof sel.variantSku === "string"
      ? sel.variantSku
      : typeof c.variantSku === "string"
        ? c.variantSku
        : null;
  return sku && sku !== slug ? `${slug} · ${sku}` : slug;
}

// Taglio del componente (capacita), quando la selection e' by-attribute.
export function componentCapacity(c: Record<string, unknown>): string | null {
  const sel = c.selection as Record<string, unknown> | undefined;
  const vf = sel?.valueFilter as Record<string, unknown> | undefined;
  return vf && typeof vf.capacita === "string" ? vf.capacita : null;
}

// Costruisce la selection canonica da una riga catalogo Saleor. Taglio (capacita)
// => by-attribute colore col taglio fissato (il cliente sceglie il colore al
// checkout). Prodotto single-variant => fixed sullo SKU reale. Multi-variante
// senza taglio => null (non aggiungibile dalla UI manuale: serve l'agente).
// Brain: gotcha-portal-kit-slug-mismatch — mai usare lo slug come variantSku.
export function buildComponent(row: SaleorProduct): BundleComponent | null {
  if (row.capacitySlug) {
    return {
      productSlug: row.slug,
      selection: {
        kind: "by-attribute",
        attribute: "colore",
        valueFilter: { capacita: row.capacitySlug },
      },
    };
  }
  if (row.variantSku) {
    return {
      productSlug: row.slug,
      selection: { kind: "variant", variantSku: row.variantSku },
    };
  }
  return null;
}
