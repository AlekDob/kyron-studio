"use client";

import { lazy, Suspense, type ReactElement } from "react";
import type {
  GenerativeDescriptor,
  GenerativeSubmission,
} from "./types";
import { rowId } from "./ProductPickerRow";

// Lazy: ogni componente generativo e' un chunk separato. Domani aggiungiamo
// BundleBuilder, DiscountConfig, Summary qui senza toccare nessun altro file.
const ProductPicker = lazy(() =>
  import("./ProductPicker").then((m) => ({ default: m.ProductPicker })),
);
const BundleBuilder = lazy(() =>
  import("./BundleBuilder").then((m) => ({ default: m.BundleBuilder })),
);
const LogoUploader = lazy(() =>
  import("./LogoUploader").then((m) => ({ default: m.LogoUploader })),
);
// Modulo Agevolazioni (IVA 4% L.104)
const DocUploader = lazy(() =>
  import("./DocUploader").then((m) => ({ default: m.DocUploader })),
);
const DocCheckReport = lazy(() =>
  import("./DocCheckReport").then((m) => ({ default: m.DocCheckReport })),
);
const VatReliefDecision = lazy(() =>
  import("./VatReliefDecision").then((m) => ({ default: m.VatReliefDecision })),
);
const VatReliefCase = lazy(() =>
  import("@/components/vat-relief/VatReliefCase").then((m) => ({ default: m.VatReliefCase })),
);
// Card grafico condivisa dal core: qualunque agente le passa colonne + righe
// e il tipo di disegno (timeline, columns, bars, pie, table).
const Chart = lazy(() =>
  import("@studiofuturo/studio-core").then((m) => ({ default: m.ChartCard })),
);
// Modulo Statistiche: campagne Meta (Ada marketing manager)
const MetaCampaignsCard = lazy(() =>
  import("./MetaCampaignsCard").then((m) => ({ default: m.MetaCampaignsCard })),
);
// Modulo Catalogo (Nico): piano prezzi da confermare
const PricePlanCard = lazy(() =>
  import("./PricePlanCard").then((m) => ({ default: m.PricePlanCard })),
);
// Modulo Catalogo: import listino Danea
const DaneaUploader = lazy(() =>
  import("./DaneaUploader").then((m) => ({ default: m.DaneaUploader })),
);
const DaneaImportPlan = lazy(() =>
  import("./DaneaImportPlan").then((m) => ({ default: m.DaneaImportPlan })),
);
// Modulo Catalogo: comunicazione ai clienti dai DDT Danea
const DdtMailPlan = lazy(() =>
  import("./DdtMailPlan").then((m) => ({ default: m.DdtMailPlan })),
);
// Modulo Ordini (Nico): ricevuta di cosa ha filtrato o aperto nel pannello
const OrdersReceipt = lazy(() =>
  import("./OrdersReceipt").then((m) => ({ default: m.OrdersReceipt })),
);
// Modulo Prodotti (Teo): ricevuta di cosa ha filtrato o aperto nel pannello
const ProductsReceipt = lazy(() =>
  import("./ProductsReceipt").then((m) => ({ default: m.ProductsReceipt })),
);
// Modulo Portali (Livia): ricevuta di cosa ha filtrato o aperto nel pannello
// Modulo Clienti (Bea): ricevuta di cosa ha filtrato o aperto nel pannello
const CustomersReceipt = lazy(() =>
  import("./CustomersReceipt").then((m) => ({ default: m.CustomersReceipt })),
);
// Modulo Richieste (Ivo): ricevuta del pannello + bozza del ticket da confermare
const RequestsReceipt = lazy(() =>
  import("./RequestsReceipt").then((m) => ({ default: m.RequestsReceipt })),
);
const RequestDraft = lazy(() =>
  import("./RequestDraft").then((m) => ({ default: m.RequestDraft })),
);
const PortalsReceipt = lazy(() =>
  import("./PortalsReceipt").then((m) => ({ default: m.PortalsReceipt })),
);
const AnomalyReport = lazy(() =>
  import("./AnomalyReport").then((m) => ({ default: m.AnomalyReport })),
);

const COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<Record<string, unknown>>
> = {
  ProductPicker: ProductPicker as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  BundleBuilder: BundleBuilder as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  LogoUploader: LogoUploader as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  AnomalyReport: AnomalyReport as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  Chart: Chart as unknown as React.ComponentType<Record<string, unknown>>,
  MetaCampaignsCard: MetaCampaignsCard as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  DocUploader: DocUploader as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  DocCheckReport: DocCheckReport as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  VatReliefDecision: VatReliefDecision as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  VatReliefCase: VatReliefCase as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  PricePlanCard: PricePlanCard as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  DaneaUploader: DaneaUploader as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  DaneaImportPlan: DaneaImportPlan as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  DdtMailPlan: DdtMailPlan as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  OrdersReceipt: OrdersReceipt as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  ProductsReceipt: ProductsReceipt as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  PortalsReceipt: PortalsReceipt as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  CustomersReceipt: CustomersReceipt as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  RequestsReceipt: RequestsReceipt as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  RequestDraft: RequestDraft as unknown as React.ComponentType<
    Record<string, unknown>
  >,
};

export function isRegisteredComponent(name: string): boolean {
  return name in COMPONENT_REGISTRY;
}

interface GenerativeRendererProps {
  descriptor: GenerativeDescriptor;
  readOnly?: boolean;
  disabled?: boolean;
  initialSubmission?: GenerativeSubmission | null;
  onSubmit?: (submission: GenerativeSubmission) => void;
}

export function GenerativeRenderer(props: GenerativeRendererProps): ReactElement {
  const { descriptor, readOnly, disabled, initialSubmission, onSubmit } = props;
  const Component = COMPONENT_REGISTRY[descriptor.component];

  if (!Component) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] p-3 text-xs text-[var(--color-ink-muted)]">
        Componente generativo sconosciuto: <code>{descriptor.component}</code>
      </div>
    );
  }

  const handleSubmit = (data: unknown): void => {
    onSubmit?.({
      id: descriptor.id,
      component: descriptor.component,
      data,
    });
  };

  const initialPropsFromSubmission =
    initialSubmission && initialSubmission.id === descriptor.id
      ? extractInitialProps(descriptor.component, initialSubmission.data)
      : {};

  return (
    <Suspense fallback={<GenerativeSkeleton />}>
      <Component
        {...descriptor.props}
        {...initialPropsFromSubmission}
        readOnly={readOnly ?? Boolean(initialSubmission)}
        disabled={disabled ?? false}
        onSubmit={handleSubmit}
      />
    </Suspense>
  );
}

function GenerativeSkeleton(): ReactElement {
  return (
    <div
      aria-busy="true"
      className="h-32 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)]"
    />
  );
}

function extractInitialProps(
  component: string,
  data: unknown,
): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const d = data as Record<string, unknown>;
  // Le submission portano selezioni/componenti come {slug, capacitySlug?,
  // variantSku?}; il replay readonly preseleziona per chiave-riga (rowId).
  const toRowIds = (rows: unknown): string[] =>
    Array.isArray(rows)
      ? rows.map((r) => {
          const o = r as {
            slug: string;
            capacitySlug?: string;
            variantSku?: string;
          };
          return rowId(o.slug, o.capacitySlug, o.variantSku);
        })
      : [];
  if (component === "ProductPicker") {
    if (Array.isArray(d.selections)) {
      return {
        initialSelection: toRowIds(d.selections),
        initialDiscounts: Array.isArray(d.productDiscounts)
          ? d.productDiscounts
          : [],
      };
    }
  }
  if (component === "BundleBuilder") {
    const out: Record<string, unknown> = {};
    if (typeof d.name === "string") out.initialName = d.name;
    if (typeof d.priceEur === "number") out.initialPriceEur = d.priceEur;
    if (Array.isArray(d.components)) out.initialComponents = toRowIds(d.components);
    return out;
  }
  if (component === "LogoUploader") {
    if (typeof d.uploaded === "boolean") {
      return { initialUploaded: d.uploaded };
    }
  }
  return {};
}
