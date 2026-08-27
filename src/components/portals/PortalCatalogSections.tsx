"use client";
import { useCallback, useState } from "react";
import { Plus, X } from "lucide-react";
import { Section, InfoRow } from "@/components/orders/drawer-primitives";
import { Badge, Popover } from "@/components/ui";
import { formatDiscount } from "@/components/chat/generative/ProductPickerRow";
import { ProductThumbnail } from "@/components/catalogo/ProductThumbnail";
import { VariantPricesPopover } from "@/components/catalogo/VariantPricesPopover";
import { eur, portalRows, variantPricesOn, type SalesIndex } from "@/components/catalogo/catalog-view";
import { useCatalogIndex } from "@/components/catalogo/use-catalog-index";
import type { Product } from "@/lib/products";
import type { PortalDetail, SaleorProduct } from "@/lib/gateway";
import { componentLabel, componentProductSlug } from "./bundle-components";

// Cosa vende questo portale, con la UI del catalogo: thumbnail, nome vero,
// prezzo su QUESTO canale e pezzi venduti. Prima erano chip con lo slug nudo
// ("applecare-plus-ipad-a16") e una sezione sconti a parte: nessuno capiva ne'
// che prodotto fosse ne' quanto costasse. Un solo componente per i due host —
// pannello portali (editabile) e drawer del catalogo (read-only).
type Discount = NonNullable<PortalDetail["catalog"]["productDiscounts"]>[number];

export function PortalCatalogSections({
  portal,
  onSaveCatalog,
}: {
  portal: PortalDetail;
  /** presente = catalogo modificabile (X + Aggiungi). Assente = sola lettura. */
  onSaveCatalog?: (visibleSlugs: string[]) => Promise<void>;
}) {
  const { bySlug, sales, loading } = useCatalogIndex();
  const slugs = portal.catalog.visibleSlugs;
  const discounts = new Map<string, Discount>(
    (portal.catalog.productDiscounts ?? []).map((d) => [d.slug, d]),
  );
  const cuts = new Map<string, string[]>();
  for (const v of portal.catalog.visibleVariants ?? []) {
    cuts.set(v.productSlug, [...(cuts.get(v.productSlug) ?? []), v.value]);
  }

  return (
    <>
      <div className="py-5">
        <Section title={`Prodotti (${slugs.length + (portal.catalog.visibleVariants?.length ?? 0)})`}>
          {slugs.length === 0 && (
            <p className="text-sm text-[var(--color-ink-muted)]">
              Nessun prodotto nel catalogo.
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {slugs.map((slug, i) => (
              <PortalProductRow
                key={slug}
                index={i}
                slug={slug}
                channel={portal.slug}
                product={bySlug.get(slug)}
                loading={loading}
                discount={discounts.get(slug)}
                cuts={cuts.get(slug)}
                sales={sales}
                onSaveCatalog={onSaveCatalog}
                slugs={slugs}
              />
            ))}
          </ul>
          {onSaveCatalog && <AddProduct slugs={slugs} onSave={onSaveCatalog} />}
        </Section>
      </div>

      {/* Il kit editabile vive nel pannello portali (BundleCard): qui la vista
          read-only, per chi guarda il portale dal catalogo. */}
      {!onSaveCatalog && portal.bundles.length > 0 && (
        <div className="py-5">
          <Section title={`Kit (${portal.bundles.length})`}>
            <ul className="flex flex-col gap-0.5">
              {portal.bundles.map((b) => (
                <KitRow key={b.slug} bundle={b} bySlug={bySlug} />
              ))}
            </ul>
          </Section>
        </div>
      )}

      <div className="py-5">
        <Section title="Vendita fuori dal kit">
          <InfoRow
            label="Prodotti hero"
            value={portal.catalog.heroOutsideBundle ? "Sì" : "No"}
          />
          <InfoRow
            label="Accessori"
            value={portal.catalog.accessoriesOutsideBundle ? "Sì" : "No"}
          />
        </Section>
      </div>
    </>
  );
}

function PortalProductRow({
  index,
  slug,
  channel,
  product,
  loading,
  discount,
  cuts,
  sales,
  slugs,
  onSaveCatalog,
}: {
  index: number;
  slug: string;
  channel: string;
  product: Product | undefined;
  loading: boolean;
  discount: Discount | undefined;
  cuts: string[] | undefined;
  sales: SalesIndex;
  slugs: string[];
  onSaveCatalog?: (next: string[]) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  // Prezzo e vendite su QUESTO portale: la riga di portalRows che ha il nostro
  // canale (se non c'e', il prodotto e' in catalogo ma non listato su Saleor).
  const row = product ? portalRows(product, {}, sales).find((r) => r.slug === channel) : undefined;

  const remove = async () => {
    setBusy(true);
    try {
      await onSaveCatalog?.(slugs.filter((s) => s !== slug));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className="studio-row-in group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--studio-glass-surface)]"
      style={{ animationDelay: `${Math.min(index, 8) * 20}ms` }}
    >
      <ProductThumbnail src={product?.imageUrl ?? null} className="h-9 w-9 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--color-ink)]">
          {product?.name ?? slug}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {discount && <Badge tone="accent">{formatDiscount(discount)}</Badge>}
          {cuts?.map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
          {!row && !loading && (
            <span className="text-xs text-[var(--color-ink-muted)]">non listato</span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-right text-sm tabular-nums">
        {row?.priceFrom ? (
          <VariantPricesPopover
            label={`da ${eur(row.priceEur)}`}
            rows={variantPricesOn(product!, channel)}
          />
        ) : (
          <span className="font-medium">{eur(row?.priceEur ?? null)}</span>
        )}
        <span className="ml-2 text-xs text-[var(--color-ink-muted)]">
          {row && row.sales > 0 ? `${row.sales} vend.` : "—"}
        </span>
      </span>
      {onSaveCatalog && (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label={`Rimuovi ${slug}`}
          className="shrink-0 text-[var(--color-ink-muted)] opacity-0 transition-opacity hover:text-[var(--color-critical)] group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

// Kit read-only: prezzo finale e componenti nel popover (il voucher reale sta in
// Saleor e lo legge solo Price Guard, qui non lo mostriamo).
function KitRow({
  bundle,
  bySlug,
}: {
  bundle: PortalDetail["bundles"][number];
  bySlug: Map<string, Product>;
}) {
  const components = (bundle.components ?? []) as Array<Record<string, unknown>>;
  const hero = bySlug.get(componentProductSlug(components[0] ?? {}));

  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-1.5">
      <ProductThumbnail src={hero?.imageUrl ?? null} className="h-9 w-9 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--color-ink)]">{bundle.name}</p>
        <Popover
          label={`Componenti di ${bundle.name}`}
          trigger={
            <span className="text-xs text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-2">
              {components.length} componenti
            </span>
          }
        >
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
            Componenti
          </p>
          <ul className="flex flex-col gap-1">
            {components.map((c, i) => {
              const cslug = componentProductSlug(c);
              return (
                <li key={`${cslug}-${i}`} className="text-sm text-[var(--color-ink)]">
                  {bySlug.get(cslug)?.name ?? componentLabel(c)}
                </li>
              );
            })}
          </ul>
        </Popover>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {eur(bundle.finalPriceEur)}
      </span>
    </li>
  );
}

// Picker "+ Aggiungi": lista dei prodotti Saleor non ancora nel catalogo.
function AddProduct({
  slugs,
  onSave,
}: {
  slugs: string[];
  onSave: (next: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState<SaleorProduct[] | null>(null);
  const [busy, setBusy] = useState(false);

  const loadAvailable = useCallback(async () => {
    if (available) return;
    const res = await fetch("/api/portals/_catalog");
    if (res.ok) setAvailable((await res.json()) as SaleorProduct[]);
  }, [available]);

  const add = async (slug: string) => {
    if (slugs.includes(slug)) return;
    setBusy(true);
    try {
      await onSave([...slugs, slug]);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const candidates = (available ?? []).filter((p) => !slugs.includes(p.slug));

  return (
    <div className="mt-1 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          void loadAvailable();
        }}
        className="inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <Plus className="h-3 w-3" /> Aggiungi
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-soft)]">
          {available === null ? (
            <p className="p-2 text-xs text-[var(--color-ink-muted)]">Caricamento...</p>
          ) : candidates.length === 0 ? (
            <p className="p-2 text-xs text-[var(--color-ink-muted)]">
              Tutti i prodotti sono gia&apos; nel catalogo.
            </p>
          ) : (
            candidates.map((p) => (
              <button
                key={p.id ?? p.slug}
                type="button"
                onClick={() => add(p.slug)}
                disabled={busy}
                className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs hover:bg-[var(--color-paper-muted)]"
              >
                <span className="truncate text-[var(--color-ink)]">{p.name}</span>
                <span className="ml-2 shrink-0 font-mono text-[10px] text-[var(--color-ink-muted)]">
                  {p.slug}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
